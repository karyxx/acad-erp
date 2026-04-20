import strawberry
from typing import Optional, List
from datetime import date
from sqlmodel import select
from .model import (
    AssessmentComponents as AssessmentComponentModel,
    StudentMarks as StudentMarksModel,
    GradeRules as GradeRuleModel,
    StudentGrades as StudentGradeModel,
    StudentSemesterResults as StudentSemesterResultModel
)
from core.security import IsAuthenticated, IsAdmin, IsFaculty, IsStudent, is_elevated_role, check_user_ownership

@strawberry.type
class AssessmentComponentType:
    id: int
    offering_id: int
    name: str
    max_marks: float
    weightage_pct: Optional[float]
    conducted_on: Optional[date]

@strawberry.type
class StudentMarksType:
    id: int
    component_id: int
    student_id: int
    marks_obtained: Optional[float]
    is_absent: bool
    entered_by: Optional[int]

@strawberry.type
class GradeRuleType:
    id: int
    program_id: int
    grade_letter: str
    min_percentage: float
    max_percentage: float
    grade_point: float

@strawberry.type
class StudentGradeType:
    id: int
    offering_id: int
    student_id: int
    total_marks: Optional[float]
    grade_letter: Optional[str]
    grade_point: Optional[float]
    is_published: bool

@strawberry.type
class StudentSemesterResultType:
    id: int
    student_id: int
    semester_id: int
    sgpa: Optional[float]
    cgpa: Optional[float]
    total_credits_earned: Optional[float]

@strawberry.type
class AssessmentsQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_assessment_components(self, info: strawberry.Info, offering_id: int) -> List[AssessmentComponentType]:
        session = info.context["session"]
        components = session.exec(select(AssessmentComponentModel).where(AssessmentComponentModel.offering_id == offering_id)).all()
        return [AssessmentComponentType(**c.dict()) for c in components]

    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_student_marks(self, info: strawberry.Info, student_id: int, component_id: Optional[int] = None) -> List[StudentMarksType]:
        session = info.context["session"]
        if not is_elevated_role(info):
            from models.organization.model import StudentProfiles
            student = session.get(StudentProfiles, student_id)
            if student:
                check_user_ownership(info, student.user_id)
        query = select(StudentMarksModel).where(StudentMarksModel.student_id == student_id)
        if component_id is not None:
            query = query.where(StudentMarksModel.component_id == component_id)
        marks = session.exec(query).all()
        return [StudentMarksType(**m.dict(exclude={"entered_at"})) for m in marks]

    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_grade_rules(self, info: strawberry.Info, program_id: int) -> List[GradeRuleType]:
        session = info.context["session"]
        rules = session.exec(select(GradeRuleModel).where(GradeRuleModel.program_id == program_id)).all()
        return [GradeRuleType(**r.dict()) for r in rules]

    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_student_semester_result(self, info: strawberry.Info, student_id: int, semester_id: int) -> Optional[StudentSemesterResultType]:
        session = info.context["session"]
        if not is_elevated_role(info):
            from models.organization.model import StudentProfiles
            student = session.get(StudentProfiles, student_id)
            if student:
                check_user_ownership(info, student.user_id)
        result = session.exec(
            select(StudentSemesterResultModel)
            .where(StudentSemesterResultModel.student_id == student_id)
            .where(StudentSemesterResultModel.semester_id == semester_id)
        ).first()
        return StudentSemesterResultType(**result.dict()) if result else None

    @strawberry.field(permission_classes=[IsAuthenticated, IsStudent])
    def calculate_target_sgpa(self, info: strawberry.Info, student_id: int, target_cgpa: float, next_semester_credits: float) -> Optional[float]:
        session = info.context["session"]
        if not is_elevated_role(info):
            from models.organization.model import StudentProfiles
            student = session.get(StudentProfiles, student_id)
            if student:
                check_user_ownership(info, student.user_id)
                
        # Find latest results for student to get current CGPA and Credits
        results = session.exec(
            select(StudentSemesterResultModel)
            .where(StudentSemesterResultModel.student_id == student_id)
            .order_by(StudentSemesterResultModel.id.desc())
        ).all()
        
        if not results or results[0].cgpa is None or results[0].total_credits_earned is None:
            # If no history, target SGPA is just target CGPA
            return target_cgpa

        current_cgpa = results[0].cgpa
        current_credits = results[0].total_credits_earned
        
        if next_semester_credits <= 0:
            return None
            
        total_future_credits = current_credits + next_semester_credits
        required_points = (target_cgpa * total_future_credits) - (current_cgpa * current_credits)
        required_sgpa = required_points / next_semester_credits
        
        return round(required_sgpa, 2)

@strawberry.type
class AssessmentsMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated, IsFaculty])
    def create_assessment_component(self, info: strawberry.Info, offering_id: int, name: str, max_marks: float, weightage_pct: Optional[float] = None, conducted_on: Optional[date] = None) -> AssessmentComponentType:
        session = info.context["session"]
        new_component = AssessmentComponentModel(offering_id=offering_id, name=name, max_marks=max_marks, weightage_pct=weightage_pct, conducted_on=conducted_on)
        session.add(new_component)
        session.commit()
        session.refresh(new_component)
        return AssessmentComponentType(**new_component.dict())

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsFaculty])
    def record_student_marks(self, info: strawberry.Info, component_id: int, student_id: int, marks_obtained: Optional[float] = None, is_absent: bool = False, entered_by: Optional[int] = None) -> StudentMarksType:
        session = info.context["session"]
        # Allow updating if already exists
        existing_marks = session.exec(
            select(StudentMarksModel)
            .where(StudentMarksModel.component_id == component_id)
            .where(StudentMarksModel.student_id == student_id)
        ).first()
        
        if existing_marks:
            existing_marks.marks_obtained = marks_obtained
            existing_marks.is_absent = is_absent
            existing_marks.entered_by = entered_by
            session.add(existing_marks)
            session.commit()
            session.refresh(existing_marks)
            return StudentMarksType(**existing_marks.dict(exclude={"entered_at"}))
        else:
            new_marks = StudentMarksModel(component_id=component_id, student_id=student_id, marks_obtained=marks_obtained, is_absent=is_absent, entered_by=entered_by)
            session.add(new_marks)
            session.commit()
            session.refresh(new_marks)
            return StudentMarksType(**new_marks.dict(exclude={"entered_at"}))

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsAdmin])
    def create_grade_rule(self, info: strawberry.Info, program_id: int, grade_letter: str, min_percentage: float, max_percentage: float, grade_point: float) -> GradeRuleType:
        session = info.context["session"]
        new_rule = GradeRuleModel(program_id=program_id, grade_letter=grade_letter, min_percentage=min_percentage, max_percentage=max_percentage, grade_point=grade_point)
        session.add(new_rule)
        session.commit()
        session.refresh(new_rule)
        return GradeRuleType(**new_rule.dict())

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsFaculty])
    def calculate_and_store_grades(self, info: strawberry.Info, offering_id: int, student_id: int, total_marks: float, grade_letter: str, grade_point: float) -> StudentGradeType:
        session = info.context["session"]
        # Simplified manual storage logic
        existing_grade = session.exec(
            select(StudentGradeModel)
            .where(StudentGradeModel.offering_id == offering_id)
            .where(StudentGradeModel.student_id == student_id)
        ).first()

        if existing_grade:
            existing_grade.total_marks = total_marks
            existing_grade.grade_letter = grade_letter
            existing_grade.grade_point = grade_point
            session.add(existing_grade)
            session.commit()
            session.refresh(existing_grade)
            return StudentGradeType(**existing_grade.dict(exclude={"published_at"}))
        else:
            new_grade = StudentGradeModel(offering_id=offering_id, student_id=student_id, total_marks=total_marks, grade_letter=grade_letter, grade_point=grade_point)
            session.add(new_grade)
            session.commit()
            session.refresh(new_grade)
            return StudentGradeType(**new_grade.dict(exclude={"published_at"}))

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsAdmin])
    def delete_assessment_component(self, info: strawberry.Info, id: int) -> bool:
        session = info.context["session"]
        c = session.get(AssessmentComponentModel, id)
        if c:
            session.delete(c)
            session.commit()
            return True
        return False

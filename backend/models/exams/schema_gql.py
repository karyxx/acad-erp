import strawberry
from typing import Optional, List
from datetime import date

@strawberry.type
class ExamType:
    id: int
    name: str
    exam_type: str

@strawberry.type
class ExamScheduleType:
    id: int
    exam_id: int
    course_id: int
    exam_date: date

@strawberry.type
class ExamsQuery:
    @strawberry.field
    def semester_exams(self, semester_id: int) -> List[ExamType]:
        return []

@strawberry.type
class ExamsMutation:
    @strawberry.mutation
    def schedule_exam(self, exam_id: int, course_id: int, exam_date: date) -> ExamScheduleType:
        pass

from typing import Optional
from datetime import date, datetime, timezone
from sqlmodel import SQLModel, Field

class AssessmentComponents(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    offering_id: int = Field(foreign_key="courseofferings.id")
    name: str
    max_marks: float
    weightage_pct: Optional[float] = None
    conducted_on: Optional[date] = None

class StudentMarks(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    component_id: int = Field(foreign_key="assessmentcomponents.id")
    student_id: int = Field(foreign_key="studentprofiles.id")
    marks_obtained: Optional[float] = None
    is_absent: bool = Field(default=False)
    entered_by: Optional[int] = Field(default=None, foreign_key="facultyprofiles.id")
    entered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GradeRules(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="programs.id")
    grade_letter: str
    min_percentage: float
    max_percentage: float
    grade_point: float

class StudentGrades(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    offering_id: int = Field(foreign_key="courseofferings.id")
    student_id: int = Field(foreign_key="studentprofiles.id")
    total_marks: Optional[float] = None
    grade_letter: Optional[str] = None
    grade_point: Optional[float] = None
    is_published: bool = Field(default=False)
    published_at: Optional[datetime] = None

class StudentSemesterResults(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="studentprofiles.id")
    semester_id: int = Field(foreign_key="semesters.id")
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None
    total_credits_earned: Optional[float] = None

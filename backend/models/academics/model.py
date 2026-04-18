from typing import Optional, List
from datetime import date
from sqlmodel import SQLModel, Field

class Programs(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)
    name: str
    department_id: int = Field(foreign_key="departments.id")
    duration_years: int
    degree_type: str

class Semesters(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="programs.id")
    number: int
    start_date: date
    end_date: date
    academic_calendar_url: Optional[str] = None
    is_current: bool = Field(default=False)

class Batches(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="programs.id")
    name: str
    year: int
    label: str

class BatchEnrollments(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="studentprofiles.id")
    batch_id: int = Field(foreign_key="batches.id")
    semester_id: int = Field(foreign_key="semesters.id")
    enrolled_on: date = Field(default_factory=date.today)
    status: str = Field(default="active")

class Courses(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)
    name: str
    department_id: int = Field(foreign_key="departments.id")
    credits: float
    course_type: str = Field(default="core")
    description: Optional[str] = None

class CourseOfferings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="courses.id")
    semester_id: int = Field(foreign_key="semesters.id")
    batch_id: int = Field(foreign_key="batches.id")
    syllabus_url: Optional[str] = None

class OfferingFaculty(SQLModel, table=True):
    offering_id: int = Field(foreign_key="courseofferings.id", primary_key=True)
    faculty_id: int = Field(foreign_key="facultyprofiles.id", primary_key=True)
    role: str = Field(default="instructor")

class SemesterRegistrations(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="studentprofiles.id")
    semester_id: int = Field(foreign_key="semesters.id")
    institute_fee_paid: bool = Field(default=False)
    hostel_fee_paid: bool = Field(default=False)
    total_credits: float = Field(default=0.0)
    status: str = Field(default="pending")

class SubjectRegistrations(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    registration_id: int = Field(foreign_key="semesterregistrations.id")
    course_offering_id: int = Field(foreign_key="courseofferings.id")
    is_backlog: bool = Field(default=False)

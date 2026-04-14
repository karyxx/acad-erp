from typing import Optional
from datetime import date, time
from sqlmodel import SQLModel, Field

class Exams(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    semester_id: int = Field(foreign_key="semesters.id")
    name: str
    exam_type: str
    status: str = Field(default="scheduled")

class ExamSchedules(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id")
    course_id: int = Field(foreign_key="courses.id")
    room_id: Optional[int] = Field(default=None, foreign_key="rooms.id")
    exam_date: date
    start_time: time
    end_time: time

class ExamResults(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_schedule_id: int = Field(foreign_key="examschedules.id")
    student_id: int = Field(foreign_key="studentprofiles.id")
    marks_obtained: Optional[float] = None
    is_absent: bool = Field(default=False)
    is_published: bool = Field(default=False)

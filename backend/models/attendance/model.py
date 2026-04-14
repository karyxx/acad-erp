from typing import Optional
from datetime import date, time, datetime, timezone
from sqlmodel import SQLModel, Field

class AttendanceSessions(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    offering_id: int = Field(foreign_key="courseofferings.id")
    session_date: date
    start_time: time
    end_time: time
    conducted_by: int = Field(foreign_key="facultyprofiles.id")
    method: str = Field(default="manual")

class AttendanceRecords(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="attendancesessions.id")
    student_id: int = Field(foreign_key="studentprofiles.id")
    status: str
    marked_by: Optional[int] = Field(default=None, foreign_key="facultyprofiles.id")
    marked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

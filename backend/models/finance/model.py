from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class StudentFees(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="studentprofiles.id")
    semester_id: int = Field(foreign_key="semesters.id")
    amount: float
    status: str = Field(default="unpaid")
    receipt_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

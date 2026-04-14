from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class CourseFacultyFeedbackLinks(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    offering_id: int = Field(foreign_key="courseofferings.id")
    faculty_id: int = Field(foreign_key="facultyprofiles.id")
    form_url: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

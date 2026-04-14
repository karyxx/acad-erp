from typing import Optional, List
from datetime import date, datetime, timezone
from sqlmodel import SQLModel, Field

class Departments(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    name: str = Field(unique=True)
    hod_id: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FacultyProfiles(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, foreign_key="users.id")
    employee_id: str = Field(unique=True)
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    department_id: int = Field(foreign_key="departments.id")
    title: Optional[str] = None
    bio: Optional[str] = None
    join_date: Optional[date] = None
    is_active: bool = Field(default=True)

class StudentProfiles(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, foreign_key="users.id")
    roll_number: str = Field(unique=True)
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    target_cgpa: Optional[float] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

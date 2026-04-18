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
    
    # Newly added fields based on Student Personal Information form
    blood_group: Optional[str] = None
    family_annual_income: Optional[float] = None
    father_name: Optional[str] = None
    father_profession: Optional[str] = None
    mother_name: Optional[str] = None
    mother_profession: Optional[str] = None
    parent_mobile: Optional[str] = None
    parent_email: Optional[str] = None
    category: Optional[str] = None  # General, SC, ST, OBC, EWS, PWD
    marital_status: Optional[str] = None
    religion: Optional[str] = None
    home_address_city: Optional[str] = None
    home_address_district: Optional[str] = None
    home_address_state: Optional[str] = None
    home_address_pincode: Optional[str] = None
    residential_background: Optional[str] = None  # Rural, Urban, Metropolitan
    hostel_name: Optional[str] = None
    hostel_room_no: Optional[str] = None
    aadhar_number: Optional[str] = None
    abc_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_mobile: Optional[str] = None
    bank_name: Optional[str] = None
    bank_address: Optional[str] = None
    bank_account_no: Optional[str] = None
    local_guardian: Optional[str] = None

    department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

import strawberry
from typing import Optional, List
from datetime import date

@strawberry.type
class DepartmentType:
    id: int
    code: str
    name: str
    hod_id: Optional[int]

@strawberry.type
class FacultyProfileType:
    id: int
    user_id: int
    employee_id: str
    first_name: str
    last_name: str
    title: Optional[str]
    department_id: int

@strawberry.type
class StudentProfileType:
    id: int
    user_id: int
    roll_number: str
    first_name: str
    last_name: str
    department_id: Optional[int]
    target_cgpa: Optional[float]
    blood_group: Optional[str]
    family_annual_income: Optional[float]
    father_name: Optional[str]
    father_profession: Optional[str]
    mother_name: Optional[str]
    mother_profession: Optional[str]
    parent_mobile: Optional[str]
    parent_email: Optional[str]
    category: Optional[str]
    marital_status: Optional[str]
    religion: Optional[str]
    home_address_city: Optional[str]
    home_address_district: Optional[str]
    home_address_state: Optional[str]
    home_address_pincode: Optional[str]
    residential_background: Optional[str]
    hostel_name: Optional[str]
    hostel_room_no: Optional[str]
    aadhar_number: Optional[str]
    abc_id: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_mobile: Optional[str]
    bank_name: Optional[str]
    bank_address: Optional[str]
    bank_account_no: Optional[str]
    local_guardian: Optional[str]

@strawberry.type
class OrganizationQuery:
    @strawberry.field
    def departments(self) -> List[DepartmentType]:
        return []

    @strawberry.field
    def faculty(self, id: int) -> Optional[FacultyProfileType]:
        return None

    @strawberry.field
    def student(self, id: int) -> Optional[StudentProfileType]:
        return None

@strawberry.type
class OrganizationMutation:
    @strawberry.mutation
    def create_department(self, code: str, name: str) -> DepartmentType:
        pass

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

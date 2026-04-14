import strawberry
from typing import Optional, List
from datetime import date

@strawberry.type
class ProgramType:
    id: int
    code: str
    name: str
    degree_type: str

@strawberry.type
class SemesterType:
    id: int
    number: int
    academic_calendar_url: Optional[str]

@strawberry.type
class CourseType:
    id: int
    code: str
    name: str
    credits: float

@strawberry.type
class BatchType:
    id: int
    name: str
    year: int
    label: str

@strawberry.type
class AcademicsQuery:
    @strawberry.field
    def programs(self) -> List[ProgramType]:
        return []

    @strawberry.field
    def courses(self) -> List[CourseType]:
        return []

@strawberry.type
class AcademicsMutation:
    @strawberry.mutation
    def create_course(self, code: str, name: str, credits: float, department_id: int) -> CourseType:
        pass

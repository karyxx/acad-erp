import strawberry
from typing import Optional, List
from datetime import date, time

@strawberry.type
class AttendanceSessionType:
    id: int
    offering_id: int
    session_date: date
    conducted_by: int

@strawberry.type
class AttendanceRecordType:
    id: int
    student_id: int
    status: str

@strawberry.type
class AttendanceQuery:
    @strawberry.field
    def session_attendance(self, session_id: int) -> List[AttendanceRecordType]:
        return []

@strawberry.type
class AttendanceMutation:
    @strawberry.mutation
    def mark_attendance(self, session_id: int, student_id: int, status: str) -> AttendanceRecordType:
        pass

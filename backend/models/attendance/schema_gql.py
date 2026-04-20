import strawberry
from typing import Optional, List
from datetime import date, time
from sqlmodel import select
from .model import AttendanceSessions, AttendanceRecords
from core.security import IsAuthenticated, IsFaculty

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
class LowAttendanceStudent:
    student_id: int
    attendance_percentage: float

@strawberry.type
class AttendanceQuery:
    @strawberry.field
    def session_attendance(self, session_id: int) -> List[AttendanceRecordType]:
        return []

    @strawberry.field(permission_classes=[IsAuthenticated, IsFaculty])
    def get_low_attendance_students(self, info: strawberry.Info, offering_id: int, threshold_pct: float = 75.0) -> List[LowAttendanceStudent]:
        session = info.context["session"]
        
        sessions = session.exec(select(AttendanceSessions).where(AttendanceSessions.offering_id == offering_id)).all()
        session_ids = [s.id for s in sessions]
        
        if not session_ids:
            return []
            
        records = session.exec(select(AttendanceRecords).where(AttendanceRecords.session_id.in_(session_ids))).all()
        
        student_attendance = {}
        for r in records:
            if r.student_id not in student_attendance:
                student_attendance[r.student_id] = {"present": 0, "total": 0}
            student_attendance[r.student_id]["total"] += 1
            if r.status.lower() == "present":
                student_attendance[r.student_id]["present"] += 1
                
        low_attendance_students = []
        for student_id, stats in student_attendance.items():
            if stats["total"] > 0:
                pct = (stats["present"] / stats["total"]) * 100
                if pct < threshold_pct:
                    low_attendance_students.append(LowAttendanceStudent(student_id=student_id, attendance_percentage=pct))
                    
        return low_attendance_students

@strawberry.type
class AttendanceMutation:
    @strawberry.mutation
    def mark_attendance(self, session_id: int, student_id: int, status: str) -> AttendanceRecordType:
        pass

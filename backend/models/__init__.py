# Import all models here so that SQLModel.metadata.create_all(engine)
# can find them and create the tables in the database.

from .identity import Users, Roles, UserRoles
from .organization import Departments, FacultyProfiles, StudentProfiles
from .academics import Programs, Semesters, Batches, BatchEnrollments, Courses, CourseOfferings, OfferingFaculty, SemesterRegistrations, SubjectRegistrations
from .scheduling import Rooms, TimetableSlots
from .attendance import AttendanceSessions, AttendanceRecords
from .assessments import AssessmentComponents, StudentMarks, GradeRules, StudentGrades, StudentSemesterResults
from .exams import Exams, ExamSchedules, ExamResults
from .feedback import CourseFacultyFeedbackLinks
from .finance import StudentFees
from .schema_gql import schema

__all__ = [
    "Users", "Roles", "UserRoles",
    "Departments", "FacultyProfiles", "StudentProfiles",
    "Programs", "Semesters", "Batches", "BatchEnrollments", "Courses", "CourseOfferings", "OfferingFaculty", "SemesterRegistrations", "SubjectRegistrations",
    "Rooms", "TimetableSlots",
    "AttendanceSessions", "AttendanceRecords",
    "AssessmentComponents", "StudentMarks", "GradeRules", "StudentGrades", "StudentSemesterResults",
    "Exams", "ExamSchedules", "ExamResults",
    "CourseFacultyFeedbackLinks",
    "StudentFees",
    "schema"
]

import strawberry
from .identity import IdentityQuery, IdentityMutation
from .organization import OrganizationQuery, OrganizationMutation
from .academics import AcademicsQuery, AcademicsMutation
from .scheduling import SchedulingQuery, SchedulingMutation
from .attendance import AttendanceQuery, AttendanceMutation
from .assessments import AssessmentsQuery, AssessmentsMutation
from .exams import ExamsQuery, ExamsMutation
from .feedback import FeedbackQuery, FeedbackMutation
from .finance import FinanceQuery, FinanceMutation

@strawberry.type
class Query(
    IdentityQuery,
    OrganizationQuery,
    AcademicsQuery,
    SchedulingQuery,
    AttendanceQuery,
    AssessmentsQuery,
    ExamsQuery,
    FeedbackQuery,
    FinanceQuery
):
    pass

@strawberry.type
class Mutation(
    IdentityMutation,
    OrganizationMutation,
    AcademicsMutation,
    SchedulingMutation,
    AttendanceMutation,
    AssessmentsMutation,
    ExamsMutation,
    FeedbackMutation,
    FinanceMutation
):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)

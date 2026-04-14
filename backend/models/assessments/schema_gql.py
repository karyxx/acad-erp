import strawberry
from typing import Optional, List

@strawberry.type
class AssessmentComponentType:
    id: int
    name: str
    max_marks: float

@strawberry.type
class GradeType:
    id: int
    student_id: int
    grade_letter: Optional[str]

@strawberry.type
class PerformanceInsights:
    class_average: float
    median: float
    quartile_1: float
    quartile_3: float
    student_rank: int
    required_sgpa_for_goal: Optional[float]

@strawberry.type
class AssessmentsQuery:
    @strawberry.field
    def get_insights(self, student_id: int, offering_id: int) -> PerformanceInsights:
        # Complex calculation logic will go here
        pass

@strawberry.type
class AssessmentsMutation:
    @strawberry.mutation
    def enter_marks(self, component_id: int, student_id: int, marks: float) -> bool:
        pass

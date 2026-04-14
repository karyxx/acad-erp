import strawberry
from typing import Optional, List

@strawberry.type
class FeedbackLinkType:
    id: int
    offering_id: int
    faculty_id: int
    form_url: str
    is_active: bool

@strawberry.type
class FeedbackQuery:
    @strawberry.field
    def offering_feedback(self, offering_id: int) -> List[FeedbackLinkType]:
        return []

@strawberry.type
class FeedbackMutation:
    @strawberry.mutation
    def set_feedback_url(self, offering_id: int, faculty_id: int, url: str) -> FeedbackLinkType:
        pass

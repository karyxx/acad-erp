import strawberry
from typing import Optional, List

@strawberry.type
class StudentFeeType:
    id: int
    student_id: int
    semester_id: int
    amount: float
    status: str
    receipt_url: Optional[str]

@strawberry.type
class FinanceQuery:
    @strawberry.field
    def student_fees(self, student_id: int) -> List[StudentFeeType]:
        return []

@strawberry.type
class FinanceMutation:
    @strawberry.mutation
    def upload_receipt(self, fee_id: int, receipt_url: str) -> StudentFeeType:
        pass

import strawberry
from typing import Optional, List
from datetime import time

@strawberry.type
class RoomType:
    id: int
    code: str
    capacity: int

@strawberry.type
class TimetableSlotType:
    id: int
    offering_id: int
    day_of_week: int
    start_time: time
    end_time: time

@strawberry.type
class SchedulingQuery:
    @strawberry.field
    def rooms(self) -> List[RoomType]:
        return []

@strawberry.type
class SchedulingMutation:
    @strawberry.mutation
    def create_room(self, code: str, capacity: int) -> RoomType:
        pass

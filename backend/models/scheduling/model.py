from typing import Optional
from datetime import date, time
from sqlmodel import SQLModel, Field

class Rooms(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)
    building: Optional[str] = None
    capacity: int
    room_type: Optional[str] = None

class TimetableSlots(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    offering_id: int = Field(foreign_key="courseofferings.id")
    room_id: Optional[int] = Field(default=None, foreign_key="rooms.id")
    day_of_week: int
    start_time: time
    end_time: time
    effective_from: date
    effective_to: Optional[date] = None

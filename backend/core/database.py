# backend/app/core/database.py
from sqlmodel import SQLModel, Session, create_engine
from typing import Generator
from .config import db_url

engine = create_engine(db_url, echo=True)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
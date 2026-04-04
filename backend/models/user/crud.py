from typing import Optional
from sqlmodel import Session, select
from .model import Users

def create_user(session: Session, user: Users) -> Users:
    """
    Persist a new user to the database.
    Note: Password hashing should be handled before calling this function.
    """
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_user_by_username(session: Session, username: str) -> Optional[Users]:
    """
    Retrieve a user by their username.
    """
    statement = select(Users).where(Users.username == username)
    return session.exec(statement).first()

def get_user_by_id(session: Session, user_id: int) -> Optional[Users]:
    """
    Retrieve a user by their ID.
    """
    return session.get(Users, user_id)

def delete_user(session: Session, user_id: int) -> bool:
    """
    Delete a user by their ID.
    Returns True if deletion was successful, False otherwise.
    """
    user = session.get(Users, user_id)
    if user:
        session.delete(user)
        session.commit()
        return True
    return False

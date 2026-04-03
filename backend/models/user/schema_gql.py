import strawberry
from typing import Optional, List
from sqlmodel import Session
from .model import User as UserModel
from .crud import create_user, get_user_by_username, get_user_by_id, delete_user

@strawberry.type
class User:
    id: int
    username: str
    email: Optional[str]

@strawberry.type
class Query:
    @strawberry.field
    def get_user_by_username(self, info: strawberry.Info, username: str) -> Optional[User]:
        session: Session = info.context["session"]
        user = get_user_by_username(session, username)
        if user:
            return User(id=user.id, username=user.username, email=user.email)
        return None

    @strawberry.field
    def get_user_by_id(self, info: strawberry.Info, user_id: int) -> Optional[User]:
        session: Session = info.context["session"]
        user = get_user_by_id(session, user_id)
        if user:
            return User(id=user.id, username=user.username, email=user.email)
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_user(self, info: strawberry.Info, username: str, password: str, email: Optional[str] = None) -> User:
        session: Session = info.context["session"]
        # Note: Password hashing should be done here or in a service layer.
        # For now, we assume the crud.create_user takes the model as is.
        # But wait, the user said auth operations are separate.
        # So I should hash it here if it's not done in CRUD.
        # Let's import the hashing logic from auth.
        from auth.auth import pwd_context
        hashed_password = pwd_context.hash(password)
        
        user_model = UserModel(username=username, email=email, hashed_password=hashed_password)
        created_user = create_user(session, user_model)
        return User(id=created_user.id, username=created_user.username, email=created_user.email)

    @strawberry.mutation
    def delete_user(self, info: strawberry.Info, user_id: int) -> bool:
        session: Session = info.context["session"]
        return delete_user(session, user_id)

schema = strawberry.Schema(query=Query, mutation=Mutation)

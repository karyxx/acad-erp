import strawberry
from typing import Optional, List
from .model import Users as UserModel, Roles as RoleModel

@strawberry.type
class UserType:
    id: int
    email: str
    is_active: bool

@strawberry.type
class RoleType:
    id: int
    name: str
    description: Optional[str]

@strawberry.type
class IdentityQuery:
    @strawberry.field
    def get_user(self, info: strawberry.Info, user_id: int) -> Optional[UserType]:
        # Resolver logic will go here
        return None

    @strawberry.field
    def get_all_roles(self, info: strawberry.Info) -> List[RoleType]:
        # Resolver logic will go here
        return []

@strawberry.type
class IdentityMutation:
    @strawberry.mutation
    def create_user(self, info: strawberry.Info, email: str, password: str) -> UserType:
        # Resolver logic will go here
        pass

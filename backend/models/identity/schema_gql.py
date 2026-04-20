import strawberry
from typing import Optional, List
from sqlmodel import select
from .model import Users as UserModel, Roles as RoleModel, UserRoles as UserRoleModel
from core.security import IsAuthenticated, IsAdmin, check_user_ownership

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
class MeType:
    id: int
    email: str
    roles: List[str]

@strawberry.type
class IdentityQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_me(self, info: strawberry.Info) -> MeType:
        """Returns the currently authenticated user's info and roles."""
        user_id = info.context["user_id"]
        roles = info.context.get("roles", [])
        session = info.context["session"]
        user = session.get(UserModel, user_id)
        return MeType(id=user.id, email=user.email, roles=roles)

    @strawberry.field(permission_classes=[IsAuthenticated])
    def get_user(self, info: strawberry.Info, user_id: int) -> Optional[UserType]:
        check_user_ownership(info, user_id)
        session = info.context["session"]
        user = session.get(UserModel, user_id)
        if user:
            return UserType(id=user.id, email=user.email, is_active=user.is_active)
        return None

    @strawberry.field(permission_classes=[IsAuthenticated, IsAdmin])
    def get_users(self, info: strawberry.Info) -> List[UserType]:
        session = info.context["session"]
        users = session.exec(select(UserModel)).all()
        return [UserType(id=u.id, email=u.email, is_active=u.is_active) for u in users]

    @strawberry.field(permission_classes=[IsAuthenticated, IsAdmin])
    def get_role(self, info: strawberry.Info, role_id: int) -> Optional[RoleType]:
        session = info.context["session"]
        role = session.get(RoleModel, role_id)
        if role:
            return RoleType(id=role.id, name=role.name, description=role.description)
        return None

    @strawberry.field(permission_classes=[IsAuthenticated, IsAdmin])
    def get_roles(self, info: strawberry.Info) -> List[RoleType]:
        session = info.context["session"]
        roles = session.exec(select(RoleModel)).all()
        return [RoleType(id=r.id, name=r.name, description=r.description) for r in roles]

@strawberry.type
class IdentityMutation:
    @strawberry.mutation
    def create_user(self, info: strawberry.Info, email: str, password: str) -> UserType:
        from auth.auth import pwd_context
        session = info.context["session"]
        hashed_password = pwd_context.hash(password)
        new_user = UserModel(email=email, password_hash=hashed_password)
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return UserType(id=new_user.id, email=new_user.email, is_active=new_user.is_active)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def update_user(self, info: strawberry.Info, user_id: int, is_active: Optional[bool] = None, password: Optional[str] = None) -> Optional[UserType]:
        check_user_ownership(info, user_id)
        from auth.auth import pwd_context
        session = info.context["session"]
        user = session.get(UserModel, user_id)
        if not user:
            return None
        if is_active is not None:
            user.is_active = is_active
        if password is not None:
            user.password_hash = pwd_context.hash(password)
        session.add(user)
        session.commit()
        session.refresh(user)
        return UserType(id=user.id, email=user.email, is_active=user.is_active)

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsAdmin])
    def create_role(self, info: strawberry.Info, name: str, description: Optional[str] = None) -> RoleType:
        session = info.context["session"]
        new_role = RoleModel(name=name, description=description)
        session.add(new_role)
        session.commit()
        session.refresh(new_role)
        return RoleType(id=new_role.id, name=new_role.name, description=new_role.description)

    @strawberry.mutation(permission_classes=[IsAuthenticated, IsAdmin])
    def assign_role_to_user(self, info: strawberry.Info, user_id: int, role_id: int) -> bool:
        session = info.context["session"]
        user_role = UserRoleModel(user_id=user_id, role_id=role_id)
        session.add(user_role)
        session.commit()
        return True

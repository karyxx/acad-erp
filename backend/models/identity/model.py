from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

class Roles(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    
    user_links: List["UserRoles"] = Relationship(back_populates="role")

class Users(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    role_links: List["UserRoles"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "UserRoles.user_id"}
    )

class UserRoles(SQLModel, table=True):
    user_id: int = Field(foreign_key="users.id", primary_key=True)
    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    granted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    granted_by: Optional[int] = Field(default=None, foreign_key="users.id")

    user: "Users" = Relationship(
        back_populates="role_links",
        sa_relationship_kwargs={"foreign_keys": "UserRoles.user_id"}
    )
    role: "Roles" = Relationship(back_populates="user_links")
    
    granted_by_user: Optional["Users"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "UserRoles.granted_by"}
    )

import strawberry
from strawberry.permission import BasePermission
from typing import Any

class IsAuthenticated(BasePermission):
    message = "User is not authenticated"

    def has_permission(self, source: Any, info: strawberry.Info, **kwargs) -> bool:
        user_id = info.context.get("user_id")
        return user_id is not None

def HasRole(role_name: str):
    class RolePermission(BasePermission):
        message = f"Missing required role: {role_name}"

        def has_permission(self, source: Any, info: strawberry.Info, **kwargs) -> bool:
            roles = info.context.get("roles", [])
            if "Admin" in roles:
                return True
            return role_name in roles
    return RolePermission

# Aliases for common roles
IsAdmin = HasRole("Admin")
IsFaculty = HasRole("Faculty")
IsStudent = HasRole("Student")

def is_elevated_role(info: strawberry.Info) -> bool:
    """Check if the current user has Admin or Faculty roles."""
    roles = info.context.get("roles", [])
    return "Admin" in roles or "Faculty" in roles

def check_user_ownership(info: strawberry.Info, target_user_id: int) -> None:
    """
    Throws an exception if the target_user_id does not match the logged-in user,
    unless the logged-in user is an Admin.
    """
    current_user_id = info.context.get("user_id")
    roles = info.context.get("roles", [])
    if current_user_id != target_user_id and "Admin" not in roles:
        raise Exception("Unauthorized: You can only access your own data.")

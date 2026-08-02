"""Centralized RBAC matrix — deny by default"""

from app.models import UserRole, role_str

Permission = str

ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.ADMINISTRATOR: frozenset(
        {
            "admin.panel",
            "users.manage",
            "vacancy.create",
            "vacancy.update",
            "vacancy.delete",
            "vacancy.read",
            "resume.upload",
            "candidate.read",
        }
    ),
    UserRole.HR: frozenset(
        {
            "vacancy.create",
            "vacancy.update",
            "vacancy.delete",
            "vacancy.read",
            "resume.upload",
            "candidate.read",
        }
    ),
    UserRole.MANAGER: frozenset(
        {
            "vacancy.read",
            "candidate.read",
        }
    ),
    UserRole.RECRUITER: frozenset(
        {
            "vacancy.read",
            "resume.upload",
        }
    ),
    UserRole.CANDIDATE: frozenset(
        {
            "vacancy.read",
            "resume.upload",
            "candidate.read",
        }
    ),
}


def has_permission(role: UserRole | str, permission: Permission) -> bool:
    try:
        role_enum = role if isinstance(role, UserRole) else UserRole(role_str(role))
    except ValueError:
        return False
    return permission in ROLE_PERMISSIONS.get(role_enum, frozenset())

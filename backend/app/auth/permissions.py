"""RBAC helpers — permission checks are O(1) against JWT/token claims."""

from collections.abc import Collection

Permission = str


def has_permission(permissions: Collection[Permission], required: Permission) -> bool:
    """Return True if `required` is present in the granted permission set."""
    return required in permissions

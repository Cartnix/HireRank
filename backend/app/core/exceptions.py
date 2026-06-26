"""Application-specific exceptions."""


class HireAIError(Exception):
    """Base application error."""


class NotFoundError(HireAIError):
    """Raised when a resource cannot be located."""


class PermissionDeniedError(HireAIError):
    """Raised when RBAC denies access."""
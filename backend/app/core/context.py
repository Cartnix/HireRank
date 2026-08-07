"""Request-scoped security context via contextvars (audit + structlog).

BackgroundTasks must snapshot these values into AuditEvent at schedule time —
reading ContextVars inside a deferred task is unsafe once the request ends.
"""

from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Any
from uuid import UUID

tenant_id_ctx: ContextVar[UUID | None] = ContextVar("tenant_id", default=None)
user_id_ctx: ContextVar[UUID | None] = ContextVar("user_id", default=None)
user_role_ctx: ContextVar[str | None] = ContextVar("user_role", default=None)
request_meta_ctx: ContextVar[dict[str, Any] | None] = ContextVar(
    "request_meta", default=None
)


def set_tenant_id(tenant_id: UUID | None) -> Token[UUID | None]:
    return tenant_id_ctx.set(tenant_id)


def set_user_id(user_id: UUID | None) -> Token[UUID | None]:
    return user_id_ctx.set(user_id)


def set_user_role(role: str | None) -> Token[str | None]:
    return user_role_ctx.set(role)


def set_request_meta(meta: dict[str, Any]) -> Token[dict[str, Any] | None]:
    return request_meta_ctx.set(meta)


def clear_security_context() -> None:
    """Reset all request-scoped vars (call in middleware finally)."""
    tenant_id_ctx.set(None)
    user_id_ctx.set(None)
    user_role_ctx.set(None)
    request_meta_ctx.set(None)


def snapshot_security_context() -> dict[str, Any]:
    """Frozen copy for BackgroundTasks / audit rows (contextvars-safe)."""
    meta = dict(request_meta_ctx.get() or {})
    return {
        "tenant_id": tenant_id_ctx.get(),
        "user_id": user_id_ctx.get(),
        "user_role": user_role_ctx.get(),
        "ip": meta.get("ip"),
        "user_agent": meta.get("user_agent"),
    }

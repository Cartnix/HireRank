"""Request helpers for auth audit emission (contextvars-aware)."""

from __future__ import annotations

import ipaddress
from typing import Any
from uuid import UUID

from fastapi import BackgroundTasks, Request

from app.audit.schemas import AuditAction, hash_email
from app.audit.service import get_audit_service
from app.core.config import settings
from app.core.context import set_request_meta, set_tenant_id


def sanitize_ip(raw: str | None) -> str | None:
    """Store only valid IPs (TestClient uses host 'testclient')."""
    if not raw:
        return None
    try:
        return str(ipaddress.ip_address(raw))
    except ValueError:
        return None


async def emit_auth_audit(
    *,
    request: Request,
    background_tasks: BackgroundTasks | None,
    action: AuditAction,
    tenant_id: UUID | None = None,
    user_id: UUID | None = None,
    entity_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
    force_sync: bool = False,
) -> None:
    """
    Auth-path helper. Ensures request meta/tenant are bound (login has no JWT),
    then delegates to AuditLogService which snapshots contextvars.
    """
    set_tenant_id(tenant_id or settings.TENANT_ID)
    set_request_meta(
        {
            "ip": sanitize_ip(request.client.host if request.client else None),
            "user_agent": request.headers.get("user-agent"),
            "path": request.url.path,
            "method": request.method,
        }
    )
    await get_audit_service().log(
        background_tasks=background_tasks,
        action=str(action),
        entity_type="user",
        entity_id=entity_id or user_id,
        payload=metadata or {},
        tenant_id=tenant_id or settings.TENANT_ID,
        user_id=user_id,
        force_sync=force_sync,
        allow_missing_user=True,
    )


def email_hash_metadata(email: str, *, reason: str) -> dict[str, str]:
    return {"reason": reason, "email_hash": hash_email(email)}

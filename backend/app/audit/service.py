"""Durable audit inserts outside the business transaction + structlog mirror."""

from __future__ import annotations

import asyncio
from typing import Any
from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy import event as sa_event
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.api.deps import apply_rls_context
from app.audit.schemas import AuditEvent
from app.core.config import settings
from app.core.context import snapshot_security_context
from app.core.db import async_session_maker
from app.core.logging import get_logger
from app.models import AuditLog


def _structlog_audit(audit_event: AuditEvent) -> None:
    # Resolve logger per call so tests can reconfigure structlog processors.
    get_logger(__name__).info(
        "audit",
        action=str(audit_event.action),
        tenant_id=str(audit_event.tenant_id),
        user_id=str(audit_event.user_id) if audit_event.user_id else None,
        entity_type=audit_event.entity_type,
        entity_id=str(audit_event.entity_id) if audit_event.entity_id else None,
        event_id=str(audit_event.event_id),
        ip_address=audit_event.ip_address,
        metadata=audit_event.metadata,
    )


async def _persist_audit_row(audit_event: AuditEvent) -> None:
    async with async_session_maker() as session:

        def _set_rls(_sess: object, _trans: object, connection: Connection) -> None:
            apply_rls_context(connection, tenant_id=audit_event.tenant_id)

        sa_event.listen(session.sync_session, "after_begin", _set_rls)
        try:
            await session.execute(text("SELECT 1"))
            row = AuditLog(
                id=audit_event.event_id,
                created_at=audit_event.created_at,
                tenant_id=audit_event.tenant_id,
                user_id=audit_event.user_id,
                action=str(audit_event.action),
                entity_type=audit_event.entity_type,
                entity_id=audit_event.entity_id,
                ip_address=audit_event.ip_address,
                user_agent=audit_event.user_agent,
                metadata_=audit_event.metadata,
            )
            session.add(row)
            await session.commit()
        finally:
            sa_event.remove(session.sync_session, "after_begin", _set_rls)


async def insert_audit_log_async(audit_event: AuditEvent) -> None:
    """
    Insert one audit row in a fresh Session under SET LOCAL ROLE + tenant GUC.

    Must never share the request's business transaction. Failures are logged
    critically to stdout so ops can recover; they must not break the API path.
    """
    _structlog_audit(audit_event)
    try:
        await _persist_audit_row(audit_event)
    except Exception:
        get_logger(__name__).critical(
            "audit_insert_failed",
            action=str(audit_event.action),
            tenant_id=str(audit_event.tenant_id),
            event_id=str(audit_event.event_id),
            exc_info=True,
        )


def insert_audit_log(audit_event: AuditEvent) -> None:
    asyncio.run(insert_audit_log_async(audit_event))


async def schedule_audit(
    background_tasks: BackgroundTasks | None,
    audit_event: AuditEvent,
    *,
    force_sync: bool = False,
) -> None:
    """
    Emit audit event.

    Prefer BackgroundTasks on success responses. On HTTPException paths FastAPI
    discards pending BackgroundTasks — callers must use force_sync=True (or
    background_tasks=None) so the failure row is still written.
    """
    if force_sync or background_tasks is None:
        await insert_audit_log_async(audit_event)
        return
    _structlog_audit(audit_event)
    background_tasks.add_task(_insert_audit_log_db_only, audit_event)


async def _insert_audit_log_db_only(audit_event: AuditEvent) -> None:
    """BG task: DB insert only (structlog already emitted in schedule_audit)."""
    try:
        await _persist_audit_row(audit_event)
    except Exception:
        get_logger(__name__).critical(
            "audit_insert_failed",
            action=str(audit_event.action),
            tenant_id=str(audit_event.tenant_id),
            event_id=str(audit_event.event_id),
            exc_info=True,
        )


class AuditLogService:
    """
    Production audit API: reads security contextvars, snapshots into AuditEvent,
    then writes off the business transaction (BackgroundTasks or sync).
    """

    def build_event(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: UUID | None = None,
        payload: dict[str, Any] | None = None,
        tenant_id: UUID | None = None,
        user_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        allow_missing_user: bool = True,
    ) -> AuditEvent | None:
        snap = snapshot_security_context()
        resolved_tenant = tenant_id or snap["tenant_id"] or settings.TENANT_ID
        resolved_user = user_id if user_id is not None else snap["user_id"]
        if resolved_user is None and not allow_missing_user:
            get_logger(__name__).warning(
                "audit_skipped_missing_user",
                action=action,
                tenant_id=str(resolved_tenant),
            )
            return None
        return AuditEvent(
            tenant_id=resolved_tenant,
            user_id=resolved_user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=payload or {},
            ip_address=ip_address if ip_address is not None else snap["ip"],
            user_agent=user_agent if user_agent is not None else snap["user_agent"],
        )

    async def log(
        self,
        background_tasks: BackgroundTasks | None,
        action: str,
        entity_type: str,
        entity_id: UUID | str | None = None,
        payload: dict[str, Any] | None = None,
        *,
        tenant_id: UUID | None = None,
        user_id: UUID | None = None,
        force_sync: bool = False,
        allow_missing_user: bool = True,
    ) -> None:
        """Non-blocking public API — snapshots contextvars before enqueue."""
        eid: UUID | None
        if entity_id is None:
            eid = None
        elif isinstance(entity_id, UUID):
            eid = entity_id
        else:
            eid = UUID(str(entity_id))
        event = self.build_event(
            action=action,
            entity_type=entity_type,
            entity_id=eid,
            payload=payload,
            tenant_id=tenant_id,
            user_id=user_id,
            allow_missing_user=allow_missing_user,
        )
        if event is None:
            return
        await schedule_audit(background_tasks, event, force_sync=force_sync)


_audit_service: AuditLogService | None = None


def get_audit_service() -> AuditLogService:
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditLogService()
    return _audit_service

"""TDD: contextvars security context + AuditLogService snapshot pattern."""

from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Any

from fastapi import BackgroundTasks
from fastapi.testclient import TestClient
from sqlmodel import col, select
from structlog.testing import capture_logs

from app.audit.schemas import AuditAction
from app.audit.service import AuditLogService, get_audit_service
from app.core.config import settings
from app.core.context import (
    clear_security_context,
    set_request_meta,
    set_tenant_id,
    set_user_id,
    snapshot_security_context,
    tenant_id_ctx,
    user_id_ctx,
)
from app.core.logging import configure_logging
from app.models import AuditLog
from tests.conftest import bypass_rls_session
from tests.utils.utils import random_email, random_lower_string


def test_middleware_binds_request_meta_and_default_tenant(
    client: TestClient,
) -> None:
    """Unauthenticated hit still seeds tenant + UA into audit via middleware/emit."""
    r = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": random_email(), "password": "x"},
        headers={"User-Agent": "Context-Middleware-Test/1.0"},
    )
    assert r.status_code == 401
    with bypass_rls_session() as session:
        row = session.exec(
            select(AuditLog)
            .where(AuditLog.action == AuditAction.LOGIN_FAILURE)
            .order_by(col(AuditLog.created_at).desc())
        ).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
        assert row.user_agent == "Context-Middleware-Test/1.0"


def test_authenticated_me_binds_user_contextvars(client: TestClient) -> None:
    """JWT /me must bind user_id into contextvars for the request (via deps)."""
    email = random_email()
    password = random_lower_string()
    reg = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "recruiter"},
    )
    assert reg.status_code == 201
    pair = reg.json()
    r = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 200
    user_id = uuid.UUID(r.json()["id"])

    # Logout path binds CurrentUser then writes audit with that user_id
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204
    with bypass_rls_session() as session:
        row = session.exec(
            select(AuditLog)
            .where(AuditLog.action == AuditAction.LOGOUT)
            .order_by(col(AuditLog.created_at).desc())
        ).first()
        assert row is not None
        assert row.user_id == user_id
        assert row.tenant_id == settings.TENANT_ID


def test_audit_service_log_reads_contextvars_without_explicit_ids() -> None:
    clear_security_context()
    set_tenant_id(settings.TENANT_ID)
    uid = uuid.uuid4()
    set_user_id(uid)
    set_request_meta({"ip": "203.0.113.10", "user_agent": "svc-test"})
    entity = uuid.uuid4()

    service = get_audit_service()
    service.log(
        background_tasks=None,
        action="candidate.cv.download",
        entity_type="candidate",
        entity_id=entity,
        payload={
            "reason": "Manual export by recruiter",
            "field": "cv",
            "changed": True,
        },
        force_sync=True,
    )

    with bypass_rls_session() as session:
        row = session.exec(
            select(AuditLog)
            .where(AuditLog.action == "candidate.cv.download")
            .order_by(col(AuditLog.created_at).desc())
        ).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
        assert row.user_id == uid
        assert row.entity_type == "candidate"
        assert row.entity_id == entity
        assert row.ip_address is not None
        assert str(row.ip_address) == "203.0.113.10"
        assert row.user_agent == "svc-test"
        assert row.metadata_.get("reason") == "Manual export by recruiter"
        assert "password" not in row.metadata_


def test_audit_service_snapshots_context_before_background_clears() -> None:
    """
    Pitfall: reading ContextVars inside BG task after request ends loses tenant.
    Service must snapshot at schedule time.
    """
    clear_security_context()
    set_tenant_id(settings.TENANT_ID)
    uid = uuid.uuid4()
    set_user_id(uid)
    set_request_meta({"ip": "198.51.100.7", "user_agent": "bg-snap"})

    captured: list[tuple[Callable[..., Any], tuple[Any, ...], dict[str, Any]]] = []

    class _FakeBG(BackgroundTasks):
        def add_task(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
            captured.append((func, args, kwargs))

    bg = _FakeBG()
    service = AuditLogService()
    service.log(
        background_tasks=bg,
        action="vacancy.status.changed",
        entity_type="vacancy",
        entity_id=uuid.uuid4(),
        payload={"reason": "closed", "updated_fields": ["status"]},
    )
    assert len(captured) == 1

    # Simulate end of request: wipe contextvars before BG runs
    clear_security_context()
    assert tenant_id_ctx.get() is None
    assert user_id_ctx.get() is None

    func, args, kwargs = captured[0]
    func(*args, **kwargs)

    with bypass_rls_session() as session:
        row = session.exec(
            select(AuditLog)
            .where(AuditLog.action == "vacancy.status.changed")
            .order_by(col(AuditLog.created_at).desc())
        ).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
        assert row.user_id == uid
        assert str(row.ip_address) == "198.51.100.7"


def test_snapshot_security_context_copies_values() -> None:
    clear_security_context()
    set_tenant_id(settings.TENANT_ID)
    set_user_id(uuid.UUID("22222222-2222-4222-8222-222222222222"))
    set_request_meta({"ip": "127.0.0.1", "user_agent": "snap"})
    snap = snapshot_security_context()
    clear_security_context()
    assert snap["tenant_id"] == settings.TENANT_ID
    assert str(snap["user_id"]).startswith("22222222")
    assert snap["ip"] == "127.0.0.1"
    assert snap["user_agent"] == "snap"


def test_structlog_binds_tenant_from_middleware(client: TestClient) -> None:
    with capture_logs() as cap:
        client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": random_email(), "password": "nope"},
        )
    configure_logging(json_logs=True)
    # At least one log event should carry tenant_id (audit or access)
    with_tenant = [e for e in cap if e.get("tenant_id") == str(settings.TENANT_ID)]
    assert with_tenant, f"expected tenant-bound structlog events, got {cap!r}"

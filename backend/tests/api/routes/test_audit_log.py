"""TDD: auth audit trail — durable rows, RLS, INSERT-only, GUC leak, PII, structlog."""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, ProgrammingError
from sqlmodel import Session, col, select

from app.audit.schemas import AuditAction, AuditEvent
from app.audit.service import insert_audit_log
from app.core.config import settings
from app.core.db import engine
from app.models import AuditLog, Tenant
from tests.conftest import bypass_rls_session
from tests.utils.utils import random_email, random_lower_string

FOREIGN_TENANT_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")


def _ensure_foreign_tenant(session: Session) -> Tenant:
    tenant = session.get(Tenant, FOREIGN_TENANT_ID)
    if tenant:
        return tenant
    tenant = Tenant(
        id=FOREIGN_TENANT_ID,
        slug=f"foreign-{FOREIGN_TENANT_ID.hex[:8]}",
        name="Foreign Tenant B",
    )
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return tenant


def _count_actions(action: str, *, tenant_id: uuid.UUID | None = None) -> int:
    with bypass_rls_session() as session:
        q = select(AuditLog).where(AuditLog.action == action)
        if tenant_id is not None:
            q = q.where(AuditLog.tenant_id == tenant_id)
        return len(list(session.exec(q).all()))


def _latest_action(action: str) -> AuditLog | None:
    with bypass_rls_session() as session:
        rows = list(
            session.exec(
                select(AuditLog)
                .where(AuditLog.action == action)
                .order_by(col(AuditLog.created_at).desc())
            ).all()
        )
        if not rows:
            return None
        row = rows[0]
        session.expunge(row)
        return row


def test_login_success_writes_audit_log(client: TestClient) -> None:
    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "recruiter",
        },
    )
    assert r.status_code == 201
    before = _count_actions(AuditAction.LOGIN_SUCCESS)

    r = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
        headers={"User-Agent": "HireRank-Audit-Test/1.0"},
    )
    assert r.status_code == 200
    assert _count_actions(AuditAction.LOGIN_SUCCESS) == before + 1
    row = _latest_action(AuditAction.LOGIN_SUCCESS)
    assert row is not None
    assert row.tenant_id == settings.TENANT_ID
    assert row.user_id is not None
    assert row.entity_type == "user"
    assert row.user_agent == "HireRank-Audit-Test/1.0"
    assert "password" not in (row.metadata_ or {})
    assert "email" not in (row.metadata_ or {})


def test_login_failure_writes_audit_log(client: TestClient) -> None:
    before = _count_actions(AuditAction.LOGIN_FAILURE)
    r = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": random_email(), "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert _count_actions(AuditAction.LOGIN_FAILURE) == before + 1
    row = _latest_action(AuditAction.LOGIN_FAILURE)
    assert row is not None
    assert row.user_id is None
    assert row.tenant_id == settings.TENANT_ID
    meta = row.metadata_ or {}
    assert "password" not in meta
    assert "email" not in meta
    assert "email_hash" in meta


def test_oauth_form_login_writes_audit_log(client: TestClient) -> None:
    email = random_email()
    password = random_lower_string()
    assert (
        client.post(
            f"{settings.API_V1_STR}/auth/register",
            json={"email": email, "password": password, "role": "recruiter"},
        ).status_code
        == 201
    )
    before = _count_actions(AuditAction.LOGIN_SUCCESS)
    r = client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": email, "password": password},
    )
    assert r.status_code == 200
    assert _count_actions(AuditAction.LOGIN_SUCCESS) == before + 1


def test_register_logout_refresh_write_audit(client: TestClient) -> None:
    email = random_email()
    password = random_lower_string()
    before_reg = _count_actions(AuditAction.REGISTER)
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "recruiter"},
    )
    assert r.status_code == 201
    assert _count_actions(AuditAction.REGISTER) == before_reg + 1
    pair = r.json()

    before_refresh = _count_actions(AuditAction.REFRESH)
    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 200
    assert _count_actions(AuditAction.REFRESH) == before_refresh + 1
    refreshed = r.json()

    before_logout = _count_actions(AuditAction.LOGOUT)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
        json={"refresh_token": refreshed["refresh_token"]},
    )
    assert r.status_code == 204
    assert _count_actions(AuditAction.LOGOUT) == before_logout + 1


def test_tenant_rls_hides_foreign_audit_rows() -> None:
    with bypass_rls_session() as seed:
        _ensure_foreign_tenant(seed)
        now = datetime.now(UTC)
        seed.add(
            AuditLog(
                id=uuid.uuid4(),
                created_at=now,
                tenant_id=settings.TENANT_ID,
                user_id=None,
                action=AuditAction.LOGIN_SUCCESS,
                entity_type="user",
                entity_id=None,
                ip_address=None,
                user_agent=None,
                metadata_={"seed": "core"},
            )
        )
        seed.add(
            AuditLog(
                id=uuid.uuid4(),
                created_at=now,
                tenant_id=FOREIGN_TENANT_ID,
                user_id=None,
                action=AuditAction.LOGIN_SUCCESS,
                entity_type="user",
                entity_id=None,
                ip_address=None,
                user_agent=None,
                metadata_={"seed": "foreign"},
            )
        )
        seed.commit()

    with Session(engine) as session:
        session.execute(text("BEGIN"))
        session.execute(text("SET row_security = on"))
        session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        rows = list(session.exec(select(AuditLog)).all())
        session.execute(text("ROLLBACK"))

    assert all(r.tenant_id == settings.TENANT_ID for r in rows)
    assert all(r.tenant_id != FOREIGN_TENANT_ID for r in rows)


def test_hirerank_app_cannot_update_or_delete_audit_log() -> None:
    event = AuditEvent(
        tenant_id=settings.TENANT_ID,
        action=AuditAction.LOGIN_SUCCESS,
        entity_type="user",
        metadata={"reason": "tamper-test"},
    )
    insert_audit_log(event)

    with Session(engine) as session:
        session.execute(text("BEGIN"))
        session.execute(text("SET row_security = on"))
        session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        with pytest.raises((ProgrammingError, DBAPIError)):
            session.execute(
                text("UPDATE audit.audit_log SET action = 'tampered' WHERE id = :id"),
                {"id": str(event.event_id)},
            )
            session.commit()
        session.rollback()

    with Session(engine) as session:
        session.execute(text("BEGIN"))
        session.execute(text("SET row_security = on"))
        session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        with pytest.raises((ProgrammingError, DBAPIError)):
            session.execute(
                text("DELETE FROM audit.audit_log WHERE id = :id"),
                {"id": str(event.event_id)},
            )
            session.commit()
        session.rollback()


def test_connection_pooling_guc_does_not_leak_audit_rows() -> None:
    """Sequential RLS queries with different tenants must not cross-read."""
    with bypass_rls_session() as seed:
        _ensure_foreign_tenant(seed)
        now = datetime.now(UTC)
        for tid, tag in (
            (settings.TENANT_ID, "core-pool"),
            (FOREIGN_TENANT_ID, "foreign-pool"),
        ):
            seed.add(
                AuditLog(
                    id=uuid.uuid4(),
                    created_at=now,
                    tenant_id=tid,
                    action=AuditAction.LOGOUT,
                    entity_type="user",
                    metadata_={"seed": tag},
                )
            )
        seed.commit()

    def _visible(tenant_id: uuid.UUID) -> set[str]:
        with Session(engine) as session:
            session.execute(text("BEGIN"))
            session.execute(text("SET row_security = on"))
            session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
            session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(tenant_id)},
            )
            tags = {
                (r.metadata_ or {}).get("seed", "")
                for r in session.exec(
                    select(AuditLog).where(AuditLog.action == AuditAction.LOGOUT)
                ).all()
                if (r.metadata_ or {}).get("seed") in {"core-pool", "foreign-pool"}
            }
            session.execute(text("ROLLBACK"))
            return tags

    assert "core-pool" in _visible(settings.TENANT_ID)
    assert "foreign-pool" not in _visible(settings.TENANT_ID)
    assert "foreign-pool" in _visible(FOREIGN_TENANT_ID)
    assert "core-pool" not in _visible(FOREIGN_TENANT_ID)


def test_insert_audit_log_with_explicit_tenant_no_jwt() -> None:
    """Background worker path: only explicit tenant_id, no request JWT."""
    event = AuditEvent(
        tenant_id=settings.TENANT_ID,
        action=AuditAction.REFRESH,
        entity_type="user",
        metadata={"reason": "bg-context"},
    )
    insert_audit_log(event)
    with bypass_rls_session() as session:
        row = session.exec(
            select(AuditLog).where(AuditLog.id == event.event_id)
        ).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
        assert row.action == AuditAction.REFRESH


def test_audit_event_strips_pii_metadata() -> None:
    event = AuditEvent(
        tenant_id=settings.TENANT_ID,
        action=AuditAction.LOGIN_FAILURE,
        entity_type="user",
        metadata={
            "password": "secret",
            "email": "leaky@example.com",
            "reason": "bad_credentials",
            "email_hash": hashlib.sha256(b"leaky@example.com").hexdigest(),
        },
    )
    assert "password" not in event.metadata
    assert "email" not in event.metadata
    assert event.metadata["reason"] == "bad_credentials"
    assert (
        event.metadata["email_hash"] == hashlib.sha256(b"leaky@example.com").hexdigest()
    )


def test_structlog_emits_audit_event_fields(client: TestClient) -> None:
    from structlog.testing import capture_logs

    from app.core.logging import configure_logging

    with capture_logs() as cap:
        r = client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": random_email(), "password": "nope"},
        )
        assert r.status_code == 401

    configure_logging(json_logs=True)
    audit_events = [
        e
        for e in cap
        if e.get("event") == "audit" and e.get("action") == AuditAction.LOGIN_FAILURE
    ]
    assert audit_events, f"expected structlog audit event, got: {cap!r}"
    assert str(audit_events[-1].get("tenant_id")) == str(settings.TENANT_ID)

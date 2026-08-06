"""TDD: auth audit trail — durable rows, RLS, INSERT-only, GUC leak, PII, structlog."""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, ProgrammingError
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.audit.schemas import AuditAction, AuditEvent
from app.audit.service import insert_audit_log_async
from app.core.config import settings
from app.models import AuditLog, Tenant
from tests.conftest import bypass_rls_session, session_context
from tests.utils.utils import random_email, random_lower_string

FOREIGN_TENANT_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")


async def _ensure_foreign_tenant(session: AsyncSession) -> Tenant:
    tenant = await session.get(Tenant, FOREIGN_TENANT_ID)
    if tenant:
        return tenant
    tenant = Tenant(
        id=FOREIGN_TENANT_ID,
        slug=f"foreign-{FOREIGN_TENANT_ID.hex[:8]}",
        name="Foreign Tenant B",
    )
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


async def _count_actions(action: str, *, tenant_id: uuid.UUID | None = None) -> int:
    async with bypass_rls_session() as session:
        q = select(AuditLog).where(AuditLog.action == action)
        if tenant_id is not None:
            q = q.where(AuditLog.tenant_id == tenant_id)
        return len(list((await session.exec(q)).all()))


async def _latest_action(action: str) -> AuditLog | None:
    async with bypass_rls_session() as session:
        rows: list[AuditLog] = list(
            (
                await session.exec(
                    select(AuditLog)
                    .where(AuditLog.action == action)
                    .order_by(col(AuditLog.created_at).desc())
                )
            ).all()
        )
        if not rows:
            return None
        row = rows[0]
        session.expunge(row)
        return row


@pytest.mark.asyncio
async def test_login_success_writes_audit_log(client: AsyncClient) -> None:
    email = random_email()
    password = random_lower_string()
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "recruiter",
        },
    )
    assert r.status_code == 201
    before = await _count_actions(AuditAction.LOGIN_SUCCESS)

    r = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
        headers={"User-Agent": "HireRank-Audit-Test/1.0"},
    )
    assert r.status_code == 200
    assert await _count_actions(AuditAction.LOGIN_SUCCESS) == before + 1
    row = await _latest_action(AuditAction.LOGIN_SUCCESS)
    assert row is not None
    assert row.tenant_id == settings.TENANT_ID
    assert row.user_id is not None
    assert row.entity_type == "user"
    assert row.user_agent == "HireRank-Audit-Test/1.0"
    assert "password" not in (row.metadata_ or {})
    assert "email" not in (row.metadata_ or {})


@pytest.mark.asyncio
async def test_login_failure_writes_audit_log(client: AsyncClient) -> None:
    before = await _count_actions(AuditAction.LOGIN_FAILURE)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": random_email(), "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert await _count_actions(AuditAction.LOGIN_FAILURE) == before + 1
    row = await _latest_action(AuditAction.LOGIN_FAILURE)
    assert row is not None
    assert row.user_id is None
    assert row.tenant_id == settings.TENANT_ID
    meta = row.metadata_ or {}
    assert "password" not in meta
    assert "email" not in meta
    assert "email_hash" in meta


@pytest.mark.asyncio
async def test_oauth_form_login_writes_audit_log(client: AsyncClient) -> None:
    email = random_email()
    password = random_lower_string()
    register_response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "recruiter"},
    )
    assert register_response.status_code == 201
    before = await _count_actions(AuditAction.LOGIN_SUCCESS)
    r = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": email, "password": password},
    )
    assert r.status_code == 200
    assert await _count_actions(AuditAction.LOGIN_SUCCESS) == before + 1


@pytest.mark.asyncio
async def test_register_logout_refresh_write_audit(client: AsyncClient) -> None:
    email = random_email()
    password = random_lower_string()
    before_reg = await _count_actions(AuditAction.REGISTER)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "recruiter"},
    )
    assert r.status_code == 201
    assert await _count_actions(AuditAction.REGISTER) == before_reg + 1
    pair = r.json()

    before_refresh = await _count_actions(AuditAction.REFRESH)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 200
    assert await _count_actions(AuditAction.REFRESH) == before_refresh + 1
    refreshed = r.json()

    before_logout = await _count_actions(AuditAction.LOGOUT)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
        json={"refresh_token": refreshed["refresh_token"]},
    )
    assert r.status_code == 204
    assert await _count_actions(AuditAction.LOGOUT) == before_logout + 1


@pytest.mark.asyncio
async def test_tenant_rls_hides_foreign_audit_rows() -> None:
    async with bypass_rls_session() as seed:
        await _ensure_foreign_tenant(seed)
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
        await seed.commit()

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        rows: list[AuditLog] = list((await session.exec(select(AuditLog))).all())
        await session.execute(text("ROLLBACK"))

    assert all(r.tenant_id == settings.TENANT_ID for r in rows)
    assert all(r.tenant_id != FOREIGN_TENANT_ID for r in rows)


@pytest.mark.asyncio
async def test_hirerank_app_cannot_update_or_delete_audit_log() -> None:
    event = AuditEvent(
        tenant_id=settings.TENANT_ID,
        action=AuditAction.LOGIN_SUCCESS,
        entity_type="user",
        metadata={"reason": "tamper-test"},
    )
    await insert_audit_log_async(event)

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        with pytest.raises((ProgrammingError, DBAPIError)):
            await session.execute(
                text("UPDATE audit.audit_log SET action = 'tampered' WHERE id = :id"),
                {"id": str(event.event_id)},
            )
            await session.commit()
        await session.rollback()

    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(settings.TENANT_ID)},
        )
        with pytest.raises((ProgrammingError, DBAPIError)):
            await session.execute(
                text("DELETE FROM audit.audit_log WHERE id = :id"),
                {"id": str(event.event_id)},
            )
            await session.commit()
        await session.rollback()


@pytest.mark.asyncio
async def test_connection_pooling_guc_does_not_leak_audit_rows() -> None:
    """Sequential RLS queries with different tenants must not cross-read."""
    async with bypass_rls_session() as seed:
        await _ensure_foreign_tenant(seed)
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
        await seed.commit()

    async def _visible(tenant_id: uuid.UUID) -> set[str]:
        async with session_context() as session:
            await session.execute(text("BEGIN"))
            await session.execute(text("SET row_security = on"))
            await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(tenant_id)},
            )
            tags = {
                (row.metadata_ or {}).get("seed", "")
                for row in (
                    await session.exec(
                        select(AuditLog).where(AuditLog.action == AuditAction.LOGOUT)
                    )
                ).all()
                if (row.metadata_ or {}).get("seed") in {"core-pool", "foreign-pool"}
            }
            await session.execute(text("ROLLBACK"))
            return tags

    assert "core-pool" in await _visible(settings.TENANT_ID)
    assert "foreign-pool" not in await _visible(settings.TENANT_ID)
    assert "foreign-pool" in await _visible(FOREIGN_TENANT_ID)
    assert "core-pool" not in await _visible(FOREIGN_TENANT_ID)


@pytest.mark.asyncio
async def test_insert_audit_log_with_explicit_tenant_no_jwt() -> None:
    """Background worker path: only explicit tenant_id, no request JWT."""
    event = AuditEvent(
        tenant_id=settings.TENANT_ID,
        action=AuditAction.REFRESH,
        entity_type="user",
        metadata={"reason": "bg-context"},
    )
    await insert_audit_log_async(event)
    async with bypass_rls_session() as session:
        row = (
            await session.exec(select(AuditLog).where(AuditLog.id == event.event_id))
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


@pytest.mark.asyncio
async def test_structlog_emits_audit_event_fields(client: AsyncClient) -> None:
    from structlog.testing import capture_logs

    from app.core.logging import configure_logging

    with capture_logs() as cap:
        r = await client.post(
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

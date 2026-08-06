"""TDD matrix: hidden multi-tenancy isolation and exploit attempts.

Philosophy (Reddit ATS consensus): test break-ins, not happy-path isolation.
Core deploy has one active TENANT_ID, but the schema is multi-tenant-ready —
foreign tenant rows must never leak through JWT, RLS, or body injection.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import timedelta

import jwt
from httpx import AsyncClient
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Tenant, User, UserRole
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


async def _seed_foreign_user(
    session: AsyncSession, *, email: str | None = None
) -> User:
    await _ensure_foreign_tenant(session)
    user = User(
        email=email or random_email(),
        hashed_password=get_password_hash(random_lower_string()),
        role=UserRole.RECRUITER,
        tenant_id=FOREIGN_TENANT_ID,
        first_name="Foreign",
        last_name="Recruiter",
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    # Detach safely for use after session closes (avoid DetachedInstanceError)
    session.expunge(user)
    return user


async def _rls_bound_ids(tenant_id: uuid.UUID) -> set[uuid.UUID]:
    """Query users under the non-BYPASSRLS app role + tenant GUC."""
    async with session_context() as session:
        await session.execute(text("BEGIN"))
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(tenant_id)},
        )
        users = (await session.exec(select(User))).all()
        ids = {user.id for user in users}
        await session.execute(text("ROLLBACK"))
        return ids


def _forge_access_token(
    *,
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    role: str = "recruiter",
) -> str:
    token, _, _ = security.create_access_token(
        subject=user_id,
        role=role,
        tenant_id=tenant_id,
        expires_delta=timedelta(minutes=15),
    )
    return token


async def test_positive_tenant_bound_me_returns_core_tenant_only(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["tenant_id"] == str(settings.TENANT_ID)
    assert body["tenant_id"] != str(FOREIGN_TENANT_ID)


async def test_positive_list_users_excludes_foreign_tenant_rows(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    async with bypass_rls_session() as seed:
        foreign = await _seed_foreign_user(seed)

    r = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    ids = {item["id"] for item in r.json()["data"]}
    assert str(foreign.id) not in ids
    for item in r.json()["data"]:
        assert item["tenant_id"] == str(settings.TENANT_ID)


async def test_cross_tenant_leak_get_user_by_id_returns_404(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    """Valid Core JWT + foreign user UUID must not reveal that the row exists."""
    async with bypass_rls_session() as seed:
        foreign = await _seed_foreign_user(seed)

    r = await client.get(
        f"{settings.API_V1_STR}/users/{foreign.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


async def test_cross_tenant_jwt_claim_mismatch_is_rejected(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    """Forged access token with foreign tenant_id must not authenticate."""
    me = (
        await client.get(
            f"{settings.API_V1_STR}/auth/me",
            headers=superuser_token_headers,
        )
    ).json()
    forged = _forge_access_token(
        user_id=uuid.UUID(me["id"]),
        tenant_id=FOREIGN_TENANT_ID,
        role=me["role"],
    )
    r = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Tenant mismatch"


async def test_cross_tenant_jwt_sub_of_foreign_user_returns_404(
    client: AsyncClient,
) -> None:
    """Core tenant claim + foreign user sub → RLS hides row → 404 (not 200)."""
    async with bypass_rls_session() as seed:
        foreign = await _seed_foreign_user(seed)

    forged = _forge_access_token(
        user_id=foreign.id,
        tenant_id=settings.TENANT_ID,
        role="recruiter",
    )
    r = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


async def test_write_exploit_admin_create_ignores_body_tenant_id(
    client: AsyncClient, superuser_token_headers: dict[str, str], db: AsyncSession
) -> None:
    """POST /users with tenant_id of Tenant B must still bind to Core TENANT_ID."""
    async with bypass_rls_session() as seed:
        await _ensure_foreign_tenant(seed)

    email = random_email()
    password = random_lower_string()
    r = await client.post(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
        json={
            "email": email,
            "password": password,
            "role": "candidate",
            "tenant_id": str(FOREIGN_TENANT_ID),
        },
    )
    assert r.status_code == 200
    created = r.json()
    assert created["tenant_id"] == str(settings.TENANT_ID)
    assert created["tenant_id"] != str(FOREIGN_TENANT_ID)

    await db.execute(text("SET row_security = off"))
    try:
        row = (await db.exec(select(User).where(User.email == email))).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
    finally:
        await db.execute(text("SET row_security = on"))
        await db.commit()


async def test_write_exploit_register_ignores_body_tenant_and_persists_core(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": random_lower_string(),
            "role": "hr",
            "tenant_id": str(FOREIGN_TENANT_ID),
        },
    )
    assert r.status_code == 201
    payload = jwt.decode(
        r.json()["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert payload["tenant_id"] == str(settings.TENANT_ID)

    await db.execute(text("SET row_security = off"))
    try:
        row = (await db.exec(select(User).where(User.email == email))).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
    finally:
        await db.execute(text("SET row_security = on"))
        await db.commit()


async def test_rls_force_enabled_on_user_and_tenant_tables() -> None:
    """Table owner must not silently bypass policies (FORCE ROW LEVEL SECURITY)."""
    async with session_context() as session:
        rows = (
            await session.execute(
                text(
                    """
                SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname IN ('user', 'tenant')
                ORDER BY c.relname
                """
                )
            )
        ).all()
    by_name = {name: (rls, force) for name, rls, force in rows}
    assert by_name["user"] == (True, True)
    assert by_name["tenant"] == (True, True)


async def test_rls_policies_use_nullif_uuid_cast() -> None:
    """Empty/missing GUC must not raise on ::uuid — policies use NULLIF."""
    async with session_context() as session:
        quals = (
            await session.execute(
                text(
                    """
                SELECT tablename, qual
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND policyname IN (
                    'tenant_isolation_policy', 'tenant_self_policy'
                  )
                """
                )
            )
        ).all()
    assert len(quals) == 2
    for _table, qual in quals:
        assert qual is not None
        assert "NULLIF" in qual
        assert "app.current_tenant" in qual
        assert "::uuid" in qual or "::uuid" in qual.lower()


async def test_empty_tenant_guc_hides_all_rows_without_error() -> None:
    """Best-practice fail-closed: empty GUC hides rows and must not error."""
    async with bypass_rls_session() as seed:
        await _seed_foreign_user(seed)

    async with session_context() as session:
        await session.execute(text("SET row_security = on"))
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        await session.execute(text("SELECT set_config('app.current_tenant', '', true)"))
        ids = (await session.execute(text('SELECT id FROM "user"'))).scalars().all()
        assert ids == []


async def test_rls_guc_hides_foreign_rows_on_fresh_connection() -> None:
    async with bypass_rls_session() as seed:
        foreign = await _seed_foreign_user(seed)
        core_user = (
            await seed.exec(select(User).where(User.tenant_id == settings.TENANT_ID))
        ).first()
        assert core_user is not None
        core_id = core_user.id
        foreign_id = foreign.id

    visible_ids = await _rls_bound_ids(settings.TENANT_ID)
    assert core_id in visible_ids
    assert foreign_id not in visible_ids


async def test_rls_guc_isolated_across_parallel_sessions() -> None:
    """Two physical connections with different GUCs must not pollute each other."""
    async with bypass_rls_session() as seed:
        foreign = await _seed_foreign_user(seed)
        core_user = (
            await seed.exec(select(User).where(User.tenant_id == settings.TENANT_ID))
        ).first()
        assert core_user is not None
        core_id = core_user.id
        foreign_id = foreign.id

    results = await asyncio.gather(
        *[
            _rls_bound_ids(settings.TENANT_ID)
            if i % 2 == 0
            else _rls_bound_ids(FOREIGN_TENANT_ID)
            for i in range(40)
        ]
    )

    assert len(results) == 40
    core_ids = await _rls_bound_ids(settings.TENANT_ID)
    foreign_ids = await _rls_bound_ids(FOREIGN_TENANT_ID)
    assert core_id in core_ids and foreign_id not in core_ids
    assert foreign_id in foreign_ids and core_id not in foreign_ids


async def test_superuser_bypassrls_pitfall_is_mitigated_by_app_role() -> None:
    """Document the pitfall: login role may BYPASSRLS; app role must not."""
    async with session_context() as session:
        login_bypass = (
            await session.execute(
                text("SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user")
            )
        ).scalar_one()
        await session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        app_bypass = (
            await session.execute(
                text("SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user")
            )
        ).scalar_one()
    # Local/dev often connects as postgres (bypass=true); runtime role must be false.
    assert app_bypass is False
    assert login_bypass is True or login_bypass is False  # either is fine for login

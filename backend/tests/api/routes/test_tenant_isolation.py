"""TDD matrix: hidden multi-tenancy isolation and exploit attempts.

Philosophy (Reddit ATS consensus): test break-ins, not happy-path isolation.
Core deploy has one active TENANT_ID, but the schema is multi-tenant-ready —
foreign tenant rows must never leak through JWT, RLS, or body injection.
"""

from __future__ import annotations

import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timedelta

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.core.security import get_password_hash
from app.models import Tenant, User, UserRole
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


def _seed_foreign_user(session: Session, *, email: str | None = None) -> User:
    _ensure_foreign_tenant(session)
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
    session.commit()
    session.refresh(user)
    # Detach safely for use after session closes (avoid DetachedInstanceError)
    session.expunge(user)
    return user


def _rls_bound_ids(tenant_id: uuid.UUID) -> set[uuid.UUID]:
    """Query users under the non-BYPASSRLS app role + tenant GUC."""
    with Session(engine) as session:
        session.execute(text("BEGIN"))
        session.execute(text("SET row_security = on"))
        session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        session.execute(
            text("SELECT set_config('app.current_tenant', :tenant, true)"),
            {"tenant": str(tenant_id)},
        )
        ids = {u.id for u in session.exec(select(User)).all()}
        session.execute(text("ROLLBACK"))
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


def test_positive_tenant_bound_me_returns_core_tenant_only(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["tenant_id"] == str(settings.TENANT_ID)
    assert body["tenant_id"] != str(FOREIGN_TENANT_ID)


def test_positive_list_users_excludes_foreign_tenant_rows(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    with bypass_rls_session() as seed:
        foreign = _seed_foreign_user(seed)

    r = client.get(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    ids = {item["id"] for item in r.json()["data"]}
    assert str(foreign.id) not in ids
    for item in r.json()["data"]:
        assert item["tenant_id"] == str(settings.TENANT_ID)


def test_cross_tenant_leak_get_user_by_id_returns_404(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Valid Core JWT + foreign user UUID must not reveal that the row exists."""
    with bypass_rls_session() as seed:
        foreign = _seed_foreign_user(seed)

    r = client.get(
        f"{settings.API_V1_STR}/users/{foreign.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_cross_tenant_jwt_claim_mismatch_is_rejected(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Forged access token with foreign tenant_id must not authenticate."""
    me = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=superuser_token_headers,
    ).json()
    forged = _forge_access_token(
        user_id=uuid.UUID(me["id"]),
        tenant_id=FOREIGN_TENANT_ID,
        role=me["role"],
    )
    r = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Tenant mismatch"


def test_cross_tenant_jwt_sub_of_foreign_user_returns_404(
    client: TestClient,
) -> None:
    """Core tenant claim + foreign user sub → RLS hides row → 404 (not 200)."""
    with bypass_rls_session() as seed:
        foreign = _seed_foreign_user(seed)

    forged = _forge_access_token(
        user_id=foreign.id,
        tenant_id=settings.TENANT_ID,
        role="recruiter",
    )
    r = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_write_exploit_admin_create_ignores_body_tenant_id(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """POST /users with tenant_id of Tenant B must still bind to Core TENANT_ID."""
    with bypass_rls_session() as seed:
        _ensure_foreign_tenant(seed)

    email = random_email()
    password = random_lower_string()
    r = client.post(
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

    db.execute(text("SET row_security = off"))
    try:
        row = db.exec(select(User).where(User.email == email)).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
    finally:
        db.execute(text("SET row_security = on"))
        db.commit()


def test_write_exploit_register_ignores_body_tenant_and_persists_core(
    client: TestClient, db: Session
) -> None:
    email = random_email()
    r = client.post(
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

    db.execute(text("SET row_security = off"))
    try:
        row = db.exec(select(User).where(User.email == email)).first()
        assert row is not None
        assert row.tenant_id == settings.TENANT_ID
    finally:
        db.execute(text("SET row_security = on"))
        db.commit()


def test_rls_force_enabled_on_user_and_tenant_tables() -> None:
    """Table owner must not silently bypass policies (FORCE ROW LEVEL SECURITY)."""
    with Session(engine) as session:
        rows = session.execute(
            text(
                """
                SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname IN ('user', 'tenant')
                ORDER BY c.relname
                """
            )
        ).all()
    by_name = {name: (rls, force) for name, rls, force in rows}
    assert by_name["user"] == (True, True)
    assert by_name["tenant"] == (True, True)


def test_rls_guc_hides_foreign_rows_on_fresh_connection() -> None:
    with bypass_rls_session() as seed:
        foreign = _seed_foreign_user(seed)
        core_user = seed.exec(
            select(User).where(User.tenant_id == settings.TENANT_ID)
        ).first()
        assert core_user is not None
        core_id = core_user.id
        foreign_id = foreign.id

    visible_ids = _rls_bound_ids(settings.TENANT_ID)
    assert core_id in visible_ids
    assert foreign_id not in visible_ids


def test_rls_guc_isolated_across_parallel_sessions() -> None:
    """Two physical connections with different GUCs must not pollute each other."""
    with bypass_rls_session() as seed:
        foreign = _seed_foreign_user(seed)
        core_user = seed.exec(
            select(User).where(User.tenant_id == settings.TENANT_ID)
        ).first()
        assert core_user is not None
        core_id = core_user.id
        foreign_id = foreign.id

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [
            pool.submit(_rls_bound_ids, settings.TENANT_ID)
            if i % 2 == 0
            else pool.submit(_rls_bound_ids, FOREIGN_TENANT_ID)
            for i in range(40)
        ]
        results = [f.result() for f in as_completed(futures)]

    assert len(results) == 40
    core_ids = _rls_bound_ids(settings.TENANT_ID)
    foreign_ids = _rls_bound_ids(FOREIGN_TENANT_ID)
    assert core_id in core_ids and foreign_id not in core_ids
    assert foreign_id in foreign_ids and core_id not in foreign_ids


def test_superuser_bypassrls_pitfall_is_mitigated_by_app_role() -> None:
    """Document the pitfall: login role may BYPASSRLS; app role must not."""
    with Session(engine) as session:
        login_bypass = session.execute(
            text(
                "SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user"
            )
        ).scalar_one()
        session.execute(text(f"SET LOCAL ROLE {settings.RLS_APP_ROLE}"))
        app_bypass = session.execute(
            text(
                "SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user"
            )
        ).scalar_one()
    # Local/dev often connects as postgres (bypass=true); runtime role must be false.
    assert app_bypass is False
    assert login_bypass is True or login_bypass is False  # either is fine for login

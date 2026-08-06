"""TDD: RBAC boundaries — 403 vs 401; JWT permissions claim drives require_permission."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from httpx import AsyncClient
from sqlalchemy import text
from sqlmodel import select

from app.api.deps import apply_rls_context, get_current_user
from app.core import security
from app.core.config import settings
from app.models import Permission, Role, RolePermission
from tests.conftest import bypass_rls_session, session_context
from tests.utils.auth_types import register_bearer_pair
from tests.utils.utils import random_email, random_lower_string

USERS_URL = f"{settings.API_V1_STR}/users/"
ME_URL = f"{settings.API_V1_STR}/auth/me"


async def test_admin_can_list_users(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.get(USERS_URL, headers=superuser_token_headers)
    assert r.status_code == 200
    payload = jwt.decode(
        superuser_token_headers["Authorization"].split(" ", 1)[1],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert "users.manage" in payload["permissions"]


async def test_candidate_valid_token_forbidden_on_users_manage(
    client: AsyncClient,
) -> None:
    pair = await register_bearer_pair(client, role="candidate")
    headers = {"Authorization": f"Bearer {pair['access_token']}"}

    r = await client.get(ME_URL, headers=headers)
    assert r.status_code == 200  # authenticated

    r = await client.get(USERS_URL, headers=headers)
    assert r.status_code == 403  # not 401
    assert r.json()["detail"] == "Insufficient permissions"


async def test_recruiter_forbidden_on_users_manage(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="recruiter")
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    r = await client.get(USERS_URL, headers=headers)
    assert r.status_code == 403


async def test_jwt_role_claim_alone_does_not_grant_permissions(
    client: AsyncClient,
) -> None:
    """
    Elevating only the role claim (without permissions) must not unlock
    users.manage — require_permission reads the JWT permissions claim.
    """
    pair = await register_bearer_pair(client, role="candidate")
    sub = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["sub"]

    forged = jwt.encode(
        {
            "sub": sub,
            "role": "administrator",
            "tenant_id": str(settings.TENANT_ID),
            "permissions": [],
            "jti": str(uuid4()),
            "type": security.TOKEN_TYPE_ACCESS,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    r = await client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 403


async def test_role_escalation_with_wrong_signing_key_is_401(
    client: AsyncClient,
) -> None:
    pair = await register_bearer_pair(client, role="candidate")
    sub = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["sub"]
    forged = jwt.encode(
        {
            "sub": sub,
            "role": "administrator",
            "tenant_id": str(settings.TENANT_ID),
            "permissions": ["users.manage"],
            "jti": str(uuid4()),
            "type": security.TOKEN_TYPE_ACCESS,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        "not-the-server-secret",
        algorithm=security.ALGORITHM,
    )
    r = await client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


async def test_db_permission_change_picked_up_after_refresh(
    client: AsyncClient,
) -> None:
    email = random_email()
    password = random_lower_string()
    pair = await register_bearer_pair(
        client, role="recruiter", email=email, password=password
    )
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    assert (await client.get(USERS_URL, headers=headers)).status_code == 403

    async with bypass_rls_session() as session:
        recruiter: Role = (
            await session.exec(select(Role).where(Role.name == "recruiter"))
        ).one()
        users_manage: Permission = (
            await session.exec(
                select(Permission).where(Permission.name == "users.manage")
            )
        ).one()
        session.add(RolePermission(role_id=recruiter.id, permission_id=users_manage.id))
        await session.commit()

    try:
        # Stale access token still lacks users.manage
        assert (await client.get(USERS_URL, headers=headers)).status_code == 403

        r = await client.post(
            f"{settings.API_V1_STR}/auth/refresh",
            json={"refresh_token": pair["refresh_token"]},
        )
        assert r.status_code == 200
        new_access = client.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
        assert new_access
        client.cookies.clear()
        new_headers = {"Authorization": f"Bearer {new_access}"}
        payload = jwt.decode(
            new_access,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        assert "users.manage" in payload["permissions"]
        assert (await client.get(USERS_URL, headers=new_headers)).status_code == 200
    finally:
        async with bypass_rls_session() as session:
            recruiter = (
                await session.exec(select(Role).where(Role.name == "recruiter"))
            ).one()
            users_manage = (
                await session.exec(
                    select(Permission).where(Permission.name == "users.manage")
                )
            ).one()
            link = await session.get(RolePermission, (recruiter.id, users_manage.id))
            if link:
                await session.delete(link)
                await session.commit()


async def test_authenticated_session_sets_user_gucs(
    superuser_token_headers: dict[str, str],
) -> None:
    """After get_current_user, transaction has app.current_user_id / role GUCs."""
    from sqlalchemy import event
    from starlette.requests import Request

    token = superuser_token_headers["Authorization"].split(" ", 1)[1]
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": [],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }
    request = Request(scope)

    async with session_context() as session:

        def _set_rls(_sess: object, _trans: object, connection: object) -> None:
            apply_rls_context(connection, tenant_id=settings.TENANT_ID)  # type: ignore[arg-type]

        event.listen(session.sync_session, "after_begin", _set_rls)
        try:
            await session.execute(text("SELECT 1"))
            user = await get_current_user(
                request=request,
                session=session,
                creds=token,
                _access_cookie=None,
            )
            assert str(user.id) == payload["sub"]

            row = (
                await session.execute(
                    text(
                        "SELECT current_setting('app.current_user_id', true), "
                        "current_setting('app.current_user_role', true), "
                        "current_setting('app.current_tenant', true)"
                    )
                )
            ).one()
            assert row[0] == str(user.id)
            assert row[1] == "administrator"
            assert row[2] == str(settings.TENANT_ID)
        finally:
            event.remove(session.sync_session, "after_begin", _set_rls)

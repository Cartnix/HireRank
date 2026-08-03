"""TDD: RBAC boundaries — 403 vs 401; JWT permissions claim drives require_permission."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, select

from app.api.deps import apply_rls_context, get_current_user
from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import Permission, Role, RolePermission
from tests.conftest import bypass_rls_session
from tests.utils.utils import random_email, random_lower_string

USERS_URL = f"{settings.API_V1_STR}/users/"
ME_URL = f"{settings.API_V1_STR}/auth/me"


def test_admin_can_list_users(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.get(USERS_URL, headers=superuser_token_headers)
    assert r.status_code == 200
    payload = jwt.decode(
        superuser_token_headers["Authorization"].split(" ", 1)[1],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    assert "users.manage" in payload["permissions"]


def test_candidate_valid_token_forbidden_on_users_manage(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    assert r.status_code == 201
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    r = client.get(ME_URL, headers=headers)
    assert r.status_code == 200  # authenticated

    r = client.get(USERS_URL, headers=headers)
    assert r.status_code == 403  # not 401
    assert r.json()["detail"] == "Insufficient permissions"


def test_recruiter_forbidden_on_users_manage(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "recruiter",
        },
    )
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.get(USERS_URL, headers=headers)
    assert r.status_code == 403


def test_jwt_role_claim_alone_does_not_grant_permissions(client: TestClient) -> None:
    """
    Elevating only the role claim (without permissions) must not unlock
    users.manage — require_permission reads the JWT permissions claim.
    """
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    pair = r.json()
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
    r = client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 403


def test_role_escalation_with_wrong_signing_key_is_401(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    sub = jwt.decode(
        r.json()["access_token"],
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
    r = client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


def test_db_permission_change_picked_up_after_refresh(client: TestClient) -> None:
    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "recruiter"},
    )
    assert r.status_code == 201
    pair = r.json()
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    assert client.get(USERS_URL, headers=headers).status_code == 403

    with bypass_rls_session() as session:
        recruiter = session.exec(select(Role).where(Role.name == "recruiter")).one()
        users_manage = session.exec(
            select(Permission).where(Permission.name == "users.manage")
        ).one()
        session.add(RolePermission(role_id=recruiter.id, permission_id=users_manage.id))
        session.commit()

    try:
        # Stale access token still lacks users.manage
        assert client.get(USERS_URL, headers=headers).status_code == 403

        r = client.post(
            f"{settings.API_V1_STR}/auth/refresh",
            json={"refresh_token": pair["refresh_token"]},
        )
        assert r.status_code == 200
        new_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        payload = jwt.decode(
            r.json()["access_token"],
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        assert "users.manage" in payload["permissions"]
        assert client.get(USERS_URL, headers=new_headers).status_code == 200
    finally:
        with bypass_rls_session() as session:
            recruiter = session.exec(select(Role).where(Role.name == "recruiter")).one()
            users_manage = session.exec(
                select(Permission).where(Permission.name == "users.manage")
            ).one()
            link = session.get(RolePermission, (recruiter.id, users_manage.id))
            if link:
                session.delete(link)
                session.commit()


def test_authenticated_session_sets_user_gucs(
    superuser_token_headers: dict[str, str],
) -> None:
    """After get_current_user, transaction has app.current_user_id / role GUCs."""
    from fastapi.security import HTTPAuthorizationCredentials
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
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with Session(engine) as session:

        def _set_rls(_sess: Session, _trans: object, connection: object) -> None:
            apply_rls_context(connection, tenant_id=settings.TENANT_ID)  # type: ignore[arg-type]

        event.listen(session, "after_begin", _set_rls)
        try:
            session.execute(text("SELECT 1"))
            user = get_current_user(request=request, session=session, creds=creds)
            assert str(user.id) == payload["sub"]

            row = session.execute(
                text(
                    "SELECT current_setting('app.current_user_id', true), "
                    "current_setting('app.current_user_role', true), "
                    "current_setting('app.current_tenant', true)"
                )
            ).one()
            assert row[0] == str(user.id)
            assert row[1] == "administrator"
            assert row[2] == str(settings.TENANT_ID)
        finally:
            event.remove(session, "after_begin", _set_rls)

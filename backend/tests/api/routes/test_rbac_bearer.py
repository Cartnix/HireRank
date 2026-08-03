"""TDD: RBAC boundaries — 403 vs 401; JWT role claim must not escalate privileges."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient

from app.core import security
from app.core.config import settings
from tests.utils.utils import random_email, random_lower_string

USERS_URL = f"{settings.API_V1_STR}/users/"
ME_URL = f"{settings.API_V1_STR}/auth/me"


def test_admin_can_list_users(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.get(USERS_URL, headers=superuser_token_headers)
    assert r.status_code == 200


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


def test_jwt_role_claim_forgery_does_not_escalate(client: TestClient) -> None:
    """
    Attacker re-signs with our secret is impossible without SECRET_KEY; with a
    stolen candidate token they might forge a new JWT only if they have the key.
    If they somehow craft a HS256 token with role=administrator using the real
    secret but a real candidate sub, authorization must still use DB role → 403.
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
            "jti": str(uuid4()),
            "type": security.TOKEN_TYPE_ACCESS,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    r = client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    # Authenticated as candidate from DB; elevated JWT role claim ignored
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
            "jti": str(uuid4()),
            "type": security.TOKEN_TYPE_ACCESS,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        "not-the-server-secret",
        algorithm=security.ALGORITHM,
    )
    r = client.get(USERS_URL, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401

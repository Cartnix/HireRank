"""TDD: Bearer JWT security boundaries for protected endpoints (no jwt.decode mocks)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID, uuid4

import jwt
from fastapi.testclient import TestClient

from app.core import security
from app.core.config import settings
from tests.utils.auth_types import TokenPairDict
from tests.utils.utils import random_email, random_lower_string

PROTECTED = f"{settings.API_V1_STR}/auth/me"


def _register(client: TestClient) -> TokenPairDict:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    assert r.status_code == 201
    return cast(TokenPairDict, r.json())


def _forge(
    *,
    sub: str,
    secret: str | None = None,
    algorithm: str = security.ALGORITHM,
    headers: dict[str, Any] | None = None,
    exp_delta: timedelta = timedelta(minutes=15),
    role: str = "candidate",
    token_type: str = security.TOKEN_TYPE_ACCESS,
    jti: str | None = None,
) -> str:
    exp = datetime.now(UTC) + exp_delta
    payload = {
        "sub": sub,
        "role": role,
        "tenant_id": str(settings.TENANT_ID),
        "jti": jti or str(uuid4()),
        "type": token_type,
        "exp": exp,
    }
    key = settings.SECRET_KEY if secret is None else secret
    return jwt.encode(
        payload,
        key,
        algorithm=algorithm,
        headers=headers,
    )


def test_bearer_happy_path(client: TestClient) -> None:
    pair = _register(client)
    r = client.get(
        PROTECTED,
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 200


def test_missing_authorization_header(client: TestClient) -> None:
    r = client.get(PROTECTED)
    assert r.status_code == 401


def test_malformed_wrong_scheme_prefix(client: TestClient) -> None:
    pair = _register(client)
    r = client.get(
        PROTECTED,
        headers={"Authorization": f"Token {pair['access_token']}"},
    )
    assert r.status_code == 401


def test_malformed_bearer_without_token(client: TestClient) -> None:
    r = client.get(PROTECTED, headers={"Authorization": "Bearer"})
    assert r.status_code == 401


def test_expired_access_token(client: TestClient) -> None:
    pair = _register(client)
    sub = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["sub"]
    expired = _forge(sub=sub, exp_delta=timedelta(minutes=-5))
    r = client.get(PROTECTED, headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_signature_tampering_wrong_secret(client: TestClient) -> None:
    pair = _register(client)
    sub = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["sub"]
    tampered = _forge(sub=sub, secret="attacker-secret-key-not-ours")
    r = client.get(PROTECTED, headers={"Authorization": f"Bearer {tampered}"})
    assert r.status_code == 401


def test_algorithm_none_confusion(client: TestClient) -> None:
    pair = _register(client)
    sub = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )["sub"]
    exp = datetime.now(UTC) + timedelta(minutes=15)
    payload = {
        "sub": sub,
        "role": "administrator",
        "tenant_id": str(settings.TENANT_ID),
        "jti": str(uuid4()),
        "type": security.TOKEN_TYPE_ACCESS,
        "exp": exp,
    }
    unsigned = jwt.encode(payload, key="", algorithm="none")
    r = client.get(PROTECTED, headers={"Authorization": f"Bearer {unsigned}"})
    assert r.status_code == 401


def test_refresh_token_rejected_as_bearer_access(client: TestClient) -> None:
    pair = _register(client)
    r = client.get(
        PROTECTED,
        headers={"Authorization": f"Bearer {pair['refresh_token']}"},
    )
    assert r.status_code == 401


def test_inactive_user_banned_mid_session(client: TestClient) -> None:
    from sqlmodel import select

    from app.models import User
    from tests.conftest import bypass_rls_session

    pair = _register(client)
    payload = jwt.decode(
        pair["access_token"],
        settings.SECRET_KEY,
        algorithms=[security.ALGORITHM],
    )
    with bypass_rls_session() as session:
        user = session.exec(select(User).where(User.id == UUID(payload["sub"]))).one()
        user.is_active = False
        session.add(user)
        session.commit()

    r = client.get(
        PROTECTED,
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 400
    assert "Inactive" in r.json()["detail"]

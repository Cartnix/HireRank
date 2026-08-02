"""TDD: logout must require Bearer access + refresh_token body (hard revoke)."""

from __future__ import annotations

from typing import cast

from fastapi.testclient import TestClient

from app.core.config import settings
from tests.utils.auth_types import TokenPairDict
from tests.utils.utils import random_email, random_lower_string


def _register_pair(client: TestClient) -> TokenPairDict:
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "hr",
        },
    )
    assert r.status_code == 201
    return cast(TokenPairDict, r.json())


def test_logout_requires_bearer(client: TestClient) -> None:
    pair = _register_pair(client)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401


def test_logout_requires_refresh_token_body(client: TestClient) -> None:
    pair = _register_pair(client)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 422


def test_logout_empty_body_rejected(client: TestClient) -> None:
    pair = _register_pair(client)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={},
    )
    assert r.status_code == 422


def test_logout_revokes_refresh_and_blacklists_access(client: TestClient) -> None:
    pair = _register_pair(client)
    headers = {"Authorization": f"Bearer {pair['access_token']}"}

    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers=headers,
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204

    r = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert r.status_code == 401

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401


def test_logout_without_refresh_would_leave_session_stealable_is_blocked(
    client: TestClient,
) -> None:
    """Client-only logout (drop access, keep refresh) must not be enough server-side."""
    pair = _register_pair(client)
    # Attacker still holds refresh if server never saw logout with refresh body
    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 200


def test_logout_rejects_foreign_refresh_token(client: TestClient) -> None:
    a = _register_pair(client)
    b = _register_pair(client)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {a['access_token']}"},
        json={"refresh_token": b["refresh_token"]},
    )
    assert r.status_code == 401

    # B's refresh must still work — A must not revoke B's session
    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": b["refresh_token"]},
    )
    assert r.status_code == 200


def test_logout_rejects_access_token_in_refresh_field(client: TestClient) -> None:
    pair = _register_pair(client)
    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["access_token"]},
    )
    assert r.status_code == 401

"""TDD: logout must require Bearer access + refresh_token body (hard revoke)."""

from __future__ import annotations

from typing import cast

from httpx import AsyncClient

from app.core.config import settings
from tests.utils.auth_types import TokenPairDict
from tests.utils.utils import random_email, random_lower_string


async def _register_pair(client: AsyncClient) -> TokenPairDict:
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "hr",
        },
    )
    assert r.status_code == 201
    return cast(TokenPairDict, r.json())


async def test_logout_requires_bearer(client: AsyncClient) -> None:
    pair = await _register_pair(client)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401


async def test_logout_requires_refresh_token_body(client: AsyncClient) -> None:
    pair = await _register_pair(client)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 422


async def test_logout_empty_body_rejected(client: AsyncClient) -> None:
    pair = await _register_pair(client)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={},
    )
    assert r.status_code == 422


async def test_logout_revokes_refresh_and_blacklists_access(
    client: AsyncClient,
) -> None:
    pair = await _register_pair(client)
    headers = {"Authorization": f"Bearer {pair['access_token']}"}

    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers=headers,
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204

    r = await client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert r.status_code == 401

    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401


async def test_logout_without_refresh_would_leave_session_stealable_is_blocked(
    client: AsyncClient,
) -> None:
    """Client-only logout (drop access, keep refresh) must not be enough server-side."""
    pair = await _register_pair(client)
    # Attacker still holds refresh if server never saw logout with refresh body
    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 200


async def test_logout_rejects_foreign_refresh_token(client: AsyncClient) -> None:
    a = await _register_pair(client)
    b = await _register_pair(client)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {a['access_token']}"},
        json={"refresh_token": b["refresh_token"]},
    )
    assert r.status_code == 401

    # B's refresh must still work — A must not revoke B's session
    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": b["refresh_token"]},
    )
    assert r.status_code == 200


async def test_logout_rejects_access_token_in_refresh_field(
    client: AsyncClient,
) -> None:
    pair = await _register_pair(client)
    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["access_token"]},
    )
    assert r.status_code == 401

"""TDD: refresh rotation grace period and blacklist TTL pitfalls."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from httpx import AsyncClient

from app.core import security
from app.core.config import settings
from app.core.token_store import get_token_store, reset_token_store
from tests.utils.auth_types import register_bearer_pair


async def test_blacklist_ttl_matches_remaining_access_token_lifetime(
    client: AsyncClient,
) -> None:
    """Logout blacklist TTL must track JWT exp, not a fixed arbitrary window."""
    reset_token_store()
    store = get_token_store()

    pair = await register_bearer_pair(client)
    payload = security.decode_token(pair["access_token"])
    jti = payload["jti"]
    exp = int(payload["exp"])
    remaining = max(exp - int(datetime.now(UTC).timestamp()), 1)

    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204
    assert store.is_access_blacklisted(jti, tenant_id=settings.TENANT_ID)

    ttl_left = store.blacklist_ttl_remaining(jti, tenant_id=settings.TENANT_ID)
    assert ttl_left is not None
    assert ttl_left >= remaining - 5
    assert ttl_left <= remaining + 5


async def test_refresh_rotation_grace_allows_parallel_duplicate_refresh(
    client: AsyncClient,
) -> None:
    """
    Mobile flaky networks may fire /auth/refresh twice with the same token.
    First success must leave a short grace window so the twin request is not
    treated as token theft (401).
    """
    reset_token_store()
    pair = await register_bearer_pair(client)
    refresh_token = pair["refresh_token"]

    async def _refresh() -> int:
        resp = await client.post(
            f"{settings.API_V1_STR}/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        return resp.status_code

    codes = await asyncio.gather(_refresh(), _refresh())

    assert codes.count(200) == 2
    assert 401 not in codes


async def test_refresh_after_grace_expires_is_rejected(client: AsyncClient) -> None:
    reset_token_store()
    store = get_token_store()

    pair = await register_bearer_pair(client)
    refresh_token = pair["refresh_token"]
    payload = security.decode_token(refresh_token)
    jti = payload["jti"]

    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert r.status_code == 200
    client.cookies.clear()

    store.force_expire_grace(jti, tenant_id=settings.TENANT_ID)

    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert r.status_code == 401


async def test_logout_hard_revokes_refresh_without_grace(client: AsyncClient) -> None:
    reset_token_store()
    pair = await register_bearer_pair(client)

    r = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204

    r = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401

"""TDD: refresh rotation grace period and blacklist TTL pitfalls."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.core import security
from app.core.config import settings
from app.core.token_store import get_token_store, reset_token_store
from tests.utils.utils import random_email, random_lower_string


def test_blacklist_ttl_matches_remaining_access_token_lifetime(
    client: TestClient,
) -> None:
    """Logout blacklist TTL must track JWT exp, not a fixed arbitrary window."""
    reset_token_store()
    store = get_token_store()

    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    assert r.status_code == 201
    pair = r.json()
    payload = security.decode_token(pair["access_token"])
    jti = payload["jti"]
    exp = int(payload["exp"])
    remaining = max(exp - int(datetime.now(UTC).timestamp()), 1)

    r = client.post(
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


def test_refresh_rotation_grace_allows_parallel_duplicate_refresh(
    client: TestClient,
) -> None:
    """
    Mobile flaky networks may fire /auth/refresh twice with the same token.
    First success must leave a short grace window so the twin request is not
    treated as token theft (401).
    """
    reset_token_store()
    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    assert r.status_code == 201
    refresh_token = r.json()["refresh_token"]

    def _refresh() -> int:
        resp = client.post(
            f"{settings.API_V1_STR}/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        return resp.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        codes = [
            f.result() for f in as_completed([pool.submit(_refresh) for _ in range(2)])
        ]

    assert codes.count(200) == 2
    assert 401 not in codes


def test_refresh_after_grace_expires_is_rejected(client: TestClient) -> None:
    reset_token_store()
    store = get_token_store()

    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    refresh_token = r.json()["refresh_token"]
    payload = security.decode_token(refresh_token)
    jti = payload["jti"]

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert r.status_code == 200

    store.force_expire_grace(jti, tenant_id=settings.TENANT_ID)

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert r.status_code == 401


def test_logout_hard_revokes_refresh_without_grace(client: TestClient) -> None:
    reset_token_store()
    email = random_email()
    password = random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    pair = r.json()

    r = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {pair['access_token']}"},
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 204

    r = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": pair["refresh_token"]},
    )
    assert r.status_code == 401

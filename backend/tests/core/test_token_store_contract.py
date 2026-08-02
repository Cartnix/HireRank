"""Contract tests: Memory and Redis token stores are interchangeable for Enterprise.

Proves the repository abstraction is SaaS-ready: tenant-prefixed keys, no
cross-tenant session bleed, and bulk tenant revoke (company lockout).
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator

import pytest

from app.core.token_store import MemoryTokenStore, RedisTokenStore, TokenStore


@pytest.fixture(params=["memory", "redis"])
def store(request: pytest.FixtureRequest) -> Iterator[TokenStore]:
    if request.param == "memory":
        yield MemoryTokenStore()
        return

    fakeredis = pytest.importorskip("fakeredis")
    client = fakeredis.FakeRedis(decode_responses=True)
    yield RedisTokenStore(client=client)


TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"


def test_store_refresh_roundtrip(store: TokenStore) -> None:
    store.store_refresh("jti-1", "user-1", ttl_seconds=60, tenant_id=TENANT_A)
    assert store.get_refresh_user("jti-1", tenant_id=TENANT_A) == "user-1"


def test_cross_tenant_refresh_lookup_is_isolated(store: TokenStore) -> None:
    """Same jti under tenant B must not resolve tenant A's session."""
    store.store_refresh("shared-jti", "user-a", ttl_seconds=60, tenant_id=TENANT_A)
    assert store.get_refresh_user("shared-jti", tenant_id=TENANT_A) == "user-a"
    assert store.get_refresh_user("shared-jti", tenant_id=TENANT_B) is None


def test_blacklist_is_tenant_scoped(store: TokenStore) -> None:
    store.blacklist_access("jti-x", ttl_seconds=30, tenant_id=TENANT_A)
    assert store.is_access_blacklisted("jti-x", tenant_id=TENANT_A) is True
    assert store.is_access_blacklisted("jti-x", tenant_id=TENANT_B) is False


def test_grace_window_then_force_expire(store: TokenStore) -> None:
    store.store_refresh("jti-g", "user-1", ttl_seconds=60, tenant_id=TENANT_A)
    store.revoke_refresh("jti-g", grace_seconds=30, tenant_id=TENANT_A)
    assert store.get_refresh_user("jti-g", tenant_id=TENANT_A) == "user-1"
    store.force_expire_grace("jti-g", tenant_id=TENANT_A)
    assert store.get_refresh_user("jti-g", tenant_id=TENANT_A) is None


def test_hard_revoke_drops_grace(store: TokenStore) -> None:
    store.store_refresh("jti-h", "user-1", ttl_seconds=60, tenant_id=TENANT_A)
    store.revoke_refresh("jti-h", grace_seconds=30, tenant_id=TENANT_A)
    store.revoke_refresh("jti-h", grace_seconds=None, tenant_id=TENANT_A)
    assert store.get_refresh_user("jti-h", tenant_id=TENANT_A) is None


def test_revoke_tenant_lockout_does_not_affect_other_tenant(store: TokenStore) -> None:
    store.store_refresh("j1", "ua", ttl_seconds=60, tenant_id=TENANT_A)
    store.store_refresh("j2", "ub", ttl_seconds=60, tenant_id=TENANT_B)
    store.blacklist_access("j1", ttl_seconds=60, tenant_id=TENANT_A)

    removed = store.revoke_tenant(TENANT_A)
    assert removed >= 1
    assert store.get_refresh_user("j1", tenant_id=TENANT_A) is None
    assert store.is_access_blacklisted("j1", tenant_id=TENANT_A) is False
    assert store.get_refresh_user("j2", tenant_id=TENANT_B) == "ub"


def test_redis_key_prefix_includes_tenant_id() -> None:
    """Enterprise/SaaS safety: keys must be namespaced by tenant."""
    fakeredis = pytest.importorskip("fakeredis")
    client = fakeredis.FakeRedis(decode_responses=True)
    store = RedisTokenStore(client=client)
    jti = str(uuid.uuid4())
    store.store_refresh(jti, "user-1", ttl_seconds=60, tenant_id=TENANT_A)
    expected = f"tenant:{TENANT_A}:refresh:{jti}"
    assert client.exists(expected) == 1
    assert client.get(expected) == "user-1"
    # No unscoped legacy key
    assert client.exists(f"refresh:{jti}") == 0


def test_memory_and_redis_satisfy_same_protocol_surface() -> None:
    """Switching TOKEN_STORE=redis must not require call-site changes."""
    required = {
        "store_refresh",
        "get_refresh_user",
        "revoke_refresh",
        "blacklist_access",
        "is_access_blacklisted",
        "force_expire_grace",
        "blacklist_ttl_remaining",
        "revoke_tenant",
    }
    assert required.issubset(set(dir(MemoryTokenStore)))
    assert required.issubset(set(dir(RedisTokenStore)))


def test_pytest_harness_matches_token_store_setting() -> None:
    """conftest must wire fakeredis when TOKEN_STORE=redis (no real socket)."""
    from app.core.config import settings
    from app.core.token_store import get_token_store

    store = get_token_store()
    if settings.TOKEN_STORE == "redis":
        assert isinstance(store, RedisTokenStore)
        assert getattr(store, "_client", None) is not None
    else:
        assert isinstance(store, MemoryTokenStore)

"""Refresh-token store and access-token jti blacklist.

Both Memory (Core / single-instance) and Redis (Enterprise / SaaS multi-instance)
implement the same TokenStore contract. Redis keys are always tenant-scoped so
SaaS can isolate and bulk-revoke sessions per company.
"""

from __future__ import annotations

import threading
import time
from typing import Protocol
from uuid import UUID

from app.core.config import settings


def _tenant_str(tenant_id: str | UUID | None) -> str:
    if tenant_id is None:
        return str(settings.TENANT_ID)
    return str(tenant_id)


class TokenStore(Protocol):
    def store_refresh(
        self,
        jti: str,
        user_id: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None: ...

    def get_refresh_user(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> str | None: ...

    def revoke_refresh(
        self,
        jti: str,
        *,
        grace_seconds: int | None = None,
        tenant_id: str | UUID | None = None,
    ) -> None: ...

    def blacklist_access(
        self,
        jti: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None: ...

    def is_access_blacklisted(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> bool: ...

    def force_expire_grace(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> None: ...

    def blacklist_ttl_remaining(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> float | None: ...

    def revoke_tenant(self, tenant_id: str | UUID) -> int: ...


class MemoryTokenStore:
    """In-process store — Core / single FastAPI replica only."""

    def __init__(self) -> None:
        # composite key "tenant_id:jti" -> (user_id, expires_at) or expires_at
        self._refresh: dict[str, tuple[str, float]] = {}
        self._grace: dict[str, tuple[str, float]] = {}
        self._blacklist: dict[str, float] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _ck(tenant_id: str | UUID | None, jti: str) -> str:
        return f"{_tenant_str(tenant_id)}:{jti}"

    def _purge(self) -> None:
        now = time.time()
        self._refresh = {k: v for k, v in self._refresh.items() if v[1] > now}
        self._grace = {k: v for k, v in self._grace.items() if v[1] > now}
        self._blacklist = {k: exp for k, exp in self._blacklist.items() if exp > now}

    def store_refresh(
        self,
        jti: str,
        user_id: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            self._refresh[ck] = (user_id, time.time() + ttl_seconds)
            self._grace.pop(ck, None)

    def get_refresh_user(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> str | None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            entry = self._refresh.get(ck) or self._grace.get(ck)
            return entry[0] if entry else None

    def revoke_refresh(
        self,
        jti: str,
        *,
        grace_seconds: int | None = None,
        tenant_id: str | UUID | None = None,
    ) -> None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            entry = self._refresh.pop(ck, None)
            if grace_seconds and grace_seconds > 0:
                if entry is None and ck in self._grace:
                    return
                if entry is None:
                    return
                self._grace[ck] = (entry[0], time.time() + grace_seconds)
            else:
                self._grace.pop(ck, None)

    def blacklist_access(
        self,
        jti: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            self._blacklist[ck] = time.time() + max(ttl_seconds, 1)

    def is_access_blacklisted(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> bool:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            return ck in self._blacklist

    def force_expire_grace(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._grace.pop(ck, None)

    def blacklist_ttl_remaining(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> float | None:
        ck = self._ck(tenant_id, jti)
        with self._lock:
            self._purge()
            exp = self._blacklist.get(ck)
            if exp is None:
                return None
            return max(exp - time.time(), 0.0)

    def revoke_tenant(self, tenant_id: str | UUID) -> int:
        prefix = f"{_tenant_str(tenant_id)}:"
        with self._lock:
            n = 0
            for bag in (self._refresh, self._grace, self._blacklist):
                keys = [k for k in bag if k.startswith(prefix)]
                n += len(keys)
                for k in keys:
                    del bag[k]
            return n


class RedisTokenStore:
    """Shared store for multi-replica Enterprise / SaaS deploys."""

    def __init__(
        self,
        redis_url: str | None = None,
        *,
        client: object | None = None,
    ) -> None:
        if client is not None:
            self._client = client
        else:
            import redis

            self._client = redis.Redis.from_url(
                redis_url or settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )

    def _key(self, kind: str, jti: str, tenant_id: str | UUID | None) -> str:
        return f"tenant:{_tenant_str(tenant_id)}:{kind}:{jti}"

    def store_refresh(
        self,
        jti: str,
        user_id: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None:
        pipe = self._client.pipeline()  # type: ignore[attr-defined]
        pipe.set(self._key("refresh", jti, tenant_id), user_id, ex=ttl_seconds)
        pipe.delete(self._key("grace", jti, tenant_id))
        pipe.execute()

    def get_refresh_user(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> str | None:
        value = self._client.get(  # type: ignore[attr-defined]
            self._key("refresh", jti, tenant_id)
        ) or self._client.get(  # type: ignore[attr-defined]
            self._key("grace", jti, tenant_id)
        )
        return str(value) if value else None

    def revoke_refresh(
        self,
        jti: str,
        *,
        grace_seconds: int | None = None,
        tenant_id: str | UUID | None = None,
    ) -> None:
        refresh_key = self._key("refresh", jti, tenant_id)
        grace_key = self._key("grace", jti, tenant_id)
        user_id = self._client.get(refresh_key)  # type: ignore[attr-defined]
        if grace_seconds and grace_seconds > 0:
            if user_id:
                pipe = self._client.pipeline()  # type: ignore[attr-defined]
                pipe.set(grace_key, str(user_id), ex=grace_seconds)
                pipe.delete(refresh_key)
                pipe.execute()
            return
        pipe = self._client.pipeline()  # type: ignore[attr-defined]
        pipe.delete(refresh_key)
        pipe.delete(grace_key)
        pipe.execute()

    def blacklist_access(
        self,
        jti: str,
        ttl_seconds: int,
        *,
        tenant_id: str | UUID | None = None,
    ) -> None:
        self._client.set(  # type: ignore[attr-defined]
            self._key("blacklist", jti, tenant_id),
            "1",
            ex=max(ttl_seconds, 1),
        )

    def is_access_blacklisted(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> bool:
        return bool(
            self._client.exists(self._key("blacklist", jti, tenant_id))  # type: ignore[attr-defined]
        )

    def force_expire_grace(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> None:
        self._client.delete(self._key("grace", jti, tenant_id))  # type: ignore[attr-defined]

    def blacklist_ttl_remaining(
        self, jti: str, *, tenant_id: str | UUID | None = None
    ) -> float | None:
        ttl = self._client.ttl(self._key("blacklist", jti, tenant_id))  # type: ignore[attr-defined]
        if ttl is None or int(ttl) < 0:
            return None
        return float(ttl)

    def revoke_tenant(self, tenant_id: str | UUID) -> int:
        pattern = f"tenant:{_tenant_str(tenant_id)}:*"
        deleted = 0
        cursor: int = 0
        while True:
            cursor, keys = self._client.scan(  # type: ignore[attr-defined]
                cursor=cursor, match=pattern, count=100
            )
            if keys:
                deleted += int(self._client.delete(*keys))  # type: ignore[attr-defined]
            if cursor == 0:
                break
        return deleted


_store: TokenStore | None = None


def create_token_store() -> TokenStore:
    """Build a store from settings.TOKEN_STORE (memory | redis)."""
    if settings.TOKEN_STORE == "memory":
        return MemoryTokenStore()
    return RedisTokenStore(settings.REDIS_URL)


def get_token_store() -> TokenStore:
    global _store
    if _store is None:
        _store = create_token_store()
    return _store


def reset_token_store(store: TokenStore | None = None) -> TokenStore:
    """Replace singleton; with no arg, create a fresh store from settings."""
    global _store
    _store = create_token_store() if store is None else store
    return _store

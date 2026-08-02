"""Refresh-token store and access-token jti blacklist."""

from __future__ import annotations

import threading
import time
from typing import Protocol

from app.core.config import settings


class TokenStore(Protocol):
    def store_refresh(self, jti: str, user_id: str, ttl_seconds: int) -> None: ...

    def get_refresh_user(self, jti: str) -> str | None: ...

    def revoke_refresh(self, jti: str, *, grace_seconds: int | None = None) -> None: ...

    def blacklist_access(self, jti: str, ttl_seconds: int) -> None: ...

    def is_access_blacklisted(self, jti: str) -> bool: ...


class MemoryTokenStore:
    def __init__(self) -> None:
        # jti -> (user_id, expires_at)
        self._refresh: dict[str, tuple[str, float]] = {}
        self._grace: dict[str, tuple[str, float]] = {}
        self._blacklist: dict[str, float] = {}
        self._lock = threading.Lock()

    def _purge(self) -> None:
        now = time.time()
        self._refresh = {k: v for k, v in self._refresh.items() if v[1] > now}
        self._grace = {k: v for k, v in self._grace.items() if v[1] > now}
        self._blacklist = {k: exp for k, exp in self._blacklist.items() if exp > now}

    def store_refresh(self, jti: str, user_id: str, ttl_seconds: int) -> None:
        with self._lock:
            self._purge()
            self._refresh[jti] = (user_id, time.time() + ttl_seconds)
            self._grace.pop(jti, None)

    def get_refresh_user(self, jti: str) -> str | None:
        with self._lock:
            self._purge()
            entry = self._refresh.get(jti) or self._grace.get(jti)
            return entry[0] if entry else None

    def revoke_refresh(self, jti: str, *, grace_seconds: int | None = None) -> None:
        with self._lock:
            self._purge()
            entry = self._refresh.pop(jti, None)
            if grace_seconds and grace_seconds > 0:
                user_id = entry[0] if entry else None
                if user_id is None and jti in self._grace:
                    # already in grace — keep existing window
                    return
                if user_id is None:
                    return
                self._grace[jti] = (user_id, time.time() + grace_seconds)
            else:
                self._grace.pop(jti, None)

    def blacklist_access(self, jti: str, ttl_seconds: int) -> None:
        with self._lock:
            self._purge()
            self._blacklist[jti] = time.time() + max(ttl_seconds, 1)

    def is_access_blacklisted(self, jti: str) -> bool:
        with self._lock:
            self._purge()
            return jti in self._blacklist


class RedisTokenStore:
    def __init__(self, redis_url: str) -> None:
        import redis

        self._client = redis.Redis.from_url(redis_url, decode_responses=True)

    def store_refresh(self, jti: str, user_id: str, ttl_seconds: int) -> None:
        pipe = self._client.pipeline()
        pipe.setex(f"refresh:{jti}", ttl_seconds, user_id)
        pipe.delete(f"grace:{jti}")
        pipe.execute()

    def get_refresh_user(self, jti: str) -> str | None:
        value = self._client.get(f"refresh:{jti}") or self._client.get(f"grace:{jti}")
        return str(value) if value else None

    def revoke_refresh(self, jti: str, *, grace_seconds: int | None = None) -> None:
        user_id = self._client.get(f"refresh:{jti}")
        if grace_seconds and grace_seconds > 0:
            if user_id:
                pipe = self._client.pipeline()
                pipe.setex(f"grace:{jti}", grace_seconds, str(user_id))
                pipe.delete(f"refresh:{jti}")
                pipe.execute()
            return
        pipe = self._client.pipeline()
        pipe.delete(f"refresh:{jti}")
        pipe.delete(f"grace:{jti}")
        pipe.execute()

    def blacklist_access(self, jti: str, ttl_seconds: int) -> None:
        self._client.setex(f"blacklist:{jti}", max(ttl_seconds, 1), "1")

    def is_access_blacklisted(self, jti: str) -> bool:
        return bool(self._client.exists(f"blacklist:{jti}"))


_store: TokenStore | None = None


def get_token_store() -> TokenStore:
    global _store
    if _store is None:
        if settings.TOKEN_STORE == "memory":
            _store = MemoryTokenStore()
        else:
            _store = RedisTokenStore(settings.REDIS_URL)
    return _store


def reset_token_store() -> None:
    """Test helper to clear the singleton."""
    global _store
    _store = None

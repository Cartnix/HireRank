"""In-memory sliding-window rate limits (Core / single-node).

Auth brute-force gates plus heavy ATS aggregate endpoints (dashboard).
Multi-instance deploys should replace this with a shared store.
"""

from __future__ import annotations

import time
import uuid
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, status

from app.core.config import settings

_lock = Lock()
_buckets: dict[str, deque[float]] = defaultdict(deque)


def _prune(bucket: deque[float], *, window: float, now: float) -> None:
    while bucket and now - bucket[0] > window:
        bucket.popleft()


def hit_rate_limit(
    key: str,
    *,
    limit: int,
    window_seconds: int,
) -> None:
    """Raise 429 if `key` exceeded `limit` events in the sliding window."""
    now = time.monotonic()
    window = float(window_seconds)
    with _lock:
        bucket = _buckets[key]
        _prune(bucket, window=window, now=now)
        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again later.",
            )
        bucket.append(now)


def clear_rate_limit(key: str) -> None:
    with _lock:
        _buckets.pop(key, None)


def login_rate_key(*, ip: str | None, email: str) -> str:
    from app.audit.schemas import hash_email

    return f"login:{(ip or 'unknown')}:{hash_email(email)}"


def check_email_rate_key(*, ip: str | None) -> str:
    return f"check-email:{(ip or 'unknown')}"


def enforce_login_rate_limit(*, ip: str | None, email: str) -> None:
    hit_rate_limit(
        login_rate_key(ip=ip, email=email),
        limit=settings.LOGIN_RATE_LIMIT_ATTEMPTS,
        window_seconds=settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    )


def enforce_check_email_rate_limit(*, ip: str | None) -> None:
    hit_rate_limit(
        check_email_rate_key(ip=ip),
        limit=settings.CHECK_EMAIL_RATE_LIMIT_ATTEMPTS,
        window_seconds=settings.CHECK_EMAIL_RATE_LIMIT_WINDOW_SECONDS,
    )


def dashboard_rate_key(*, user_id: uuid.UUID, ip: str | None) -> str:
    return f"dashboard:{user_id}:{(ip or 'unknown')}"


def enforce_dashboard_rate_limit(*, user_id: uuid.UUID, ip: str | None) -> None:
    hit_rate_limit(
        dashboard_rate_key(user_id=user_id, ip=ip),
        limit=settings.DASHBOARD_RATE_LIMIT_ATTEMPTS,
        window_seconds=settings.DASHBOARD_RATE_LIMIT_WINDOW_SECONDS,
    )

"""oauth pending state with consent snapshot (RK §1.4 before IdP redirect)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from threading import Lock

from app.models import ConsentGrant

_TTL_SECONDS = 600
_lock = Lock()
_pending: dict[str, _Pending] = {}


@dataclass
class _Pending:
    consent: ConsentGrant
    provider: str
    exp: float


def store_oauth_pending(*, state: str, provider: str, consent: ConsentGrant) -> None:
    with _lock:
        _pending[state] = _Pending(
            consent=consent,
            provider=provider,
            exp=time.time() + _TTL_SECONDS,
        )


def pop_oauth_pending(state: str) -> ConsentGrant | None:
    with _lock:
        item = _pending.pop(state, None)
    if item is None:
        return None
    if item.exp < time.time():
        return None
    return item.consent

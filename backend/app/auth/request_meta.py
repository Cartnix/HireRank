"""client IP helpers (proxy-aware) for audit trail."""

from __future__ import annotations

import ipaddress

from starlette.requests import Request


def sanitize_ip(raw: str | None) -> str | None:
    """Store only valid IPs (TestClient uses host 'testclient')."""
    if not raw:
        return None
    try:
        return str(ipaddress.ip_address(raw))
    except ValueError:
        return None


def client_ip(request: Request) -> str | None:
    """Prefer first X-Forwarded-For hop when present (trusted reverse proxy)."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        first = xff.split(",")[0].strip()
        cleaned = sanitize_ip(first)
        if cleaned:
            return cleaned
    if request.client and request.client.host:
        return sanitize_ip(request.client.host)
    return None

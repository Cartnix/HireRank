"""Auth cookie helpers — HttpOnly session + readable CSRF (double-submit)."""

from __future__ import annotations

import secrets
from typing import Literal

from fastapi import Response

from app.core.config import settings

SameSite = Literal["lax", "strict", "none"]


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def _samesite() -> SameSite:
    value = settings.COOKIE_SAMESITE.lower()
    if value not in ("lax", "strict", "none"):
        return "lax"
    return value  # type: ignore[return-value]


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    csrf_token: str | None = None,
) -> str:
    """Set access/refresh (HttpOnly) and CSRF (readable). Returns csrf value."""
    csrf = csrf_token or new_csrf_token()
    access_max = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    secure = settings.COOKIE_SECURE
    samesite = _samesite()
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS_NAME,
        value=access_token,
        httponly=True,
        max_age=access_max,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH_NAME,
        value=refresh_token,
        httponly=True,
        max_age=refresh_max,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_CSRF_NAME,
        value=csrf,
        httponly=False,
        max_age=refresh_max,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    return csrf


def clear_auth_cookies(response: Response) -> None:
    secure = settings.COOKIE_SECURE
    samesite = _samesite()
    for name in (
        settings.AUTH_COOKIE_ACCESS_NAME,
        settings.AUTH_COOKIE_REFRESH_NAME,
        settings.AUTH_COOKIE_CSRF_NAME,
    ):
        response.delete_cookie(
            key=name,
            path="/",
            secure=secure,
            samesite=samesite,
        )

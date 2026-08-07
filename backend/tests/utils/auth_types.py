"""Shared auth helpers for dual cookie / Bearer tests."""

from __future__ import annotations

from typing import TypedDict, cast

from httpx import AsyncClient

from app.core.config import settings
from tests.utils.consent import register_json
from tests.utils.utils import random_email, random_lower_string


class TokenPairDict(TypedDict):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


async def register_bearer_pair(
    client: AsyncClient,
    *,
    role: str = "candidate",
    email: str | None = None,
    password: str | None = None,
) -> TokenPairDict:
    """
    Register via cookie auth, then return Bearer token pair and clear cookies
    so CSRF is not required on subsequent dual-mode API calls.
    """
    email = email or random_email()
    password = password or random_lower_string()
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=register_json(email=email, password=password, role=role),
    )
    assert r.status_code == 201, r.text
    access = client.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    refresh = client.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)
    assert access and refresh
    expires_in = int(r.json().get("expires_in") or 0)
    client.cookies.clear()
    return cast(
        TokenPairDict,
        {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "expires_in": expires_in,
        },
    )

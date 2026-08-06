"""TDD: HttpOnly Secure cookie session + CSRF (issue #31)."""

from __future__ import annotations

import re

import pytest
from httpx import AsyncClient

from app.core.config import settings
from tests.utils.utils import random_email, random_lower_string

AUTH = f"{settings.API_V1_STR}/auth"


def _set_cookie_headers(response: object) -> list[str]:
    # httpx may split multiple Set-Cookie; Starlette exposes get_list
    headers = response.headers  # type: ignore[attr-defined]
    if hasattr(headers, "get_list"):
        values = headers.get_list("set-cookie")
        if values:
            return [str(v) for v in values]
    raw = headers.get("set-cookie")
    if not raw:
        return []
    return [str(raw)]


def _cookie_header_for(name: str, headers: list[str]) -> str | None:
    for h in headers:
        if h.startswith(f"{name}=") or f" {name}=" in f" {h}":
            # first segment is name=value
            if h.lower().startswith(name.lower() + "=") or re.match(
                rf"^{re.escape(name)}=", h, re.I
            ):
                return h
            # sometimes multiple cookies joined — find segment
            for part in re.split(r", (?=[A-Za-z0-9_\-]+=)", h):
                if part.lower().startswith(name.lower() + "="):
                    return part
    return None


@pytest.fixture
def secure_cookies(monkeypatch: pytest.MonkeyPatch) -> None:
    """Assert Secure flags in Set-Cookie; jar storage still works on http testserver."""
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "lax")
    monkeypatch.setattr(settings, "AUTH_COOKIE_ACCESS_NAME", "access_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_REFRESH_NAME", "refresh_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_CSRF_NAME", "csrf_token")


@pytest.fixture
def secure_cookie_flags(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force Secure=True so Set-Cookie headers include the Secure attribute."""
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "lax")
    monkeypatch.setattr(settings, "AUTH_COOKIE_ACCESS_NAME", "access_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_REFRESH_NAME", "refresh_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_CSRF_NAME", "csrf_token")


async def _register(client: AsyncClient) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    assert r.status_code == 201


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookie_flags")
async def test_login_returns_secure_httponly_cookies(client: AsyncClient) -> None:
    email = random_email()
    password = random_lower_string()
    await client.post(
        f"{AUTH}/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    client.cookies.clear()

    response = await client.post(
        f"{AUTH}/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" not in body
    assert "refresh_token" not in body
    assert body.get("expires_in", 0) > 0

    headers = _set_cookie_headers(response)
    access_h = _cookie_header_for(settings.AUTH_COOKIE_ACCESS_NAME, headers)
    assert access_h is not None
    assert "HttpOnly" in access_h
    assert "Secure" in access_h
    assert "SameSite=lax" in access_h or "SameSite=Lax" in access_h

    refresh_h = _cookie_header_for(settings.AUTH_COOKIE_REFRESH_NAME, headers)
    assert refresh_h is not None
    assert "HttpOnly" in refresh_h

    csrf_h = _cookie_header_for(settings.AUTH_COOKIE_CSRF_NAME, headers)
    assert csrf_h is not None
    assert "HttpOnly" not in csrf_h


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_auth_me_succeeds_with_access_cookie_only(client: AsyncClient) -> None:
    await _register(client)
    # Client jar should have cookies from register
    r = await client.get(f"{AUTH}/me")
    assert r.status_code == 200
    assert r.json()["email"]


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_auth_me_missing_cookie_returns_401(client: AsyncClient) -> None:
    client.cookies.clear()
    r = await client.get(f"{AUTH}/me")
    assert r.status_code == 401


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_logout_clears_auth_cookies(client: AsyncClient) -> None:
    await _register(client)
    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    assert csrf

    r = await client.post(
        f"{AUTH}/logout",
        headers={"X-CSRF-Token": csrf},
    )
    assert r.status_code == 204

    headers = _set_cookie_headers(r)
    joined = " ".join(headers).lower()
    # Cleared cookies typically Max-Age=0 or expires in the past
    assert settings.AUTH_COOKIE_ACCESS_NAME.lower() in joined
    assert "max-age=0" in joined or "expires=" in joined


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_post_without_csrf_token_fails(client: AsyncClient) -> None:
    await _register(client)
    # Drop CSRF cookie from jar but keep access (simulate missing header)
    # Keep access cookie; omit X-CSRF-Token header
    r = await client.post(f"{AUTH}/logout")
    assert r.status_code == 403
    assert r.json()["detail"] == "CSRF Token missing or invalid"


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_post_with_matching_csrf_succeeds(client: AsyncClient) -> None:
    await _register(client)
    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    assert csrf
    r = await client.post(
        f"{AUTH}/logout",
        headers={"X-CSRF-Token": csrf},
    )
    assert r.status_code == 204


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_refresh_rotates_cookies(client: AsyncClient) -> None:
    await _register(client)
    old_access = client.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    old_refresh = client.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)
    assert old_access and old_refresh

    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    r = await client.post(
        f"{AUTH}/refresh",
        headers={"X-CSRF-Token": csrf or ""},
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" not in body
    new_access = client.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    new_refresh = client.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)
    assert new_access and new_access != old_access
    assert new_refresh and new_refresh != old_refresh


@pytest.mark.asyncio
@pytest.mark.usefixtures("secure_cookies")
async def test_bearer_still_works_without_cookie(client: AsyncClient) -> None:
    """Dual mode: Authorization Bearer without cookies still authenticates."""
    email = random_email()
    password = random_lower_string()
    r = await client.post(
        f"{AUTH}/register",
        json={"email": email, "password": password, "role": "candidate"},
    )
    assert r.status_code == 201
    # Use legacy form endpoint for Bearer token body
    form = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": email, "password": password},
    )
    assert form.status_code == 200
    token = form.json()["access_token"]
    client.cookies.clear()
    me = await client.get(
        f"{AUTH}/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200

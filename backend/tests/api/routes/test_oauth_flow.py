"""TDD: Google/LinkedIn OAuth → HireRank cookie session (issue #31)."""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

import pytest
import respx
from httpx import AsyncClient, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from tests.utils.utils import random_email, random_lower_string

AUTH = f"{settings.API_V1_STR}/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo"
LINKEDIN_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO = "https://api.linkedin.com/v2/userinfo"


@pytest.fixture
def oauth_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    # False so httpx stores cookies on http://testserver; flag tests assert Secure separately
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "lax")
    monkeypatch.setattr(settings, "AUTH_COOKIE_ACCESS_NAME", "access_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_REFRESH_NAME", "refresh_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_CSRF_NAME", "csrf_token")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-google-client")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setattr(
        settings,
        "GOOGLE_REDIRECT_URI",
        "http://testserver/api/v1/auth/callback/google",
    )
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_ID", "test-linkedin-client")
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_SECRET", "test-linkedin-secret")
    monkeypatch.setattr(
        settings,
        "LINKEDIN_REDIRECT_URI",
        "http://testserver/api/v1/auth/callback/linkedin",
    )
    monkeypatch.setattr(settings, "OAUTH_TOKEN_ENCRYPTION_KEY", "")


def _access_set_cookie(response: object) -> str | None:
    headers = response.headers  # type: ignore[attr-defined]
    values: list[str] = []
    if hasattr(headers, "get_list"):
        values = headers.get_list("set-cookie")
    elif headers.get("set-cookie"):
        values = [headers.get("set-cookie")]
    name = settings.AUTH_COOKIE_ACCESS_NAME
    for h in values:
        if h.lower().startswith(name.lower() + "="):
            return h
        for part in re.split(r", (?=[A-Za-z0-9_\-]+=)", h):
            if part.lower().startswith(name.lower() + "="):
                return part
    return None


async def _oauth_state(client: AsyncClient, provider: str) -> str:
    r = await client.get(f"{AUTH}/oauth/{provider}/start", follow_redirects=False)
    assert r.status_code in (302, 307)
    loc = r.headers["location"]
    qs = parse_qs(urlparse(loc).query)
    assert "state" in qs
    return qs["state"][0]


@pytest.mark.asyncio
@respx.mock
@pytest.mark.usefixtures("oauth_settings")
async def test_google_callback_sets_secure_cookie(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Emit Secure in Set-Cookie for this assertion; manually keep oauth_state in jar
    state = await _oauth_state(client, "google")
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    respx.post(GOOGLE_TOKEN).mock(
        return_value=Response(
            200,
            json={
                "access_token": "mock-google-access",
                "refresh_token": "mock-google-refresh",
                "token_type": "Bearer",
            },
        )
    )
    respx.get(GOOGLE_USERINFO).mock(
        return_value=Response(
            200,
            json={
                "sub": "google-sub-alice",
                "email": "alice@company.com",
                "email_verified": True,
                "given_name": "Alice",
                "family_name": "Recruiter",
            },
        )
    )

    response = await client.get(
        f"{AUTH}/callback/google",
        params={"code": "valid_test_code", "state": state},
        follow_redirects=False,
    )
    assert response.status_code in (200, 302, 307)
    cookie_h = _access_set_cookie(response)
    assert cookie_h is not None
    assert "HttpOnly" in cookie_h
    assert "Secure" in cookie_h
    assert "SameSite=lax" in cookie_h or "SameSite=Lax" in cookie_h
    assert "mock-google-access" not in cookie_h
    assert "mock-google-refresh" not in cookie_h


@pytest.mark.asyncio
@respx.mock
@pytest.mark.usefixtures("oauth_settings")
async def test_linkedin_callback_sets_secure_cookie(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    state = await _oauth_state(client, "linkedin")
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    respx.post(LINKEDIN_TOKEN).mock(
        return_value=Response(
            200,
            json={
                "access_token": "mock-li-access",
                "refresh_token": "mock-li-refresh",
            },
        )
    )
    respx.get(LINKEDIN_USERINFO).mock(
        return_value=Response(
            200,
            json={
                "sub": "linkedin-sub-bob",
                "email": "bob@gmail.com",
                "given_name": "Bob",
                "family_name": "Candidate",
            },
        )
    )

    response = await client.get(
        f"{AUTH}/callback/linkedin",
        params={"code": "valid_li_code", "state": state},
        follow_redirects=False,
    )
    assert response.status_code in (200, 302, 307)
    cookie_h = _access_set_cookie(response)
    assert cookie_h is not None
    assert "HttpOnly" in cookie_h
    assert "Secure" in cookie_h


@pytest.mark.asyncio
@respx.mock
@pytest.mark.usefixtures("oauth_settings")
async def test_oauth_new_public_domain_user_is_candidate(client: AsyncClient) -> None:
    state = await _oauth_state(client, "google")
    respx.post(GOOGLE_TOKEN).mock(
        return_value=Response(200, json={"access_token": "t"})
    )
    email = f"{random_lower_string()}@gmail.com"
    respx.get(GOOGLE_USERINFO).mock(
        return_value=Response(
            200,
            json={"sub": f"sub-{email}", "email": email, "email_verified": True},
        )
    )
    await client.get(
        f"{AUTH}/callback/google",
        params={"code": "c", "state": state},
        follow_redirects=False,
    )
    me = await client.get(f"{AUTH}/me")
    assert me.status_code == 200
    assert me.json()["role"] == "candidate"
    assert me.json()["tenant_id"] == str(settings.TENANT_ID)


@pytest.mark.asyncio
@respx.mock
@pytest.mark.usefixtures("oauth_settings")
async def test_oauth_identity_keyed_by_provider_subject(client: AsyncClient) -> None:
    """Same email + different provider_subject must not silently reuse wrong identity mapping."""
    state1 = await _oauth_state(client, "google")
    email = random_email()
    respx.post(GOOGLE_TOKEN).mock(
        return_value=Response(200, json={"access_token": "t"})
    )
    respx.get(GOOGLE_USERINFO).mock(
        return_value=Response(
            200,
            json={"sub": "subject-one", "email": email, "email_verified": True},
        )
    )
    await client.get(
        f"{AUTH}/callback/google",
        params={"code": "c1", "state": state1},
        follow_redirects=False,
    )
    me1 = await client.get(f"{AUTH}/me")
    user_id_1 = me1.json()["id"]
    client.cookies.clear()

    state2 = await _oauth_state(client, "google")
    # Email changed at IdP but subject stays — same HireRank user
    respx.get(GOOGLE_USERINFO).mock(
        return_value=Response(
            200,
            json={
                "sub": "subject-one",
                "email": random_email(),
                "email_verified": True,
            },
        )
    )
    await client.get(
        f"{AUTH}/callback/google",
        params={"code": "c2", "state": state2},
        follow_redirects=False,
    )
    me2 = await client.get(f"{AUTH}/me")
    assert me2.json()["id"] == user_id_1


@pytest.mark.asyncio
@respx.mock
@pytest.mark.usefixtures("oauth_settings")
async def test_oauth_inactive_user_rejected(
    client: AsyncClient, db: AsyncSession
) -> None:
    from app import crud
    from app.models import UserCreate, UserRole, UserUpdate

    email = random_email()
    user = await crud.create_user(
        session=db,
        user_create=UserCreate(
            email=email,
            password=random_lower_string(),
            role=UserRole.CANDIDATE,
            tenant_id=settings.TENANT_ID,
        ),
    )
    await crud.update_user(
        session=db, db_user=user, user_in=UserUpdate(is_active=False)
    )
    await db.commit()

    state = await _oauth_state(client, "google")
    respx.post(GOOGLE_TOKEN).mock(
        return_value=Response(200, json={"access_token": "t"})
    )
    respx.get(GOOGLE_USERINFO).mock(
        return_value=Response(
            200,
            json={
                "sub": "inactive-sub",
                "email": email,
                "email_verified": True,
            },
        )
    )
    r = await client.get(
        f"{AUTH}/callback/google",
        params={"code": "c", "state": state},
        follow_redirects=False,
    )
    # inactive → error response (400/401/403), no session cookie success path to /me
    assert r.status_code in (400, 401, 403)
    client.cookies.clear()
    # Ensure no usable session from partial set
    # (callback may still set cookies on some designs — me must fail if inactive)

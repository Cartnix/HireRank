"""TDD: RK auth legal lifecycle — policy version, consent expiry, email check, rate limit."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import ConsentPurpose, User, UserConsent
from tests.utils.consent import valid_consent
from tests.utils.utils import random_email, random_lower_string


@pytest.mark.asyncio
async def test_check_email_reports_registration_status(client: AsyncClient) -> None:
    email = random_email()
    missing = await client.post(
        f"{settings.API_V1_STR}/auth/check-email",
        json={"email": email},
    )
    assert missing.status_code == 200
    assert missing.json() == {"registered": False}

    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": random_lower_string(),
            "role": "candidate",
            "consent": valid_consent(),
        },
    )
    found = await client.post(
        f"{settings.API_V1_STR}/auth/check-email",
        json={"email": email},
    )
    assert found.status_code == 200
    assert found.json() == {"registered": True}


@pytest.mark.asyncio
async def test_register_sets_legal_version_and_consent_expiry(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    r = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": random_lower_string(),
            "role": "candidate",
            "consent": valid_consent(talent_pool=True),
        },
    )
    assert r.status_code in (200, 201)

    user = (await db.exec(select(User).where(User.email == email))).one()
    assert user.legal_policy_version == settings.LEGAL_POLICY_VERSION
    assert user.legal_accepted_at is not None

    consents = (
        await db.exec(select(UserConsent).where(UserConsent.user_id == user.id))
    ).all()
    by_purpose = {c.purpose: c for c in consents}
    ap = by_purpose[ConsentPurpose.ACCOUNT_PROCESSING.value]
    assert ap.expires_at is not None
    expires = ap.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    assert expires > datetime.now(UTC)
    tp = by_purpose[ConsentPurpose.TALENT_POOL.value]
    assert tp.expires_at is not None


@pytest.mark.asyncio
async def test_me_requires_legal_acceptance_when_version_stale(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    password = random_lower_string()
    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "candidate",
            "consent": valid_consent(),
        },
    )
    user = (await db.exec(select(User).where(User.email == email))).one()
    user.legal_policy_version = "1999-01-01"
    db.add(user)
    await db.commit()

    me = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert me.status_code == 200
    body = me.json()
    assert body["legal_acceptance_required"] is True
    assert body["current_legal_policy_version"] == settings.LEGAL_POLICY_VERSION


@pytest.mark.asyncio
async def test_accept_legal_updates_version_and_refreshes_consent(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    password = random_lower_string()
    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "candidate",
            "consent": valid_consent(),
        },
    )
    user = (await db.exec(select(User).where(User.email == email))).one()
    user.legal_policy_version = "1999-01-01"
    db.add(user)
    ap = (
        await db.exec(
            select(UserConsent).where(
                UserConsent.user_id == user.id,
                UserConsent.purpose == ConsentPurpose.ACCOUNT_PROCESSING.value,
            )
        )
    ).one()
    ap.expires_at = datetime.now(UTC) - timedelta(days=1)
    db.add(ap)
    await db.commit()

    me = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert me.json()["legal_acceptance_required"] is True
    assert me.json()["consent_refresh_required"] is True

    accept = await client.post(
        f"{settings.API_V1_STR}/auth/accept-legal",
        headers={
            "X-CSRF-Token": client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME) or ""
        },
        json={"consent": valid_consent()},
    )
    assert accept.status_code == 200
    assert accept.json()["legal_acceptance_required"] is False
    assert accept.json()["consent_refresh_required"] is False

    await db.refresh(user)
    assert user.legal_policy_version == settings.LEGAL_POLICY_VERSION


@pytest.mark.asyncio
async def test_login_rate_limit_returns_429(client: AsyncClient) -> None:
    email = random_email()
    # Exhaust window with bad credentials
    limit = settings.LOGIN_RATE_LIMIT_ATTEMPTS
    for _ in range(limit):
        await client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "password": "wrong-password-xx"},
        )
    blocked = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": "wrong-password-xx"},
    )
    assert blocked.status_code == 429


@pytest.mark.asyncio
async def test_oauth_authorize_scopes_are_minimized(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.auth import oauth as oauth_mod
    from app.core.config import settings as s

    monkeypatch.setattr(s, "GOOGLE_CLIENT_ID", "test-google-client")
    monkeypatch.setattr(s, "GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setattr(s, "GOOGLE_REDIRECT_URI", "http://localhost/callback")
    url = oauth_mod.build_authorize_url("google", "state-test")
    assert "openid" in url and "email" in url
    assert "profile" not in url.split("scope=")[-1].split("&")[0]

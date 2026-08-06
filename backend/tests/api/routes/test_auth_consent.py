"""TDD: RK §1.4 granular consent, §1.5 IIN reject, GDPR Art.17 forget-me (auth module)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import User, UserConsent
from tests.utils.consent import register_json, valid_consent
from tests.utils.utils import random_email, random_lower_string

AUTH = f"{settings.API_V1_STR}/auth"


@pytest.mark.asyncio
async def test_register_requires_account_processing_consent(
    client: AsyncClient,
) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=random_email(),
            password=random_lower_string(),
            consent=valid_consent(account_processing=False),
        ),
    )
    assert r.status_code in (400, 422)
    assert "account_processing" in str(r.json()).lower()


@pytest.mark.asyncio
async def test_register_rejects_missing_consent_object(client: AsyncClient) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
        },
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_register_persists_separated_consents(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=email,
            password=random_lower_string(),
            consent=valid_consent(talent_pool=True),
        ),
    )
    assert r.status_code == 201
    user = (await db.exec(select(User).where(User.email == email))).first()
    assert user is not None
    rows = (
        await db.exec(select(UserConsent).where(UserConsent.user_id == user.id))
    ).all()
    by_purpose = {row.purpose: row for row in rows}
    assert by_purpose["account_processing"].granted is True
    assert by_purpose["talent_pool"].granted is True
    assert by_purpose["cross_border"].granted is False


@pytest.mark.asyncio
async def test_register_cross_border_requires_countries(client: AsyncClient) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=random_email(),
            password=random_lower_string(),
            consent=valid_consent(cross_border=True, cross_border_countries=[]),
        ),
    )
    assert r.status_code in (400, 422)
    assert "cross_border" in str(r.json()).lower()


@pytest.mark.asyncio
async def test_register_rejects_iin_and_forbidden_pd_fields(
    client: AsyncClient,
) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=random_email(),
            password=random_lower_string(),
            iin="123456789012",
        ),
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_get_consent_returns_current_grants(client: AsyncClient) -> None:
    email = random_email()
    password = random_lower_string()
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=email,
            password=password,
            consent=valid_consent(talent_pool=True),
        ),
    )
    assert r.status_code == 201
    r = await client.get(f"{AUTH}/consent")
    assert r.status_code == 200
    body = r.json()
    assert body["account_processing"] is True
    assert body["talent_pool"] is True
    assert body["cross_border"] is False


@pytest.mark.asyncio
async def test_patch_consent_updates_optional_grants(client: AsyncClient) -> None:
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(email=random_email(), password=random_lower_string()),
    )
    assert r.status_code == 201
    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    r = await client.patch(
        f"{AUTH}/consent",
        headers={"X-CSRF-Token": csrf or ""},
        json=valid_consent(
            talent_pool=True,
            cross_border=True,
            cross_border_countries=["KZ"],
        ),
    )
    assert r.status_code == 200
    assert r.json()["talent_pool"] is True
    assert r.json()["cross_border"] is True
    assert r.json()["cross_border_countries"] == ["KZ"]


@pytest.mark.asyncio
async def test_forget_me_anonymizes_user_revokes_session_and_consents(
    client: AsyncClient, db: AsyncSession
) -> None:
    email = random_email()
    password = random_lower_string()
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(email=email, password=password),
    )
    assert r.status_code == 201
    user_id = (await db.exec(select(User).where(User.email == email))).first()
    assert user_id is not None
    uid = user_id.id

    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    r = await client.post(
        f"{AUTH}/forget-me",
        headers={"X-CSRF-Token": csrf or ""},
    )
    assert r.status_code == 204

    await db.refresh(user_id)
    user = await db.get(User, uid)
    assert user is not None
    assert user.email != email
    assert user.email.startswith("deleted-")
    assert user.is_active is False
    assert user.hashed_password is None
    assert user.first_name is None
    assert user.last_name is None

    consents = (
        await db.exec(select(UserConsent).where(UserConsent.user_id == uid))
    ).all()
    assert consents
    assert all(c.granted is False for c in consents)
    assert all(c.revoked_at is not None for c in consents)

    r = await client.get(f"{AUTH}/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_register_rejects_account_processing_omitted_as_false(
    client: AsyncClient,
) -> None:
    """Omitting account_processing must not default into a successful register."""
    r = await client.post(
        f"{AUTH}/register",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
            "consent": {
                "talent_pool": False,
                "cross_border": False,
                "cross_border_countries": [],
            },
        },
    )
    # Missing required flag → 422 (schema) or 400 (explicit validator)
    assert r.status_code in (400, 422)


@pytest.mark.asyncio
async def test_oauth_start_rejects_missing_consent_body(client: AsyncClient) -> None:
    r = await client.post(
        f"{AUTH}/oauth/google/start",
        json={},
        follow_redirects=False,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_oauth_start_rejects_account_processing_false(
    client: AsyncClient,
) -> None:
    r = await client.post(
        f"{AUTH}/oauth/linkedin/start",
        json={
            "consent": {
                "account_processing": False,
                "talent_pool": True,
                "cross_border": False,
                "cross_border_countries": [],
            }
        },
        follow_redirects=False,
    )
    assert r.status_code in (400, 422)
    assert "account_processing" in str(r.json()).lower()


@pytest.mark.asyncio
async def test_signup_deprecated_also_requires_consent(client: AsyncClient) -> None:
    r = await client.post(
        f"{settings.API_V1_STR}/users/signup",
        json={
            "email": random_email(),
            "password": random_lower_string(),
            "role": "candidate",
            "consent": {
                "account_processing": False,
                "talent_pool": False,
                "cross_border": False,
                "cross_border_countries": [],
            },
        },
    )
    assert r.status_code in (400, 422)

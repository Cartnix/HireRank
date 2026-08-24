"""TDD: PATCH /auth/me for two-stage registration names (issue #51)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.config import settings
from tests.utils.auth_types import register_bearer_pair
from tests.utils.consent import register_json
from tests.utils.utils import random_email, random_lower_string

AUTH = f"{settings.API_V1_STR}/auth"
NAMES = {"first_name": "HR_FIRST_NAME", "last_name": "HR_LAST_NAME"}


@pytest.fixture
def cookie_session(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
    monkeypatch.setattr(settings, "COOKIE_SAMESITE", "lax")
    monkeypatch.setattr(settings, "AUTH_COOKIE_ACCESS_NAME", "access_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_REFRESH_NAME", "refresh_token")
    monkeypatch.setattr(settings, "AUTH_COOKIE_CSRF_NAME", "csrf_token")


async def _register(client: AsyncClient, *, role: str = "hr") -> None:
    r = await client.post(
        f"{AUTH}/register",
        json=register_json(
            email=random_email(), password=random_lower_string(), role=role
        ),
    )
    assert r.status_code == 201


def _assert_user_public_names(body: dict[str, object]) -> None:
    assert body["first_name"] == "HR_FIRST_NAME"
    assert body["last_name"] == "HR_LAST_NAME"
    assert "legal_acceptance_required" in body
    assert "consent_refresh_required" in body
    assert "current_legal_policy_version" in body
    assert "email" in body
    assert "id" in body
    assert "tenant_id" in body


@pytest.mark.asyncio
@pytest.mark.usefixtures("cookie_session")
async def test_patch_me_cookie_csrf_updates_names_and_get_me(
    client: AsyncClient,
) -> None:
    await _register(client)
    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    assert csrf

    r = await client.patch(
        f"{AUTH}/me",
        json=NAMES,
        headers={"X-CSRF-Token": csrf},
    )
    assert r.status_code == 200, r.text
    _assert_user_public_names(r.json())

    me = await client.get(f"{AUTH}/me")
    assert me.status_code == 200
    _assert_user_public_names(me.json())


@pytest.mark.asyncio
async def test_patch_me_bearer_skips_csrf(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="hr")
    r = await client.patch(
        f"{AUTH}/me",
        json=NAMES,
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 200, r.text
    _assert_user_public_names(r.json())


@pytest.mark.asyncio
async def test_patch_me_missing_first_name_422(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="hr")
    r = await client.patch(
        f"{AUTH}/me",
        json={"last_name": "HR_LAST_NAME"},
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_patch_me_missing_last_name_422(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="hr")
    r = await client.patch(
        f"{AUTH}/me",
        json={"first_name": "HR_FIRST_NAME"},
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize("blank", ["", " "])
async def test_patch_me_blank_names_422(client: AsyncClient, blank: str) -> None:
    pair = await register_bearer_pair(client, role="hr")
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    missing_first = await client.patch(
        f"{AUTH}/me",
        json={"first_name": blank, "last_name": "HR_LAST_NAME"},
        headers=headers,
    )
    missing_last = await client.patch(
        f"{AUTH}/me",
        json={"first_name": "HR_FIRST_NAME", "last_name": blank},
        headers=headers,
    )
    assert missing_first.status_code == 422
    assert missing_last.status_code == 422


@pytest.mark.asyncio
async def test_patch_me_extra_field_422(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="hr")
    r = await client.patch(
        f"{AUTH}/me",
        json={**NAMES, "email": "other@example.com"},
        headers={"Authorization": f"Bearer {pair['access_token']}"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_patch_me_unauthenticated_401(client: AsyncClient) -> None:
    client.cookies.clear()
    r = await client.patch(f"{AUTH}/me", json=NAMES)
    assert r.status_code == 401


@pytest.mark.asyncio
@pytest.mark.usefixtures("cookie_session")
async def test_patch_me_cookie_without_csrf_403(client: AsyncClient) -> None:
    await _register(client)
    r = await client.patch(f"{AUTH}/me", json=NAMES)
    assert r.status_code == 403
    assert r.json()["detail"] == "CSRF Token missing or invalid"

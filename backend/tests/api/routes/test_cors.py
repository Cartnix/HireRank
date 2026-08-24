"""CORS preflight must not 400 on loopback SPA origins (login/register)."""

from __future__ import annotations

from httpx import AsyncClient

from app.core.config import (
    LOCAL_CORS_ORIGIN_REGEX,
    loopback_origin_mirrors,
    parse_cors,
    settings,
)

AUTH_LOGIN = f"{settings.API_V1_STR}/auth/login"
AUTH_REGISTER = f"{settings.API_V1_STR}/auth/register"
AUTH_CHECK_EMAIL = f"{settings.API_V1_STR}/auth/check-email"


def test_parse_cors_strips_wrapping_quotes() -> None:
    assert parse_cors('"http://localhost:3000,http://127.0.0.1:3000"') == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def test_loopback_origin_mirrors_localhost_and_ipv4() -> None:
    assert loopback_origin_mirrors("http://localhost:3000") == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    assert "http://localhost:3000" in settings.all_cors_origins
    assert "http://127.0.0.1:3000" in settings.all_cors_origins
    if settings.ENVIRONMENT == "local":
        assert settings.cors_origin_regex == LOCAL_CORS_ORIGIN_REGEX


async def _assert_preflight_ok(client: AsyncClient, origin: str, path: str) -> None:
    r = await client.options(
        path,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("access-control-allow-origin") == origin
    assert r.headers.get("access-control-allow-credentials") == "true"


async def test_preflight_login_allows_next_fallback_port(
    client: AsyncClient,
) -> None:
    await _assert_preflight_ok(client, "http://localhost:3001", AUTH_LOGIN)


async def test_preflight_login_allows_127_0_0_1(client: AsyncClient) -> None:
    await _assert_preflight_ok(client, "http://127.0.0.1:3000", AUTH_LOGIN)


async def test_preflight_register_and_check_email_allow_loopback(
    client: AsyncClient,
) -> None:
    await _assert_preflight_ok(client, "http://localhost:3000", AUTH_REGISTER)
    await _assert_preflight_ok(client, "http://127.0.0.1:3001", AUTH_CHECK_EMAIL)


async def test_login_error_still_includes_cors_headers(client: AsyncClient) -> None:
    origin = "http://localhost:3000"
    r = await client.post(
        AUTH_LOGIN,
        headers={"Origin": origin},
        json={"email": "missing@example.com", "password": "wrong-password"},
    )
    assert r.status_code in {400, 401, 422}
    assert r.headers.get("access-control-allow-origin") == origin


async def test_unknown_origin_preflight_rejected(client: AsyncClient) -> None:
    r = await client.options(
        AUTH_LOGIN,
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code == 400
    assert r.headers.get("access-control-allow-origin") is None

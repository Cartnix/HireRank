"""Behavioral API contract tests for the MVP endpoints."""

from __future__ import annotations

from collections.abc import Callable

import pytest


API_PREFIX = "/api/v1"


def _xfail_if_unimplemented(response, endpoint: str) -> None:
    if response.status_code == 404:
        pytest.xfail(f"{endpoint} is not implemented yet")


@pytest.mark.asyncio
async def test_health_contract(async_client) -> None:
    response = await async_client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["environment"] == "test"


@pytest.mark.asyncio
async def test_auth_register_success_contract(async_client) -> None:
    payload = {
        "email": "ivan@company.test",
        "password": "Str0ngPass!",
        "role": "hr_operator",
        "enterprise_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }

    response = await async_client.post(f"{API_PREFIX}/auth/register", json=payload)

    _xfail_if_unimplemented(response, "/auth/register")
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]


@pytest.mark.asyncio
async def test_auth_register_validation_contract(async_client) -> None:
    response = await async_client.post(
        f"{API_PREFIX}/auth/register",
        json={"email": "not-an-email", "password": "123", "role": "candidate"},
    )

    _xfail_if_unimplemented(response, "/auth/register")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_auth_login_success_contract(async_client) -> None:
    response = await async_client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "ivan@company.test", "password": "Str0ngPass!"},
    )

    _xfail_if_unimplemented(response, "/auth/login")
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]


@pytest.mark.asyncio
async def test_auth_login_invalid_credentials_contract(async_client) -> None:
    response = await async_client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "ivan@company.test", "password": "wrong-password"},
    )

    _xfail_if_unimplemented(response, "/auth/login")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_vacancies_auth_required_contract(async_client) -> None:
    response = await async_client.get(f"{API_PREFIX}/vacancies")

    _xfail_if_unimplemented(response, "/vacancies")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_vacancies_role_forbidden_contract(async_client, supabase_headers) -> None:
    headers, _claims = supabase_headers(role="candidate")
    response = await async_client.post(
        f"{API_PREFIX}/vacancies",
        headers=headers,
        json={"title": "Backend Developer", "status": "open"},
    )

    _xfail_if_unimplemented(response, "/vacancies")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_vacancies_admin_success_contract(async_client, supabase_headers) -> None:
    headers, _claims = supabase_headers(role="administrator")
    response = await async_client.get(f"{API_PREFIX}/vacancies", headers=headers)

    _xfail_if_unimplemented(response, "/vacancies")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "pagination" in body


@pytest.mark.asyncio
async def test_vacancies_tenant_isolation_contract(async_client, supabase_headers) -> None:
    enterprise_a = "11111111-1111-1111-1111-111111111111"
    enterprise_b = "22222222-2222-2222-2222-222222222222"

    headers_a, claims_a = supabase_headers(role="administrator", enterprise_id=enterprise_a)
    headers_b, claims_b = supabase_headers(role="administrator", enterprise_id=enterprise_b)

    response_a = await async_client.get(f"{API_PREFIX}/vacancies", headers=headers_a)
    response_b = await async_client.get(f"{API_PREFIX}/vacancies", headers=headers_b)

    _xfail_if_unimplemented(response_a, "/vacancies")
    _xfail_if_unimplemented(response_b, "/vacancies")

    assert response_a.status_code == 200
    assert response_b.status_code == 200

    vacancies_a = response_a.json()["items"]
    vacancies_b = response_b.json()["items"]

    assert all(item["enterprise_id"] == claims_a["app_metadata"]["enterprise_id"] for item in vacancies_a)
    assert all(item["enterprise_id"] == claims_b["app_metadata"]["enterprise_id"] for item in vacancies_b)
    assert {item["enterprise_id"] for item in vacancies_a}.isdisjoint(
        {item["enterprise_id"] for item in vacancies_b},
    )


@pytest.mark.asyncio
async def test_candidates_auth_required_contract(async_client) -> None:
    response = await async_client.get(f"{API_PREFIX}/candidates")

    _xfail_if_unimplemented(response, "/candidates")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_candidates_role_forbidden_contract(async_client, supabase_headers) -> None:
    headers, _claims = supabase_headers(role="candidate")
    response = await async_client.get(f"{API_PREFIX}/candidates", headers=headers)

    _xfail_if_unimplemented(response, "/candidates")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_candidates_hr_success_contract(async_client, supabase_headers) -> None:
    headers, _claims = supabase_headers(role="hr_operator")
    response = await async_client.get(f"{API_PREFIX}/candidates", headers=headers)

    _xfail_if_unimplemented(response, "/candidates")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "pagination" in body


@pytest.mark.asyncio
async def test_candidates_tenant_isolation_contract(async_client, supabase_headers) -> None:
    enterprise_a = "11111111-1111-1111-1111-111111111111"
    enterprise_b = "22222222-2222-2222-2222-222222222222"

    headers_a, claims_a = supabase_headers(role="hr_operator", enterprise_id=enterprise_a)
    headers_b, claims_b = supabase_headers(role="hr_operator", enterprise_id=enterprise_b)

    response_a = await async_client.get(f"{API_PREFIX}/candidates", headers=headers_a)
    response_b = await async_client.get(f"{API_PREFIX}/candidates", headers=headers_b)

    _xfail_if_unimplemented(response_a, "/candidates")
    _xfail_if_unimplemented(response_b, "/candidates")

    assert response_a.status_code == 200
    assert response_b.status_code == 200

    candidates_a = response_a.json()["items"]
    candidates_b = response_b.json()["items"]

    assert all(item["enterprise_id"] == claims_a["app_metadata"]["enterprise_id"] for item in candidates_a)
    assert all(item["enterprise_id"] == claims_b["app_metadata"]["enterprise_id"] for item in candidates_b)
    assert {item["enterprise_id"] for item in candidates_a}.isdisjoint(
        {item["enterprise_id"] for item in candidates_b},
    )
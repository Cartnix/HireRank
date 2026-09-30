"""Run against temporary primary AND dev databases via verify_developer_tools."""

import pytest
from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import Candidate, Interview, User, Vacancy
from tests.utils.auth_types import register_bearer_pair


@pytest.mark.parametrize(
    "role", ["administrator", "hr", "manager", "recruiter", "candidate"]
)
async def test_tools_are_owner_only(client: AsyncClient, role: str) -> None:
    tokens = await register_bearer_pair(client, role=role)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    for path, method, body in [
        ("access", "GET", None),
        ("generate", "POST", {}),
        ("import", "POST", {"confirmation": "IMPORT TO REAL DATABASE"}),
        (
            "dataset",
            "PUT",
            {
                "revision": 0,
                "users": [],
                "candidates": [],
                "vacancies": [],
                "prompts": [],
            },
        ),
    ]:
        response = await client.request(
            method,
            f"{settings.API_V1_STR}/developer/{path}",
            headers=headers,
            json=body,
        )
        assert response.status_code == 403, response.text
    response = await client.get(
        f"{settings.API_V1_STR}/dashboard/analytics",
        headers={**headers, "X-Preview-Role": "superuser"},
    )
    assert response.status_code == 403


async def test_live_role_preview_enforces_matrix(
    client: AsyncClient, superuser_token_headers: dict
) -> None:
    headers = {**superuser_token_headers, "X-Preview-Role": "recruiter"}
    response = await client.get(f"{settings.API_V1_STR}/candidates/", headers=headers)
    assert response.status_code == 403
    response = await client.post(
        f"{settings.API_V1_STR}/vacancies/",
        headers=headers,
        json={"title": "Unauthorized test", "description": "Must not be created"},
    )
    assert response.status_code == 403
    response = await client.get(f"{settings.API_V1_STR}/vacancies/", headers=headers)
    assert response.status_code == 200


async def test_generate_persist_and_import(
    client: AsyncClient, db: AsyncSession, superuser_token_headers: dict
) -> None:
    base = f"{settings.API_V1_STR}/developer"
    # A valid explicit confirmation is required even with owner credentials.
    response = await client.post(
        f"{base}/import", headers=superuser_token_headers, json={"confirmation": ""}
    )
    assert response.status_code == 400
    assert not (await db.exec(select(Candidate))).all()
    response = await client.post(
        f"{base}/generate",
        headers=superuser_token_headers,
        json={"candidates": 20, "vacancies": 20, "clear_existing": True},
    )
    assert response.status_code == 200, response.text
    dataset = (
        await client.get(f"{base}/dataset", headers=superuser_token_headers)
    ).json()
    assert len(dataset["candidates"]) == len(dataset["vacancies"]) == 20
    assert not (await db.exec(select(Vacancy))).all()
    own = await client.get(
        f"{base}/analytics?role=candidate", headers=superuser_token_headers
    )
    assert own.json()["total_candidates"] == 1
    dataset["vacancies"][0]["title"] = "Edited in dev PostgreSQL"
    dataset["memory"] = [{"id": "test-memory", "tenantId": dataset["tenants"][0]["id"], "candidateId": dataset["candidates"][0]["id"], "evaluationId": "test-evaluation", "markdown": "# Только тестовая память", "createdAt": "2026-09-30T00:00:00Z"}]
    response = await client.put(
        f"{base}/dataset", headers=superuser_token_headers, json=dataset
    )
    assert response.status_code == 204, response.text
    stale = await client.put(
        f"{base}/dataset", headers=superuser_token_headers, json=dataset
    )
    assert stale.status_code == 409
    reloaded = (
        await client.get(f"{base}/dataset", headers=superuser_token_headers)
    ).json()
    assert reloaded["memory"] == dataset["memory"]
    assert any(v["title"] == "Edited in dev PostgreSQL" for v in reloaded["vacancies"])
    owner = (await db.exec(select(User))).first()
    existing = Vacancy(
        tenant_id=owner.tenant_id, title="Existing real vacancy", created_by=owner.id
    )
    db.add(existing)
    await db.commit()
    response = await client.post(
        f"{base}/import",
        headers=superuser_token_headers,
        json={"confirmation": "IMPORT TO REAL DATABASE"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["candidate"] == response.json()["vacancy"] == 20
    candidates = (await db.exec(select(Candidate))).all()
    vacancies = (await db.exec(select(Vacancy))).all()
    interviews = (await db.exec(select(Interview))).all()
    assert len(candidates) == len(interviews) == 20
    assert len(vacancies) == 21
    assert any(
        v.id == existing.id and v.title == "Existing real vacancy" for v in vacancies
    )
    assert all(
        c.user_id is None
        and c.tenant_id == settings.TENANT_ID
        and c.questionnaire["synthetic"]
        for c in candidates
    )
    assert all(v.title.startswith("[TEST ") for v in vacancies if v.id != existing.id)
    # No dev auth users copied to the primary database.
    assert len((await db.exec(select(User))).all()) == 1


async def test_mutating_dev_tools_are_disabled_in_production(
    client: AsyncClient, superuser_token_headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    for path, body in [
        ("generate", {}),
        ("import", {"confirmation": "IMPORT TO REAL DATABASE"}),
    ]:
        response = await client.post(
            f"{settings.API_V1_STR}/developer/{path}",
            headers=superuser_token_headers,
            json=body,
        )
        assert response.status_code == 404

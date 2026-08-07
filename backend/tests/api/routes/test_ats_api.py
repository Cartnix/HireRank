"""TDD: ATS HTTP CRUD dual-role attacks + UC happy paths (issue #30)."""

from __future__ import annotations

import uuid

from httpx import AsyncClient

from app.ats import events as ats_events
from app.core.config import settings
from tests.conftest import bypass_rls_session
from tests.db.ats_fixtures import FOREIGN_TENANT_ID, seed_ats_graph
from tests.utils.auth_types import register_bearer_pair
from tests.utils.utils import random_email

API = settings.API_V1_STR
VACANCIES = f"{API}/vacancies"
CANDIDATES = f"{API}/candidates"
DASHBOARD = f"{API}/dashboard"


async def _headers_for_role(client: AsyncClient, role: str) -> dict[str, str]:
    pair = await register_bearer_pair(client, role=role)
    return {"Authorization": f"Bearer {pair['access_token']}"}


async def test_admin_creates_vacancy_with_default_stages(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={"title": "Backend Engineer", "status": "open"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["title"] == "Backend Engineer"
    assert len(body["stages"]) == 4
    assert [s["stage_name"] for s in body["stages"]] == [
        "Applied",
        "Screen",
        "Interview",
        "Offer",
    ]


async def test_hr_cannot_create_vacancy(client: AsyncClient) -> None:
    headers = await _headers_for_role(client, "hr")
    r = await client.post(
        f"{VACANCIES}/",
        headers=headers,
        json={"title": "Should Fail", "status": "draft"},
    )
    assert r.status_code == 403


async def test_vacancy_idor_returns_404_for_missing_id(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    """Core tenant: unknown UUID → 404 (RLS-equivalent hide)."""
    r = await client.get(
        f"{VACANCIES}/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


async def test_vacancy_foreign_row_hidden_via_rls_seed(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    async with bypass_rls_session() as seed:
        foreign = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)
    r = await client.get(
        f"{VACANCIES}/{foreign['vacancy']}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


async def test_hr_candidate_intake_publishes_resume_uploaded(
    client: AsyncClient,
) -> None:
    ats_events.clear_published_events()
    headers = await _headers_for_role(client, "hr")
    email = random_email()
    r = await client.post(
        f"{CANDIDATES}/",
        headers=headers,
        json={
            "questionnaire": {
                "surname": "Seitkali",
                "first_name": "Alibek",
                "email": email,
            },
            "email": email,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "unassigned"
    assert body["email"] == email
    events = ats_events.published_events()
    assert len(events) == 1
    assert str(events[0].candidate_id) == body["id"]


async def test_duplicate_candidate_email_within_tenant_conflict(
    client: AsyncClient,
) -> None:
    headers = await _headers_for_role(client, "hr")
    email = random_email()
    payload = {
        "questionnaire": {"surname": "A", "first_name": "B"},
        "email": email,
    }
    assert (
        await client.post(f"{CANDIDATES}/", headers=headers, json=payload)
    ).status_code == 201
    r = await client.post(f"{CANDIDATES}/", headers=headers, json=payload)
    assert r.status_code == 409


async def test_forged_tenant_id_in_body_rejected(client: AsyncClient) -> None:
    headers = await _headers_for_role(client, "hr")
    r = await client.post(
        f"{CANDIDATES}/",
        headers=headers,
        json={
            "questionnaire": {"surname": "X"},
            "tenant_id": str(FOREIGN_TENANT_ID),
        },
    )
    assert r.status_code == 422


async def test_uc_flow_assign_and_manager_list(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    # Admin vacancy
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Platform", "status": "open"},
        )
    ).json()
    # HR candidate
    hr = await _headers_for_role(client, "hr")
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={
                "questionnaire": {"surname": "Pool", "first_name": "Cand"},
                "email": random_email(),
            },
        )
    ).json()
    # Manager cannot assign
    mgr = await _headers_for_role(client, "manager")
    forbidden = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=mgr,
        json={"vacancy_id": vac["id"]},
    )
    assert forbidden.status_code == 403
    # Admin assign
    assigned = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    assert assigned.status_code == 200, assigned.text
    body = assigned.json()
    assert body["status"] == "assigned"
    assert body["assigned_vacancy_id"] == vac["id"]
    # Manager sees assigned candidates
    listed = await client.get(f"{CANDIDATES}/", headers=mgr)
    assert listed.status_code == 200
    ids = {item["id"] for item in listed.json()["items"]}
    assert cand["id"] in ids
    # Dashboard
    dash = await client.get(DASHBOARD, headers=mgr)
    assert dash.status_code == 200
    assert dash.json()["role"] == "manager"
    assert dash.json()["assigned_candidates"] >= 1


async def test_resume_url_requires_visible_candidate(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    hr = await _headers_for_role(client, "hr")
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "R"}, "email": random_email()},
        )
    ).json()
    ok = await client.get(
        f"{CANDIDATES}/{cand['id']}/resume-url",
        headers=superuser_token_headers,
    )
    assert ok.status_code == 200
    assert "presign.local" in ok.json()["url"]

    async with bypass_rls_session() as seed:
        foreign = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)
    missing = await client.get(
        f"{CANDIDATES}/{foreign['candidate']}/resume-url",
        headers=superuser_token_headers,
    )
    assert missing.status_code == 404


async def test_delete_vacancy_with_active_application_conflicts(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Busy", "status": "open"},
        )
    ).json()
    hr = await _headers_for_role(client, "hr")
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {}, "email": random_email()},
        )
    ).json()
    await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    r = await client.delete(f"{VACANCIES}/{vac['id']}", headers=superuser_token_headers)
    assert r.status_code == 409


async def test_hr_cannot_patch_or_delete_vacancy(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "HR Locked", "status": "open"},
        )
    ).json()
    hr = await _headers_for_role(client, "hr")
    assert (
        await client.patch(
            f"{VACANCIES}/{vac['id']}",
            headers=hr,
            json={"title": "Nope"},
        )
    ).status_code == 403
    assert (
        await client.delete(f"{VACANCIES}/{vac['id']}", headers=hr)
    ).status_code == 403


async def test_forged_tenant_id_on_vacancy_rejected(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={
            "title": "Forged",
            "status": "draft",
            "tenant_id": str(FOREIGN_TENANT_ID),
        },
    )
    assert r.status_code == 422


async def test_candidate_foreign_row_hidden_via_rls_seed(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    async with bypass_rls_session() as seed:
        foreign = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)
    r = await client.get(
        f"{CANDIDATES}/{foreign['candidate']}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


async def test_list_page_size_cap(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    assert (
        await client.get(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            params={"page_size": 101},
        )
    ).status_code == 422
    assert (
        await client.get(
            f"{CANDIDATES}/",
            headers=superuser_token_headers,
            params={"page_size": 101},
        )
    ).status_code == 422


async def test_assign_missing_vacancy_returns_404(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    hr = await _headers_for_role(client, "hr")
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {}, "email": random_email()},
        )
    ).json()
    r = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": str(uuid.uuid4())},
    )
    assert r.status_code == 404


async def test_questionnaire_email_conflict_on_update(client: AsyncClient) -> None:
    hr = await _headers_for_role(client, "hr")
    email_a = random_email()
    email_b = random_email()
    first = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "A"}, "email": email_a},
        )
    ).json()
    second = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "B"}, "email": email_b},
        )
    ).json()
    r = await client.put(
        f"{CANDIDATES}/{second['id']}/questionnaire",
        headers=hr,
        json={"questionnaire": {"surname": "B", "email": email_a}},
    )
    assert r.status_code == 409
    # Own email unchanged is fine
    ok = await client.put(
        f"{CANDIDATES}/{first['id']}/questionnaire",
        headers=hr,
        json={"questionnaire": {"surname": "A2", "email": email_a}},
    )
    assert ok.status_code == 200


async def test_validate_stage_for_vacancy_rejects_foreign_stage(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    """Stage Hijack defense: stage must belong to target vacancy (API helper)."""
    import pytest
    from fastapi import HTTPException

    from app.ats.vacancies import validate_stage_for_vacancy

    vac_a = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "A", "status": "open"},
        )
    ).json()
    vac_b = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "B", "status": "open"},
        )
    ).json()
    stage_b_id = uuid.UUID(vac_b["stages"][0]["id"])
    async with bypass_rls_session() as session:
        with pytest.raises(HTTPException) as ei:
            await validate_stage_for_vacancy(
                session=session,
                vacancy_id=uuid.UUID(vac_a["id"]),
                stage_id=stage_b_id,
            )
    assert ei.value.status_code == 400

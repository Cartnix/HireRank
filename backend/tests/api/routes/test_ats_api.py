"""TDD: ATS HTTP CRUD dual-role attacks + UC happy paths (issue #30)."""

from __future__ import annotations

import asyncio
import uuid

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError
from sqlmodel import select

from app.ats import events as ats_events
from app.ats.candidates import apply_to_vacancy
from app.core.config import settings
from app.models import Application, Candidate, Notification, User
from app.schemas.ats import ApplyToVacancyRequest
from tests.conftest import bypass_rls_session, session_context
from tests.db.ats_fixtures import FOREIGN_TENANT_ID, seed_ats_graph
from tests.utils.auth_types import register_bearer_pair
from tests.utils.consent import register_json
from tests.utils.utils import random_email

API = settings.API_V1_STR
VACANCIES = f"{API}/vacancies"
CANDIDATES = f"{API}/candidates"
DASHBOARD = f"{API}/dashboard"


async def _headers_for_role(client: AsyncClient, role: str) -> dict[str, str]:
    pair = await register_bearer_pair(client, role=role)
    return {"Authorization": f"Bearer {pair['access_token']}"}


@pytest.mark.asyncio
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


@pytest.mark.asyncio
async def test_hr_can_create_vacancy(client: AsyncClient) -> None:
    headers = await _headers_for_role(client, "hr")
    r = await client.post(
        f"{VACANCIES}/",
        headers=headers,
        json={"title": "HR Sourced Role", "status": "draft"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["title"] == "HR Sourced Role"
    assert body["status"] == "draft"


@pytest.mark.asyncio
async def test_hr_bearer_creates_vacancy_despite_session_cookies(
    client: AsyncClient,
) -> None:
    """Swagger on the API origin sends access cookie + Bearer and no CSRF header."""
    email = random_email()
    password = "SwaggerVacancy228!"
    reg = await client.post(
        f"{API}/auth/register",
        json=register_json(email=email, password=password, role="hr"),
    )
    assert reg.status_code == 201, reg.text
    access = client.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    assert access
    r = await client.post(
        f"{VACANCIES}/",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "title": "Vanacy1",
            "status": "draft",
            "department": "TOU",
            "description": "description",
            "requirements": ["req example"],
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["title"] == "Vanacy1"


@pytest.mark.asyncio
async def test_vacancy_idor_returns_404_for_missing_id(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    """Core tenant: unknown UUID → 404 (RLS-equivalent hide)."""
    r = await client.get(
        f"{VACANCIES}/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
async def test_candidate_can_apply_to_open_vacancy_and_duplicate_is_conflict(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vacancy = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Candidate Apply", "status": "open"},
        )
    ).json()
    candidate_pair = await register_bearer_pair(client, role="candidate")
    candidate_headers = {
        "Authorization": f"Bearer {candidate_pair['access_token']}"
    }

    applied = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications",
        headers=candidate_headers,
        json={},
    )

    assert applied.status_code == 201, applied.text
    application = applied.json()
    assert application["vacancy_id"] == vacancy["id"]
    assert application["status"] == "active"

    duplicate = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications",
        headers=candidate_headers,
        json={},
    )
    assert duplicate.status_code == 409


@pytest.mark.asyncio
async def test_cookie_candidate_application_requires_and_accepts_csrf(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vacancy = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Cookie Apply", "status": "open"},
        )
    ).json()
    candidate = await client.post(
        f"{API}/auth/register",
        json=register_json(
            email=random_email(), password="CookieApply228!", role="candidate"
        ),
    )
    assert candidate.status_code == 201, candidate.text

    missing = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications", json={}
    )
    assert missing.status_code == 403

    csrf = client.cookies.get(settings.AUTH_COOKIE_CSRF_NAME)
    assert csrf
    applied = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications",
        headers={"X-CSRF-Token": csrf},
        json={},
    )
    assert applied.status_code == 201, applied.text


@pytest.mark.asyncio
async def test_concurrent_candidate_applications_create_one_application(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vacancy = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Concurrent Apply", "status": "open"},
        )
    ).json()
    email = random_email()
    await register_bearer_pair(
        client, role="candidate", email=email, password="Concurrent228!"
    )
    async with session_context(bypass_rls=True) as seed:
        user = (await seed.exec(select(User).where(User.email == email))).one()
        candidate = (
            await seed.exec(select(Candidate).where(Candidate.user_id == user.id))
        ).one()

    async def submit() -> int:
        async with session_context(bypass_rls=True) as session:
            fresh_user = await session.get(User, user.id)
            assert fresh_user is not None
            try:
                await apply_to_vacancy(
                    session=session,
                    user=fresh_user,
                    vacancy_id=uuid.UUID(vacancy["id"]),
                )
            except HTTPException as exc:
                return exc.status_code
            return 201

    results = await asyncio.gather(submit(), submit())
    assert sorted(results) == [201, 409]
    async with session_context(bypass_rls=True) as session:
        applications = (
            await session.exec(
                select(Application).where(
                    Application.vacancy_id == uuid.UUID(vacancy["id"]),
                    Application.candidate_id == candidate.id,
                )
            )
        ).all()
    assert len(applications) == 1


@pytest.mark.asyncio
async def test_application_creates_persisted_notification(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vacancy_response = await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={"title": "Notify Apply", "status": "open"},
    )
    vacancy = vacancy_response.json()
    candidate_pair = await register_bearer_pair(client, role="candidate")
    applied = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications",
        headers={"Authorization": f"Bearer {candidate_pair['access_token']}"},
        json={},
    )
    assert applied.status_code == 201, applied.text

    async with bypass_rls_session() as session:
        notification = (
            await session.exec(
                select(Notification).where(
                    Notification.entity_id == uuid.UUID(applied.json()["id"])
                )
            )
        ).one()
    assert notification.recipient_user_id == uuid.UUID(vacancy["created_by"])
    assert notification.kind == "application.created"


def test_application_request_rejects_candidate_id_and_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        ApplyToVacancyRequest(candidate_id=uuid.uuid4())
    with pytest.raises(ValidationError):
        ApplyToVacancyRequest(extra_field="unexpected")


@pytest.mark.asyncio
async def test_candidate_cannot_apply_to_closed_vacancy(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vacancy = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Closed Role", "status": "closed"},
        )
    ).json()
    candidate_pair = await register_bearer_pair(client, role="candidate")
    candidate_headers = {
        "Authorization": f"Bearer {candidate_pair['access_token']}"
    }

    response = await client.post(
        f"{VACANCIES}/{vacancy['id']}/applications",
        headers=candidate_headers,
        json={},
    )

    assert response.status_code == 409


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
async def test_hr_can_patch_and_delete_vacancy(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "HR Editable", "status": "open"},
        )
    ).json()
    hr = await _headers_for_role(client, "hr")
    patched = await client.patch(
        f"{VACANCIES}/{vac['id']}",
        headers=hr,
        json={"title": "HR Updated"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["title"] == "HR Updated"
    deleted = await client.delete(f"{VACANCIES}/{vac['id']}", headers=hr)
    assert deleted.status_code == 204, deleted.text


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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


@pytest.mark.asyncio
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

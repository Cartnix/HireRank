"""TDD: ATS dashboard isolation + integrity attacks + list/CRUD coverage.

Vectors (2026 ATS matrix):
1. Isolation — foreign-tenant rows must not inflate aggregates / leak via IDs.
2. Integrity — cross-tenant vacancy assign / stage poison blocked (404/400/409).
3. Role shapes — admin/hr/candidate dashboards return only their schema fields.
"""

from __future__ import annotations

import uuid

from httpx import AsyncClient
from sqlalchemy import text

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
ME = f"{API}/auth/me"


async def _headers_for_role(client: AsyncClient, role: str) -> dict[str, str]:
    pair = await register_bearer_pair(client, role=role)
    return {"Authorization": f"Bearer {pair['access_token']}"}


async def _user_id(client: AsyncClient, headers: dict[str, str]) -> uuid.UUID:
    r = await client.get(ME, headers=headers)
    assert r.status_code == 200, r.text
    return uuid.UUID(r.json()["id"])


async def test_dashboard_role_shapes_admin_hr_candidate(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    """Each role gets its schema; candidate branch resolves own assigned vacancy."""
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={
                "title": "Staff Engineer Dashboard",
                "status": "open",
                "department": "Platform",
            },
        )
    ).json()

    hr = await _headers_for_role(client, "hr")
    email = random_email()
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={
                "questionnaire": {
                    "surname": "Alpha",
                    "first_name": "Alice",
                    "email": email,
                },
                "email": email,
            },
        )
    ).json()
    assigned = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    assert assigned.status_code == 200, assigned.text

    admin_dash = await client.get(DASHBOARD, headers=superuser_token_headers)
    assert admin_dash.status_code == 200, admin_dash.text
    admin_body = admin_dash.json()
    assert admin_body["role"] == "administrator"
    assert admin_body["total_vacancies"] >= 1
    assert admin_body["open_vacancies"] >= 1
    assert admin_body["total_candidates"] >= 1
    assert "total_users" in admin_body
    assert "assigned_candidates" not in admin_body

    hr_dash = await client.get(DASHBOARD, headers=hr)
    assert hr_dash.status_code == 200, hr_dash.text
    hr_body = hr_dash.json()
    assert hr_body["role"] == "hr"
    assert hr_body["open_vacancies"] >= 1
    assert hr_body["total_candidates"] >= 1
    assert "total_users" not in hr_body

    cand_pair = await register_bearer_pair(client, role="candidate")
    cand_headers = {"Authorization": f"Bearer {cand_pair['access_token']}"}
    cand_user_id = await _user_id(client, cand_headers)
    async with bypass_rls_session() as seed:
        await seed.execute(
            text("UPDATE candidate SET user_id = :uid WHERE id = :cid"),
            {"uid": cand_user_id, "cid": uuid.UUID(cand["id"])},
        )
        await seed.commit()

    cand_dash = await client.get(DASHBOARD, headers=cand_headers)
    assert cand_dash.status_code == 200, cand_dash.text
    cand_body = cand_dash.json()
    assert cand_body["role"] == "candidate"
    assert cand_body["questionnaire_filled"] is True
    assert cand_body["status"] == "assigned"
    assert cand_body["assigned_vacancy"] == {
        "id": vac["id"],
        "title": "Staff Engineer Dashboard",
    }
    assert "total_candidates" not in cand_body


async def test_dashboard_foreign_tenant_counts_excluded(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    """Isolation attack: Omega graph must not inflate Alpha admin aggregates."""
    before = (await client.get(DASHBOARD, headers=superuser_token_headers)).json()
    assert before["role"] == "administrator"

    async with bypass_rls_session() as seed:
        await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)

    after_seed = (await client.get(DASHBOARD, headers=superuser_token_headers)).json()
    assert after_seed["total_vacancies"] == before["total_vacancies"]
    assert after_seed["total_candidates"] == before["total_candidates"]
    assert after_seed["open_vacancies"] == before["open_vacancies"]

    created = await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={"title": "Core Only Vacancy", "status": "open"},
    )
    assert created.status_code == 201, created.text

    after_core = (await client.get(DASHBOARD, headers=superuser_token_headers)).json()
    assert after_core["total_vacancies"] == before["total_vacancies"] + 1
    assert after_core["open_vacancies"] == before["open_vacancies"] + 1


async def test_assign_foreign_vacancy_metric_poisoning_blocked(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    """Integrity attack: link core candidate to foreign vacancy → 404 (RLS hide)."""
    async with bypass_rls_session() as seed:
        foreign = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)

    hr = await _headers_for_role(client, "hr")
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "Omega"}, "email": random_email()},
        )
    ).json()

    before = (await client.get(DASHBOARD, headers=superuser_token_headers)).json()
    poisoned = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": str(foreign["vacancy"])},
    )
    assert poisoned.status_code == 404

    after = (await client.get(DASHBOARD, headers=superuser_token_headers)).json()
    assert after["total_candidates"] == before["total_candidates"]
    assert after["open_vacancies"] == before["open_vacancies"]


async def test_list_vacancies_filters_search_pagination(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={
            "title": "Engineering Backend",
            "status": "open",
            "department": "Eng",
        },
    )
    await client.post(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        json={"title": "Sales Rep", "status": "draft", "department": "Sales"},
    )

    open_only = await client.get(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        params={"status": "open"},
    )
    assert open_only.status_code == 200
    open_titles = {item["title"] for item in open_only.json()["items"]}
    assert "Engineering Backend" in open_titles
    assert "Sales Rep" not in open_titles

    searched = await client.get(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        params={"search": "Engineering"},
    )
    assert searched.status_code == 200
    assert any(
        item["title"] == "Engineering Backend" for item in searched.json()["items"]
    )

    paged = await client.get(
        f"{VACANCIES}/",
        headers=superuser_token_headers,
        params={"page": 1, "page_size": 1},
    )
    assert paged.status_code == 200
    body = paged.json()
    assert len(body["items"]) == 1
    assert body["pagination"]["page"] == 1
    assert body["pagination"]["page_size"] == 1
    assert body["pagination"]["total"] >= 2
    assert body["pagination"]["total_pages"] >= 2


async def test_vacancy_update_and_delete_when_empty(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Ephemeral", "status": "draft"},
        )
    ).json()

    patched = await client.patch(
        f"{VACANCIES}/{vac['id']}",
        headers=superuser_token_headers,
        json={"title": "Ephemeral Updated", "status": "open", "department": "Ops"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["title"] == "Ephemeral Updated"
    assert patched.json()["status"] == "open"
    assert patched.json()["department"] == "Ops"

    deleted = await client.delete(
        f"{VACANCIES}/{vac['id']}", headers=superuser_token_headers
    )
    assert deleted.status_code == 204

    missing = await client.get(
        f"{VACANCIES}/{vac['id']}", headers=superuser_token_headers
    )
    assert missing.status_code == 404

    assert (
        await client.patch(
            f"{VACANCIES}/{uuid.uuid4()}",
            headers=superuser_token_headers,
            json={"title": "Ghost"},
        )
    ).status_code == 404
    assert (
        await client.delete(
            f"{VACANCIES}/{uuid.uuid4()}", headers=superuser_token_headers
        )
    ).status_code == 404


async def test_candidate_list_filters_and_role_scope(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Filter Vacancy", "status": "open"},
        )
    ).json()
    hr = await _headers_for_role(client, "hr")
    email_assigned = random_email()
    assigned_cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={
                "questionnaire": {"surname": "Assigned", "email": email_assigned},
                "email": email_assigned,
            },
        )
    ).json()
    unassigned_email = random_email()
    await client.post(
        f"{CANDIDATES}/",
        headers=hr,
        json={
            "questionnaire": {"surname": "Pool"},
            "email": unassigned_email,
        },
    )
    assert (
        await client.post(
            f"{CANDIDATES}/{assigned_cand['id']}/assign",
            headers=superuser_token_headers,
            json={"vacancy_id": vac["id"]},
        )
    ).status_code == 200

    by_vacancy = await client.get(
        f"{CANDIDATES}/",
        headers=hr,
        params={"vacancy_id": vac["id"]},
    )
    assert by_vacancy.status_code == 200
    assert {item["id"] for item in by_vacancy.json()["items"]} == {assigned_cand["id"]}

    by_status = await client.get(
        f"{CANDIDATES}/",
        headers=hr,
        params={"status": "assigned"},
    )
    assert by_status.status_code == 200
    assert assigned_cand["id"] in {item["id"] for item in by_status.json()["items"]}

    by_search = await client.get(
        f"{CANDIDATES}/",
        headers=hr,
        params={"search": email_assigned.split("@")[0]},
    )
    assert by_search.status_code == 200
    assert any(item["id"] == assigned_cand["id"] for item in by_search.json()["items"])

    mgr = await _headers_for_role(client, "manager")
    # Manager cannot view unassigned candidate (scope hide → 404)
    hidden = await client.get(
        f"{CANDIDATES}/{assigned_cand['id']}",
        headers=mgr,
    )
    # assigned is visible to manager
    assert hidden.status_code == 200
    pool = (
        await client.get(
            f"{CANDIDATES}/",
            headers=hr,
            params={"status": "unassigned", "search": "Pool"},
        )
    ).json()["items"]
    assert pool
    unassigned_id = pool[0]["id"]
    assert (
        await client.get(f"{CANDIDATES}/{unassigned_id}", headers=mgr)
    ).status_code == 404

    cand_pair = await register_bearer_pair(client, role="candidate")
    cand_headers = {"Authorization": f"Bearer {cand_pair['access_token']}"}
    cand_user_id = await _user_id(client, cand_headers)
    async with bypass_rls_session() as seed:
        await seed.execute(
            text("UPDATE candidate SET user_id = :uid WHERE id = :cid"),
            {"uid": cand_user_id, "cid": uuid.UUID(assigned_cand["id"])},
        )
        await seed.commit()

    self_list = await client.get(f"{CANDIDATES}/", headers=cand_headers)
    assert self_list.status_code == 200
    assert {item["id"] for item in self_list.json()["items"]} == {assigned_cand["id"]}


async def test_candidate_crud_edges_assign_reactivate_and_questionnaire(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "Edge Vacancy", "status": "open"},
        )
    ).json()
    hr = await _headers_for_role(client, "hr")
    email = random_email()
    cand = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "Edge"}, "email": email},
        )
    ).json()

    q = await client.get(
        f"{CANDIDATES}/{cand['id']}/questionnaire",
        headers=hr,
    )
    assert q.status_code == 200
    assert q.json()["surname"] == "Edge"

    patched = await client.patch(
        f"{CANDIDATES}/{cand['id']}",
        headers=hr,
        json={"questionnaire": {"surname": "Edge2", "email": email}},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["questionnaire"]["surname"] == "Edge2"

    mgr = await _headers_for_role(client, "manager")
    assert (
        await client.patch(
            f"{CANDIDATES}/{cand['id']}",
            headers=mgr,
            json={"questionnaire": {"surname": "Nope"}},
        )
    ).status_code == 403

    first_assign = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    assert first_assign.status_code == 200
    dup = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    assert dup.status_code == 409

    async with bypass_rls_session() as seed:
        await seed.execute(
            text(
                "UPDATE application SET status = 'withdrawn' "
                "WHERE candidate_id = :cid AND vacancy_id = :vid"
            ),
            {"cid": uuid.UUID(cand["id"]), "vid": uuid.UUID(vac["id"])},
        )
        await seed.execute(
            text("UPDATE candidate SET status = 'unassigned' WHERE id = :cid"),
            {"cid": uuid.UUID(cand["id"])},
        )
        await seed.commit()

    reactivated = await client.post(
        f"{CANDIDATES}/{cand['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": vac["id"]},
    )
    assert reactivated.status_code == 200, reactivated.text
    assert reactivated.json()["status"] == "assigned"

    # Vacancy with stages wiped → 400 on assign
    empty_vac = (
        await client.post(
            f"{VACANCIES}/",
            headers=superuser_token_headers,
            json={"title": "No Stages", "status": "open"},
        )
    ).json()
    async with bypass_rls_session() as seed:
        await seed.execute(
            text("DELETE FROM pipeline_stage WHERE vacancy_id = :vid"),
            {"vid": uuid.UUID(empty_vac["id"])},
        )
        await seed.commit()
    other = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {}, "email": random_email()},
        )
    ).json()
    no_stage = await client.post(
        f"{CANDIDATES}/{other['id']}/assign",
        headers=superuser_token_headers,
        json={"vacancy_id": empty_vac["id"]},
    )
    assert no_stage.status_code == 400

    assert (
        await client.post(
            f"{CANDIDATES}/{uuid.uuid4()}/assign",
            headers=superuser_token_headers,
            json={"vacancy_id": vac["id"]},
        )
    ).status_code == 404

    # Candidate self questionnaire publishes resume event
    cand_pair = await register_bearer_pair(client, role="candidate")
    cand_headers = {"Authorization": f"Bearer {cand_pair['access_token']}"}
    cand_user_id = await _user_id(client, cand_headers)
    async with bypass_rls_session() as seed:
        await seed.execute(
            text("UPDATE candidate SET user_id = :uid WHERE id = :cid"),
            {"uid": cand_user_id, "cid": uuid.UUID(cand["id"])},
        )
        await seed.commit()

    ats_events.clear_published_events()
    put = await client.put(
        f"{CANDIDATES}/{cand['id']}/questionnaire",
        headers=cand_headers,
        json={"questionnaire": {"surname": "Self", "email": email}},
    )
    assert put.status_code == 200, put.text
    assert any(
        str(evt.candidate_id) == cand["id"] for evt in ats_events.published_events()
    )

    # Foreign / missing questionnaire + empty resume_url
    async with bypass_rls_session() as seed:
        foreign = await seed_ats_graph(seed, tenant_id=FOREIGN_TENANT_ID)
        await seed.execute(
            text("UPDATE candidate SET resume_url = NULL WHERE id = :cid"),
            {"cid": uuid.UUID(cand["id"])},
        )
        await seed.commit()

    assert (
        await client.get(
            f"{CANDIDATES}/{foreign['candidate']}/questionnaire",
            headers=hr,
        )
    ).status_code == 404
    assert (
        await client.put(
            f"{CANDIDATES}/{uuid.uuid4()}/questionnaire",
            headers=hr,
            json={"questionnaire": {"surname": "Ghost"}},
        )
    ).status_code == 404
    assert (
        await client.get(
            f"{CANDIDATES}/{cand['id']}/resume-url",
            headers=superuser_token_headers,
        )
    ).status_code == 404

    # Delete candidate success path
    doomed = (
        await client.post(
            f"{CANDIDATES}/",
            headers=hr,
            json={"questionnaire": {"surname": "Doomed"}, "email": random_email()},
        )
    ).json()
    assert (
        await client.delete(
            f"{CANDIDATES}/{doomed['id']}",
            headers=superuser_token_headers,
        )
    ).status_code == 204
    assert (
        await client.get(
            f"{CANDIDATES}/{doomed['id']}",
            headers=superuser_token_headers,
        )
    ).status_code == 404
    assert (
        await client.delete(
            f"{CANDIDATES}/{uuid.uuid4()}",
            headers=superuser_token_headers,
        )
    ).status_code == 404

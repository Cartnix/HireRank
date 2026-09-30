"""Regression: live graph aggregates and planning writes cannot leak tenants."""

import uuid

from httpx import AsyncClient
from sqlalchemy import text

from app.core.config import settings
from tests.conftest import bypass_rls_session
from tests.db.ats_fixtures import FOREIGN_TENANT_ID, seed_ats_graph

API = settings.API_V1_STR


async def test_overview_isolation_and_planning_crud(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    async with bypass_rls_session() as session:
        own = await seed_ats_graph(session, tenant_id=settings.TENANT_ID)
        foreign = await seed_ats_graph(session, tenant_id=FOREIGN_TENANT_ID)
    response = await client.get(
        f"{API}/dashboard/analytics", headers=superuser_token_headers
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert str(own["candidate"]) in {c["id"] for c in data["top_candidates"]}
    assert str(foreign["candidate"]) not in {c["id"] for c in data["top_candidates"]}
    assert str(foreign["candidate"]) not in {
        i["candidate_id"] for i in data["upcoming_interviews"]
    }
    me = (await client.get(f"{API}/auth/me", headers=superuser_token_headers)).json()
    body = {
        "application_id": str(own["application"]),
        "interviewer_id": me["id"],
        "scheduled_at": "2027-01-02T10:00:00Z",
        "duration_minutes": 45,
    }
    created = await client.post(
        f"{API}/interviews/", headers=superuser_token_headers, json=body
    )
    assert created.status_code == 201, created.text
    interview_id = created.json()["id"]
    updated = await client.put(
        f"{API}/interviews/{interview_id}",
        headers=superuser_token_headers,
        json={**body, "duration_minutes": 60},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["duration_minutes"] == 60
    bad = await client.post(
        f"{API}/interviews/",
        headers=superuser_token_headers,
        json={**body, "application_id": str(foreign["application"])},
    )
    assert bad.status_code == 404
    score = await client.post(
        f"{API}/interviews/{interview_id}/scorecards",
        headers=superuser_token_headers,
        json={"rating": 5, "notes": "Confirmed"},
    )
    assert score.status_code == 201, score.text
    bad_score = await client.post(
        f"{API}/interviews/{interview_id}/scorecards",
        headers=superuser_token_headers,
        json={"rating": 6},
    )
    assert bad_score.status_code == 422
    deleted = await client.delete(
        f"{API}/interviews/{interview_id}", headers=superuser_token_headers
    )
    assert deleted.status_code == 204, deleted.text
    missing = await client.delete(
        f"{API}/interviews/{uuid.uuid4()}", headers=superuser_token_headers
    )
    assert missing.status_code == 404
    async with bypass_rls_session() as session:
        await session.execute(
            text(
                "UPDATE application SET status='hired', created_at='2026-09-01', updated_at='2026-09-11' WHERE id=:id"
            ),
            {"id": own["application"]},
        )
    data = (
        await client.get(f"{API}/dashboard/analytics", headers=superuser_token_headers)
    ).json()
    assert data["avg_time_to_hire"] == 10.0

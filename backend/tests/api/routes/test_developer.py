"""Real-session checks for the one shared development dataset."""

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.dev.bootstrap import TENANT_ID
from app.models import Tenant
from tests.utils.auth_types import register_bearer_pair


async def test_dataset_is_shared_and_never_in_primary_db(
    client: AsyncClient, db: AsyncSession, superuser_token_headers: dict[str, str]
) -> None:
    assert await db.get(Tenant, TENANT_ID) is None
    response = await client.get(
        f"{settings.API_V1_STR}/developer/dataset", headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store, private"
    dataset = response.json()
    assert len(dataset["users"]) == 6
    assert len(dataset["vacancies"]) == 10
    assert len(dataset["candidates"]) == 10
    assert all(len(v["stages"]) >= 3 for v in dataset["vacancies"])
    assert all(
        "hashed_password" not in u and "password" not in u for u in dataset["users"]
    )
    for role in ["candidate", "hr", "manager", "administrator"]:
        preview = await client.get(
            f"{settings.API_V1_STR}/developer/dataset?role={role}",
            headers=superuser_token_headers,
        )
        assert preview.json() == dataset


@pytest.mark.parametrize(
    "role", ["candidate", "hr", "manager", "recruiter", "administrator"]
)
async def test_registered_roles_cannot_read_development_data(
    client: AsyncClient, role: str
) -> None:
    tokens = await register_bearer_pair(client, role=role)
    response = await client.get(
        f"{settings.API_V1_STR}/developer/dataset",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert response.status_code == 403
    analytics = await client.get(
        f"{settings.API_V1_STR}/developer/analytics",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert analytics.status_code == 403


async def test_dataset_requires_valid_session(client: AsyncClient) -> None:
    client.cookies.clear()
    response = await client.get(f"{settings.API_V1_STR}/developer/dataset")
    assert response.status_code == 401
    response = await client.get(
        f"{settings.API_V1_STR}/developer/dataset",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


async def test_stale_development_schema_is_rejected(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    with patch("app.api.routes.developer.ScriptDirectory.from_config") as scripts:
        scripts.return_value.get_heads.return_value = ["new-migration"]
        response = await client.get(
            f"{settings.API_V1_STR}/developer/dataset", headers=superuser_token_headers
        )
    assert response.status_code == 503


async def test_production_never_exposes_dataset(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    response = await client.get(
        f"{settings.API_V1_STR}/developer/dataset", headers=superuser_token_headers
    )
    assert response.status_code == 404


async def test_development_analytics_restores_overview(
    client: AsyncClient, superuser_token_headers: dict[str, str]
) -> None:
    response = await client.get(
        f"{settings.API_V1_STR}/developer/analytics", headers=superuser_token_headers
    )
    assert response.status_code == 200, response.text
    overview = response.json()
    assert overview["total_candidates"] == 10
    assert overview["active_jobs"] == 9
    assert overview["avg_time_to_hire"] == 18.0
    assert sum(row["count"] for row in overview["sources"]) == 10
    assert len(overview["candidate_trend"]) == 30
    assert sum(point["value"] for point in overview["candidate_trend"]) == 10
    assert sum(stage["count"] for stage in overview["pipeline"]) == 10
    assert {c["name"] for c in overview["top_candidates"]} == {
        "Д-р Елена Варга",
        "Маркус Чен",
        "Аиша Рахман",
        "Йонас Линдберг",
    }
    assert {i["candidate_name"] for i in overview["upcoming_interviews"]} == {
        "Алексей Иванов",
        "Марина Кузнецова",
        "Дмитрий Соболев",
    }
    own = await client.get(
        f"{settings.API_V1_STR}/developer/analytics?role=candidate",
        headers=superuser_token_headers,
    )
    assert own.json()["total_candidates"] == 1
    assert own.json()["top_candidates"] == []
    schedule = await client.get(
        f"{settings.API_V1_STR}/developer/schedule", headers=superuser_token_headers
    )
    assert schedule.status_code == 200
    assert len(schedule.json()) == 3

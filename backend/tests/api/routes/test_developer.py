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
    assert len(dataset["vacancies"]) == 3
    assert len(dataset["candidates"]) == 2
    assert all(len(v["stages"]) == 3 for v in dataset["vacancies"])
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

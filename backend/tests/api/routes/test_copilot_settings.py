import pytest
from httpx import AsyncClient

from app.core.config import settings
from tests.utils.auth_types import register_bearer_pair


@pytest.mark.parametrize("role", ["candidate", "recruiter", "manager"])
async def test_copilot_settings_reject_non_hr(client: AsyncClient, role: str) -> None:
    pair = await register_bearer_pair(client, role=role)
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    for method in ("GET", "PUT"):
        response = await client.request(
            method,
            f"{settings.API_V1_STR}/copilot/settings",
            headers=headers,
            **({"json": {}} if method == "PUT" else {}),
        )
        assert response.status_code == 403


async def test_hr_settings_persist_and_reject_stale_writes(client: AsyncClient) -> None:
    pair = await register_bearer_pair(client, role="hr")
    headers = {"Authorization": f"Bearer {pair['access_token']}"}
    path = f"{settings.API_V1_STR}/copilot/settings"
    initial = await client.get(path, headers=headers)
    assert initial.status_code == 200
    assert "no-store" in initial.headers["cache-control"]
    config = {
        **initial.json(),
        "text": "Проверяй React и опыт кандидата по резюме",
        "greenFlags": ["React"],
        "redFlags": ["нет опыта"],
        "useMemory": True,
        "memoryMarkdown": "# Проверенная память HR",
        "allowedActions": ["review"],
    }
    saved = await client.put(path, headers=headers, json=config)
    assert saved.status_code == 200, saved.text
    assert saved.json()["version"] == config["version"] + 1
    read = await client.get(path, headers=headers)
    assert read.json() == saved.json()
    assert (await client.put(path, headers=headers, json=config)).status_code == 409

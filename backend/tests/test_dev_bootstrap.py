from unittest.mock import AsyncMock, patch

import pytest

from app.dev.bootstrap import TENANT_ID, seed
from app.models import DevelopmentDataset, User


@pytest.mark.asyncio
async def test_existing_dataset_repairs_missing_fixture_roles() -> None:
    session = AsyncMock()
    session.get.return_value = object()

    with patch("app.dev.bootstrap.bind_demo_tenant", new_callable=AsyncMock):
        await seed(session, tenant_id=TENANT_ID, create_fixture_users=True)

    users = [
        call.args[0]
        for call in session.merge.await_args_list
        if isinstance(call.args[0], User)
    ]
    assert {user.role.value for user in users} == {
        "superuser",
        "administrator",
        "hr",
        "manager",
        "recruiter",
        "candidate",
    }
    assert session.get.await_count == 1
    session.commit.assert_awaited_once()
    assert not any(
        isinstance(call.args[0], DevelopmentDataset)
        for call in session.merge.await_args_list
    )

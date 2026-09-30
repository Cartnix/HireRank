"""Owner access and privilege escalation guards without a database."""

import uuid
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.deps import get_current_active_superuser, require_permission
from app.api.routes.users import create_user, delete_user, update_user
from app.models import User, UserCreate, UserRole, UserUpdate


@pytest.fixture
def db() -> None:
    """These authorization checks do not use PostgreSQL."""


def actor(role: UserRole) -> User:
    return User(
        id=uuid.uuid4(), tenant_id=uuid.uuid4(), email=f"{role}@example.com", role=role
    )


@pytest.mark.parametrize("role", list(UserRole))
def test_only_owner_has_developer_access(role: UserRole) -> None:
    user = actor(role)
    assert user.is_superuser == (role == UserRole.SUPERUSER)
    if role == UserRole.SUPERUSER:
        assert get_current_active_superuser(user) is user
    else:
        with pytest.raises(HTTPException) as error:
            get_current_active_superuser(user)
        assert error.value.status_code == 403


def test_owner_has_all_permissions_without_granting_them_to_admin() -> None:
    request = Request({"type": "http"})
    checker = require_permission("future.feature.manage")
    owner = actor(UserRole.SUPERUSER)
    assert checker(request, owner) is owner
    with pytest.raises(HTTPException):
        checker(request, actor(UserRole.ADMINISTRATOR))


@pytest.mark.asyncio
async def test_admin_cannot_create_owner() -> None:
    session = AsyncMock()
    with pytest.raises(HTTPException) as error:
        await create_user(
            session=session,
            current_user=actor(UserRole.ADMINISTRATOR),
            user_in=UserCreate(
                email="owner@example.com",
                role=UserRole.SUPERUSER,
                password="valid-password",
            ),
        )
    assert error.value.status_code == 403
    session.exec.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "target_role,new_role",
    [(UserRole.SUPERUSER, None), (UserRole.ADMINISTRATOR, UserRole.SUPERUSER)],
)
async def test_admin_cannot_edit_owner_or_promote_self(
    target_role: UserRole, new_role: UserRole | None
) -> None:
    admin = actor(UserRole.ADMINISTRATOR)
    target = actor(target_role)
    session = AsyncMock()
    session.get.return_value = target
    with pytest.raises(HTTPException) as error:
        await update_user(
            session=session,
            current_user=admin,
            user_id=target.id,
            user_in=UserUpdate(role=new_role),
        )
    assert error.value.status_code == 403
    session.commit.assert_not_called()


@pytest.mark.asyncio
async def test_admin_cannot_delete_owner() -> None:
    owner = actor(UserRole.SUPERUSER)
    session = AsyncMock()
    session.get.return_value = owner
    with pytest.raises(HTTPException) as error:
        await delete_user(
            session=session,
            current_user=actor(UserRole.ADMINISTRATOR),
            user_id=owner.id,
        )
    assert error.value.status_code == 403
    session.delete.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("role", list(UserRole))
async def test_developer_endpoint_enforces_role_over_http(role: UserRole) -> None:
    from unittest.mock import patch

    from fastapi import FastAPI
    from httpx import ASGITransport, AsyncClient

    from app.api.deps import get_current_user
    from app.api.routes.developer import router

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: actor(role)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.api.routes.developer.require_dev_database",
            side_effect=ValueError("disabled"),
        ):
            response = await client.get("/developer/dataset")
    assert response.status_code == (404 if role == UserRole.SUPERUSER else 403)

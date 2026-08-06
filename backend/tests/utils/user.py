from collections.abc import Awaitable
from typing import Protocol, TypeVar

from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, UserRole, UserUpdate
from tests.utils.utils import random_email, random_lower_string

T = TypeVar("T")


class SupportsSessionRun(Protocol):
    session: AsyncSession

    def run(self, awaitable: Awaitable[T]) -> T: ...


def user_authentication_headers(
    *, client: TestClient, email: str, password: str
) -> dict[str, str]:
    r = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    response = r.json()
    auth_token = response["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


def create_random_user(db: SupportsSessionRun) -> User:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(
        email=email,
        password=password,
        role=UserRole.CANDIDATE,
        tenant_id=settings.TENANT_ID,
    )
    return db.run(crud.create_user(session=db.session, user_create=user_in))


def authentication_token_from_email(
    *, client: TestClient, email: str, db: SupportsSessionRun
) -> dict[str, str]:
    password = random_lower_string()
    user = db.run(crud.get_user_by_email(session=db.session, email=email))
    if not user:
        user_in_create = UserCreate(
            email=email,
            password=password,
            role=UserRole.CANDIDATE,
            tenant_id=settings.TENANT_ID,
        )
        user = db.run(crud.create_user(session=db.session, user_create=user_in_create))
    else:
        user_in_update = UserUpdate(password=password)
        if not user.id:
            raise Exception("User id not set")
        user = db.run(
            crud.update_user(session=db.session, db_user=user, user_in=user_in_update)
        )

    return user_authentication_headers(client=client, email=email, password=password)

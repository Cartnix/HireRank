from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, UserRole, UserUpdate
from tests.utils.utils import random_email, random_lower_string


async def user_authentication_headers(
    *, client: AsyncClient, email: str, password: str
) -> dict[str, str]:
    r = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    response = r.json()
    auth_token = response["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


async def create_random_user(db: AsyncSession) -> User:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(
        email=email,
        password=password,
        role=UserRole.CANDIDATE,
        tenant_id=settings.TENANT_ID,
    )
    return await crud.create_user(session=db, user_create=user_in)


async def authentication_token_from_email(
    *, client: AsyncClient, email: str, db: AsyncSession
) -> dict[str, str]:
    password = random_lower_string()
    user = await crud.get_user_by_email(session=db, email=email)
    if not user:
        user_in_create = UserCreate(
            email=email,
            password=password,
            role=UserRole.CANDIDATE,
            tenant_id=settings.TENANT_ID,
        )
        user = await crud.create_user(session=db, user_create=user_in_create)
    else:
        user_in_update = UserUpdate(password=password)
        if not user.id:
            raise Exception("User id not set")
        user = await crud.update_user(session=db, db_user=user, user_in=user_in_update)

    return await user_authentication_headers(
        client=client, email=email, password=password
    )

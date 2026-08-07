from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import User
from tests.utils.utils import random_email


async def test_create_user(client: AsyncClient, db: AsyncSession) -> None:
    email = random_email()
    r = await client.post(
        f"{settings.API_V1_STR}/private/users/",
        json={
            "email": email,
            "password": "password123",
            "first_name": "Pollo",
            "last_name": "Listo",
        },
    )

    assert r.status_code == 200

    data = r.json()

    user = (await db.exec(select(User).where(User.id == data["id"]))).first()

    assert user
    assert user.email == email
    assert user.first_name == "Pollo"
    assert user.last_name == "Listo"
    assert user.tenant_id == settings.TENANT_ID

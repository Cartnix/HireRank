import uuid
from typing import Any

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    ItemCreate,
    Permission,
    Role,
    RolePermission,
    User,
    UserCreate,
    UserUpdate,
)


async def create_user(*, session: AsyncSession, user_create: UserCreate) -> User:
    # Core: always bind to singleton tenant — ignore any client/body override
    db_obj = User.model_validate(
        user_create,
        update={
            "hashed_password": get_password_hash(user_create.password),
            "tenant_id": settings.TENANT_ID,
        },
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_user(
    *, session: AsyncSession, db_user: User, user_in: UserUpdate
) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data: dict[str, Any] = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user


async def get_user_by_email(*, session: AsyncSession, email: str) -> User | None:
    statement = select(User).where(
        User.email == email,
        User.tenant_id == settings.TENANT_ID,
    )
    session_user = (await session.exec(statement)).first()
    return session_user


async def get_user_by_id(*, session: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Tenant-scoped PK lookup — prefer over session.get under FORCE RLS."""
    return (
        await session.exec(
            select(User).where(
                User.id == user_id,
                User.tenant_id == settings.TENANT_ID,
            )
        )
    ).first()


async def get_permissions_for_role(
    *, session: AsyncSession, role_name: str
) -> list[str]:
    """Load permission names for a role slug from the M2M tables."""
    statement = (
        select(Permission.name)
        .join(RolePermission, col(RolePermission.permission_id) == Permission.id)
        .join(Role, col(Role.id) == RolePermission.role_id)
        .where(Role.name == role_name)
        .order_by(col(Permission.name))
    )
    return list((await session.exec(statement)).all())


# Dummy hash to use for timing attack prevention when user is not found
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


async def authenticate(
    *, session: AsyncSession, email: str, password: str
) -> User | None:
    db_user = await get_user_by_email(session=session, email=email)
    if not db_user:
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
    return db_user


async def create_item(
    *, session: AsyncSession, item_in: ItemCreate, owner_id: uuid.UUID
) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item

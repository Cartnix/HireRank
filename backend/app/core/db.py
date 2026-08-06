from sqlalchemy import NullPool, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.core.config import settings
from app.models import Tenant, User, UserCreate, UserRole

engine_kwargs: dict[str, object] = {
    "echo": settings.SQLALCHEMY_ECHO,
}
if settings.SQLALCHEMY_POOL_MODE == "null":
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = settings.SQLALCHEMY_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.SQLALCHEMY_MAX_OVERFLOW
    engine_kwargs["pool_recycle"] = settings.SQLALCHEMY_POOL_RECYCLE

engine = create_async_engine(
    str(settings.SQLALCHEMY_ASYNC_DATABASE_URI),
    **engine_kwargs,
)
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def ensure_default_tenant(session: AsyncSession) -> Tenant:
    tenant = await session.get(Tenant, settings.TENANT_ID)
    if tenant:
        return tenant
    by_slug = (
        await session.exec(select(Tenant).where(Tenant.slug == settings.TENANT_SLUG))
    ).first()
    if by_slug:
        return by_slug
    tenant = Tenant(
        id=settings.TENANT_ID,
        slug=settings.TENANT_SLUG,
        name=settings.TENANT_NAME,
    )
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


async def init_db(session: AsyncSession) -> None:
    # Seed bypasses RLS (FORCE applies even to table owner)
    await session.execute(text("SET row_security = off"))
    await ensure_default_tenant(session)
    user = (
        await session.exec(
            select(User).where(
                User.email == settings.FIRST_SUPERUSER,
                User.tenant_id == settings.TENANT_ID,
            )
        )
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role=UserRole.ADMINISTRATOR,
            tenant_id=settings.TENANT_ID,
            first_name="Admin",
            last_name="User",
        )
        await crud.create_user(session=session, user_create=user_in)

import uuid

from pydantic import PostgresDsn
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

DEV_TENANT_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")


def require_dev_database() -> None:
    if not settings.DEV_DATABASE_ENABLED:
        raise ValueError("Development database is disabled")
    if settings.TENANT_ID == DEV_TENANT_ID:
        raise ValueError("Application tenant must differ from the demo tenant")
    if settings.ENVIRONMENT == "production":
        return
    if settings.ENVIRONMENT != "local":
        raise ValueError("Development data is available only in local or production")
    if settings.POSTGRES_DEV_DB in {
        settings.POSTGRES_DB,
        "postgres",
        "template0",
        "template1",
    }:
        raise ValueError(
            "Development database must be separate from the application database"
        )


def dev_database_url(scheme: str = "postgresql+asyncpg") -> str:
    require_dev_database()
    return str(
        PostgresDsn.build(
            scheme=scheme,
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            path=settings.POSTGRES_DEV_DB,
        )
    )


def dev_engine() -> AsyncEngine:
    if settings.ENVIRONMENT == "production":
        require_dev_database()
        return create_async_engine(
            str(settings.SQLALCHEMY_ASYNC_DATABASE_URI), poolclass=NullPool
        )
    if settings.ENVIRONMENT != "local":
        raise ValueError("Development database is only used locally or in production")
    return create_async_engine(dev_database_url(), poolclass=NullPool)


async def prepare_dev_session(session: AsyncSession) -> None:
    require_dev_database()
    if settings.ENVIRONMENT == "production":
        await bind_demo_tenant(session)
    else:
        await session.execute(text("SET LOCAL row_security = off"))


async def bind_demo_tenant(session: AsyncSession) -> None:
    require_dev_database()
    await session.execute(
        text(
            "SELECT set_config('role', :app_role, true), "
            "set_config('app.current_tenant', :tenant_id, true)"
        ),
        {
            "app_role": settings.RLS_APP_ROLE,
            "tenant_id": str(DEV_TENANT_ID),
        },
    )

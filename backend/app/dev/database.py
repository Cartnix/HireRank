from pydantic import PostgresDsn
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings


def require_dev_database() -> None:
    if not settings.DEV_DATABASE_ENABLED or settings.ENVIRONMENT != "local":
        raise ValueError("Development database is disabled")
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


def dev_engine():
    return create_async_engine(dev_database_url(), poolclass=NullPool)

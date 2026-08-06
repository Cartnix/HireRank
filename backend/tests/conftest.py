import os
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager

# Prefer in-memory token store for unit tests (no Redis required).
# Override with TOKEN_STORE=redis to exercise the Redis-backed path (fakeredis).
os.environ.setdefault("TOKEN_STORE", "memory")
# Function-scoped event loops + asyncpg: NullPool avoids cross-loop connection reuse.
os.environ.setdefault("SQLALCHEMY_POOL_MODE", "null")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlmodel import delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core import token_store as token_store_module
from app.core.config import settings
from app.core.db import async_session_maker, engine, init_db
from app.core.token_store import (
    MemoryTokenStore,
    RedisTokenStore,
    TokenStore,
    reset_token_store,
)
from app.main import app
from app.models import Item, User
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers


def _create_test_token_store() -> TokenStore:
    """Never open a real Redis socket in pytest; use fakeredis for redis mode."""
    if settings.TOKEN_STORE == "redis":
        fakeredis = pytest.importorskip("fakeredis")
        return RedisTokenStore(client=fakeredis.FakeRedis(decode_responses=True))
    return MemoryTokenStore()


# Patch factory before any route hits get_token_store().
token_store_module.create_token_store = _create_test_token_store
reset_token_store()


@asynccontextmanager
async def session_context(*, bypass_rls: bool = False) -> AsyncIterator[AsyncSession]:
    async with async_session_maker() as session:
        listener = None
        if bypass_rls:

            def _bypass(_sess: object, _trans: object, connection: Connection) -> None:
                connection.execute(text("SET LOCAL row_security = off"))

            listener = _bypass
            event.listen(session.sync_session, "after_begin", listener)
            await session.execute(text("SELECT 1"))

        try:
            yield session
        finally:
            if listener is not None:
                event.remove(session.sync_session, "after_begin", listener)


@asynccontextmanager
async def bypass_rls_session() -> AsyncIterator[AsyncSession]:
    """
    Seed/admin session that temporarily disables RLS.

    Uses a transaction-local listener so every transaction in the test session
    starts with RLS disabled without polluting pooled connections.
    """
    async with session_context(bypass_rls=True) as session:
        yield session
        await session.commit()


@pytest.fixture(autouse=True)
def reset_test_token_store() -> Iterator[None]:
    reset_token_store()
    yield
    reset_token_store()


@pytest_asyncio.fixture(scope="session", loop_scope="session", autouse=True)
async def dispose_engine() -> AsyncIterator[None]:
    """Dispose the async engine once after the suite (lifespan-equivalent teardown)."""
    yield
    await engine.dispose()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def db() -> AsyncIterator[AsyncSession]:
    """
    Per-test seed session with RLS bypass for fixtures/helpers.

    Route handlers still open their own sessions via ``get_db`` so FORCE RLS
    and ``SET LOCAL ROLE`` stay exercised. Shared-session dependency overrides
    would short-circuit those policies.
    """
    async with session_context(bypass_rls=True) as session:
        try:
            await init_db(session)
        except Exception:
            await session.rollback()
            raise
        yield session
        try:
            await session.rollback()
            await session.execute(delete(Item))
            await session.execute(delete(User))
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncIterator[AsyncClient]:
    """Function-scoped ASGI client — no shared lifespan state across tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def superuser_token_headers(client: AsyncClient) -> dict[str, str]:
    return await get_superuser_token_headers(client)


@pytest_asyncio.fixture(scope="function")
async def normal_user_token_headers(
    client: AsyncClient, db: AsyncSession
) -> dict[str, str]:
    return await authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )

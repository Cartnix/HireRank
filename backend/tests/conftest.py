import os

# Prefer in-memory token store for unit tests (no Redis required).
# Override with TOKEN_STORE=redis to exercise the Redis-backed path (fakeredis).
os.environ.setdefault("TOKEN_STORE", "memory")
# Avoid cross-event-loop asyncpg pool reuse under TestClient + sync adapters.
os.environ.setdefault("SQLALCHEMY_POOL_MODE", "null")

import asyncio
from collections.abc import Awaitable, Generator
from contextlib import contextmanager
from typing import Any, TypeVar, overload

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, text
from sqlalchemy.engine import Connection, CursorResult
from sqlalchemy.engine.result import Result, ScalarResult
from sqlalchemy.sql.base import Executable
from sqlalchemy.sql.dml import UpdateBase
from sqlmodel import delete
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel.sql.expression import SelectOfScalar

from app.core import token_store as token_store_module
from app.core.config import settings
from app.core.db import async_session_maker, init_db
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

T = TypeVar("T")
TSelect = TypeVar("TSelect")
TModel = TypeVar("TModel")


class SyncSessionAdapter:
    def __init__(self, session: AsyncSession, loop: asyncio.AbstractEventLoop) -> None:
        self.session = session
        self._loop = loop

    def run(self, awaitable: Awaitable[T]) -> T:
        return self._loop.run_until_complete(awaitable)

    def execute(
        self, statement: Executable, params: dict[str, Any] | None = None
    ) -> Result[Any]:
        return self._loop.run_until_complete(self.session.execute(statement, params))

    @overload
    def exec(self, statement: SelectOfScalar[TSelect]) -> ScalarResult[TSelect]: ...

    @overload
    def exec(self, statement: UpdateBase) -> CursorResult[Any]: ...

    def exec(self, statement: Any) -> Any:
        return self._loop.run_until_complete(self.session.exec(statement))

    def get(self, model: type[TModel], ident: Any) -> TModel | None:
        return self._loop.run_until_complete(self.session.get(model, ident))

    def add(self, instance: object) -> None:
        self.session.add(instance)

    def add_all(self, instances: list[object]) -> None:
        self.session.add_all(instances)

    def commit(self) -> None:
        self._loop.run_until_complete(self.session.commit())

    def refresh(self, instance: object) -> None:
        self._loop.run_until_complete(self.session.refresh(instance))

    def delete(self, instance: object) -> None:
        self._loop.run_until_complete(self.session.delete(instance))

    def rollback(self) -> None:
        self._loop.run_until_complete(self.session.rollback())

    def expunge(self, instance: object) -> None:
        self.session.expunge(instance)


@contextmanager
def session_context(*, bypass_rls: bool = False) -> Generator[SyncSessionAdapter]:
    loop = asyncio.new_event_loop()
    session = loop.run_until_complete(async_session_maker().__aenter__())
    adapter = SyncSessionAdapter(session, loop)

    listener = None
    if bypass_rls:

        def _bypass(_sess: object, _trans: object, connection: Connection) -> None:
            connection.execute(text("SET LOCAL row_security = off"))

        listener = _bypass
        event.listen(session.sync_session, "after_begin", listener)
        adapter.execute(text("SELECT 1"))

    try:
        yield adapter
    finally:
        if listener is not None:
            event.remove(session.sync_session, "after_begin", listener)
        loop.run_until_complete(session.close())
        loop.close()


@contextmanager
def bypass_rls_session() -> Generator[SyncSessionAdapter]:
    """
    Seed/admin session that temporarily disables RLS.

    Uses a transaction-local listener so every transaction in the test session
    starts with RLS disabled without polluting pooled connections.
    """
    with session_context(bypass_rls=True) as session:
        yield session
        session.commit()


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[SyncSessionAdapter]:
    with session_context(bypass_rls=True) as session:
        try:
            session.run(init_db(session.session))
        except Exception:
            session.rollback()
            raise
        yield session
        try:
            statement = delete(Item)
            session.execute(statement)
            statement = delete(User)
            session.execute(statement)
            session.commit()
            session.run(init_db(session.session))
        except Exception:
            session.rollback()
            raise


@pytest.fixture(scope="session")
def client() -> Generator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="session")
def normal_user_token_headers(
    client: TestClient, db: SyncSessionAdapter
) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )

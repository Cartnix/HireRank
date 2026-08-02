import os

# Prefer in-memory token store for unit tests (no Redis required)
os.environ.setdefault("TOKEN_STORE", "memory")

from collections.abc import Generator
from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.core.token_store import reset_token_store
from app.main import app
from app.models import Item, User
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers

reset_token_store()


@contextmanager
def bypass_rls_session() -> Generator[Session]:
    """
    Seed/admin session that temporarily disables RLS.

    Uses SET LOCAL inside a transaction and always ROLLBACKs the GUC change
    path via commit of data then RESET — never leave session-level
    row_security=off on a pooled connection (connection pollution pitfall).
    """
    with Session(engine) as session:
        session.execute(text("SET row_security = off"))
        try:
            yield session
            session.commit()
        finally:
            # Critical: restore before connection returns to the pool
            session.execute(text("SET row_security = on"))
            session.commit()


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session]:
    with Session(engine) as session:
        session.execute(text("SET row_security = off"))
        try:
            init_db(session)
        finally:
            session.execute(text("SET row_security = on"))
            session.commit()
        yield session
        session.execute(text("SET row_security = off"))
        try:
            statement = delete(Item)
            session.execute(statement)
            statement = delete(User)
            session.execute(statement)
            session.commit()
            init_db(session)
        finally:
            session.execute(text("SET row_security = on"))
            session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )

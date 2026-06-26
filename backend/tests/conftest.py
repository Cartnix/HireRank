"""Shared pytest fixtures for the backend test suite."""

from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.main import app as fastapi_app


@pytest.fixture(scope="session")
def app() -> FastAPI:
    """Return the FastAPI application under test."""

    return fastapi_app


@pytest.fixture
def dependency_overrides(app: FastAPI) -> Generator[dict[Any, Any], None, None]:
    """Placeholder for dependency overrides used in API tests."""

    app.dependency_overrides = {}
    yield app.dependency_overrides
    app.dependency_overrides = {}


@pytest_asyncio.fixture
async def async_client(app: FastAPI, dependency_overrides: dict[Any, Any]) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client bound to the FastAPI app."""

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def database() -> None:
    """Placeholder database fixture for future test isolation."""

    return None
"""Shared fixtures for API contract tests."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
import uuid

import jwt
import pytest
import yaml

from app.core.config import get_settings


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_ROOT.parent
DOCS_ROOT = REPO_ROOT / "docs" / "openapi"


def load_yaml(relative_path: str) -> dict[str, Any]:
    with (DOCS_ROOT / relative_path).open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)

    if not isinstance(data, dict):
        raise TypeError(f"{relative_path} did not load as a mapping")

    return data


@pytest.fixture(scope="session")
def openapi_spec() -> dict[str, Any]:
    return load_yaml("schemas/openapi.yaml")


@pytest.fixture(scope="session")
def passport_features() -> str:
    return (REPO_ROOT / "docs" / "features.md").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def contract_settings() -> Any:
    return get_settings()


@pytest.fixture
def make_supabase_token(contract_settings: Any) -> Callable[..., tuple[str, dict[str, Any]]]:
    def _make(
        *,
        role: str = "candidate",
        enterprise_id: str | None = None,
        user_id: str | None = None,
        email: str = "candidate@example.com",
        extra_claims: dict[str, Any] | None = None,
    ) -> tuple[str, dict[str, Any]]:
        resolved_enterprise_id = enterprise_id or str(uuid.uuid4())
        resolved_user_id = user_id or str(uuid.uuid4())
        now = datetime.now(UTC)

        claims: dict[str, Any] = {
            "sub": resolved_user_id,
            "email": email,
            "aud": contract_settings.supabase_jwt_audience,
            "iat": now,
            "exp": now + timedelta(hours=1),
            "app_metadata": {
                "role": role,
                "enterprise_id": resolved_enterprise_id,
            },
            "user_metadata": {
                "enterprise_id": resolved_enterprise_id,
            },
        }

        if contract_settings.supabase_jwt_issuer:
            claims["iss"] = contract_settings.supabase_jwt_issuer

        if extra_claims:
            claims.update(extra_claims)

        secret = contract_settings.supabase_jwt_secret
        if not secret:
            raise RuntimeError("SUPABASE_JWT_SECRET is required for contract tests")

        token = jwt.encode(claims, secret, algorithm="HS256")
        return token, claims

    return _make


@pytest.fixture
def supabase_headers(make_supabase_token: Callable[..., tuple[str, dict[str, Any]]]) -> Callable[..., tuple[dict[str, str], dict[str, Any]]]:
    def _make_headers(**kwargs: Any) -> tuple[dict[str, str], dict[str, Any]]:
        token, claims = make_supabase_token(**kwargs)
        return {"Authorization": f"Bearer {token}"}, claims

    return _make_headers
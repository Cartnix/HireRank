"""Static contract checks against docs/openapi and docs/features."""

from pathlib import Path

import pytest


DOCS_ROOT = Path(__file__).resolve().parents[3] / "docs"


def load_path_doc(filename: str) -> dict:
    import yaml

    with (DOCS_ROOT / "openapi" / "paths" / filename).open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)

    assert isinstance(data, dict)
    return data


@pytest.mark.parametrize(
    ("filename", "path_key", "method", "required_statuses", "security"),
    [
        ("auth.yaml", "/auth/register", "post", {"201", "400", "409"}, []),
        ("auth.yaml", "/auth/login", "post", {"200", "401"}, []),
        ("vacancies.yaml", "/vacancies", "get", {"200", "401"}, None),
        ("vacancies.yaml", "/vacancies", "post", {"201", "400", "403"}, None),
        ("candidates.yaml", "/candidates", "get", {"200", "401", "403"}, None),
        ("candidates.yaml", "/candidates", "post", {"201", "400", "403"}, None),
    ],
)
def test_openapi_endpoint_contract(filename: str, path_key: str, method: str, required_statuses: set[str], security: list | None) -> None:
    path_doc = load_path_doc(filename)
    operation = path_doc["paths"][path_key][method]

    assert operation["tags"]
    assert required_statuses.issubset(set(operation["responses"].keys()))

    if security is not None:
        assert operation.get("security", []) == security


def test_openapi_contract_matches_passport_features(openapi_spec: dict, passport_features: str) -> None:
    description = openapi_spec["info"]["description"]

    assert "enterprise_id" in description
    assert "Bearer JWT" in description

    for role in ("administrator", "hr_operator", "manager", "candidate"):
        assert role in description

    for feature in (
        "F-002 Authentication",
        "F-003 Role Based Access",
        "F-004 Enterprise Isolation",
        "F-009 Vacancy Management",
        "F-010 Vacancy Directory",
        "F-011 Candidate Assignment",
        "F-012 Candidate Status",
        "F-013 Notifications",
        "F-014 Dashboard",
    ):
        assert feature in passport_features


def test_openapi_contract_exposes_public_and_protected_tags(openapi_spec: dict) -> None:
    tags = {tag["name"] for tag in openapi_spec["tags"]}

    assert {"Auth", "Users", "Candidates", "Vacancies", "Notifications", "Dashboard", "Admin"}.issubset(tags)
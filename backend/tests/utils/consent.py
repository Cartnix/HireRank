"""Shared consent payload helpers (RK §1.4 / GDPR Art.6–7)."""

from __future__ import annotations

from typing import Any


def valid_consent(
    *,
    account_processing: bool = True,
    talent_pool: bool = False,
    cross_border: bool = False,
    cross_border_countries: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "account_processing": account_processing,
        "talent_pool": talent_pool,
        "cross_border": cross_border,
        "cross_border_countries": list(cross_border_countries or []),
    }


def register_json(
    *,
    email: str,
    password: str,
    role: str = "candidate",
    consent: dict[str, Any] | None = None,
    **extra: Any,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "email": email,
        "password": password,
        "role": role,
        "consent": consent if consent is not None else valid_consent(),
    }
    payload.update(extra)
    return payload

"""Pydantic schemas for audit events (strict, PII-safe)."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator
from uuid_utils import uuid7

# Metadata keys allowed in durable audit rows (no raw PII values).
ALLOWED_METADATA_KEYS: frozenset[str] = frozenset(
    {
        "reason",
        "email_hash",
        "updated_fields",
        "outcome",
        "path",
        "seed",  # test fixtures only
        "field",
        "changed",
        "detail",
        "purpose",
    }
)

FORBIDDEN_METADATA_KEYS: frozenset[str] = frozenset(
    {
        "password",
        "email",
        "phone",
        "ssn",
        "passport",
        "access_token",
        "refresh_token",
        "token",
        "authorization",
    }
)


class AuditAction(StrEnum):
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILURE = "auth.login.failure"
    LOGOUT = "auth.logout"
    REGISTER = "auth.register"
    REFRESH = "auth.refresh"
    CONSENT_UPDATE = "auth.consent.update"
    FORGET_ME = "auth.forget_me"


def hash_email(email: str) -> str:
    """One-way hint for failed-login correlation without storing PII."""
    normalized = email.strip().lower().encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()


def new_event_id() -> UUID:
    return UUID(str(uuid7()))


class AuditEvent(BaseModel):
    """Validated audit event — only allowlisted metadata keys survive."""

    model_config = ConfigDict(populate_by_name=True)

    event_id: UUID = Field(default_factory=new_event_id)
    tenant_id: UUID
    user_id: UUID | None = None
    action: AuditAction | str
    entity_type: str = "user"
    entity_id: UUID | None = None
    # DB column is `metadata`; accept `payload` alias (ATS audit guide naming).
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata", "payload"),
    )
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @field_validator("metadata", mode="before")
    @classmethod
    def sanitize_metadata(cls, value: Any) -> dict[str, Any]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise TypeError("metadata must be a dict")
        cleaned: dict[str, Any] = {}
        for key, raw in value.items():
            key_l = str(key).lower()
            if key_l in FORBIDDEN_METADATA_KEYS:
                continue
            if key_l not in ALLOWED_METADATA_KEYS and key not in ALLOWED_METADATA_KEYS:
                continue
            cleaned[key] = raw
        return cleaned

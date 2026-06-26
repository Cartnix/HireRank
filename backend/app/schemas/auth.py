"""Auth schemas."""

from typing import Any

from pydantic import BaseModel, EmailStr


class SupabaseUserClaims(BaseModel):
    sub: str
    email: EmailStr | None = None
    role: str | None = None
    enterprise_id: str | None = None
    app_metadata: dict[str, Any] = {}
    user_metadata: dict[str, Any] = {}


class AuthenticatedUser(BaseModel):
    user_id: str
    email: EmailStr | None = None
    role: str | None = None
    enterprise_id: str | None = None
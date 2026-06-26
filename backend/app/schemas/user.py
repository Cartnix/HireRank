"""User schemas."""

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: str
    enterprise_id: str
    email: EmailStr
    role: str
    created_at: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
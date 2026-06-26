"""Auth schemas."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    enterprise_id: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
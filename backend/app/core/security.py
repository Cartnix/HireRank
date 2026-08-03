from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings

password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


ALGORITHM = "HS256"
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


def create_access_token(
    *,
    subject: str | UUID,
    role: str,
    tenant_id: str | UUID,
    expires_delta: timedelta | None = None,
    jti: str | None = None,
) -> tuple[str, str, datetime]:
    """Return (encoded_jwt, jti, expire_at)."""
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    token_jti = jti or str(uuid4())
    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": str(tenant_id),
        "jti": token_jti,
        "type": TOKEN_TYPE_ACCESS,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, token_jti, expire


def create_refresh_token(
    *,
    subject: str | UUID,
    role: str,
    tenant_id: str | UUID,
    expires_delta: timedelta | None = None,
    jti: str | None = None,
) -> tuple[str, str, datetime]:
    """Return (encoded_jwt, jti, expire_at)."""
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta
        else timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    token_jti = jti or str(uuid4())
    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": str(tenant_id),
        "jti": token_jti,
        "type": TOKEN_TYPE_REFRESH,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, token_jti, expire


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

"""Encrypt third-party OAuth refresh tokens at rest (AES via Fernet)."""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _fernet() -> Fernet:
    raw = settings.OAUTH_TOKEN_ENCRYPTION_KEY.strip()
    if raw:
        key = raw.encode("utf-8")
        # Accept raw Fernet keys; otherwise derive
        try:
            return Fernet(key)
        except (ValueError, TypeError):
            digest = hashlib.sha256(key).digest()
            return Fernet(base64.urlsafe_b64encode(digest))
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Invalid encrypted secret") from exc

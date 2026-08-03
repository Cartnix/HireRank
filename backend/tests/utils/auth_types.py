"""Shared typed shapes for auth API responses in tests."""

from __future__ import annotations

from typing import TypedDict


class TokenPairDict(TypedDict):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

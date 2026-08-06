"""Google / LinkedIn OAuth2 — identity verification only; session is HireRank JWT."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

OAuthProvider = Literal["google", "linkedin"]

PUBLIC_EMAIL_DOMAINS = frozenset(
    {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "live.com",
        "mail.ru",
        "yandex.ru",
        "yandex.com",
        "icloud.com",
        "proton.me",
        "protonmail.com",
    }
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"


@dataclass(frozen=True)
class OAuthProfile:
    provider: OAuthProvider
    provider_subject: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None


def new_oauth_state() -> str:
    return secrets.token_urlsafe(32)


def _require_google() -> None:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )


def _require_linkedin() -> None:
    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LinkedIn OAuth is not configured",
        )


def build_authorize_url(provider: OAuthProvider, state: str) -> str:
    if provider == "google":
        _require_google()
        redirect = settings.GOOGLE_REDIRECT_URI or (
            f"{settings.FRONTEND_HOST.replace('5173', '8000')}"
            f"{settings.API_V1_STR}/auth/callback/google"
        )
        # Prefer explicit redirect from settings
        redirect = settings.GOOGLE_REDIRECT_URI or redirect
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    _require_linkedin()
    redirect = settings.LINKEDIN_REDIRECT_URI
    if not redirect:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LinkedIn OAuth redirect URI is not configured",
        )
    params = {
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": redirect,
        "response_type": "code",
        "scope": "openid profile email",
        "state": state,
    }
    return f"{LINKEDIN_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str) -> OAuthProfile:
    _require_google()
    redirect = settings.GOOGLE_REDIRECT_URI
    if not redirect:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth redirect URI is not configured",
        )
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication failed",
            )
        tokens = token_res.json()
        access = tokens.get("access_token")
        if not access:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication failed",
            )
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication failed",
            )
        profile = user_res.json()
    sub = profile.get("sub")
    email = profile.get("email")
    if not sub or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google profile missing email or subject",
        )
    return OAuthProfile(
        provider="google",
        provider_subject=str(sub),
        email=str(email).lower(),
        first_name=profile.get("given_name"),
        last_name=profile.get("family_name"),
        access_token=access,
        refresh_token=tokens.get("refresh_token"),
    )


async def exchange_linkedin_code(code: str) -> OAuthProfile:
    _require_linkedin()
    redirect = settings.LINKEDIN_REDIRECT_URI
    if not redirect:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LinkedIn OAuth redirect URI is not configured",
        )
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(
            LINKEDIN_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                "redirect_uri": redirect,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn authentication failed",
            )
        tokens = token_res.json()
        access = tokens.get("access_token")
        if not access:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn authentication failed",
            )
        user_res = await client.get(
            LINKEDIN_USERINFO_URL,
            headers={"Authorization": f"Bearer {access}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn authentication failed",
            )
        profile = user_res.json()
    sub = profile.get("sub")
    email = profile.get("email")
    if not sub or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LinkedIn profile missing email or subject",
        )
    return OAuthProfile(
        provider="linkedin",
        provider_subject=str(sub),
        email=str(email).lower(),
        first_name=profile.get("given_name"),
        last_name=profile.get("family_name"),
        access_token=access,
        refresh_token=tokens.get("refresh_token"),
    )


async def exchange_code(provider: OAuthProvider, code: str) -> OAuthProfile:
    if provider == "google":
        return await exchange_google_code(code)
    return await exchange_linkedin_code(code)


def email_domain(email: str) -> str:
    return email.rsplit("@", 1)[-1].lower()


def is_public_email_domain(email: str) -> bool:
    return email_domain(email) in PUBLIC_EMAIL_DOMAINS

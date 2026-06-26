"""Security helpers."""

from dataclasses import dataclass
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

JWT_TOKEN_TYPE = "bearer"

http_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True, slots=True)
class SupabaseUserClaims:
	"""Claims extracted from a Supabase access token."""

	user_id: str
	email: str | None
	role: str | None
	enterprise_id: str | None
	raw_claims: dict[str, Any]


def _decode_supabase_token(token: str) -> dict[str, Any]:
	settings = get_settings()

	if not settings.supabase_jwt_secret:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Supabase JWT secret is not configured.",
		)

	decode_options = {"require": ["exp", "sub"]}
	if settings.supabase_jwt_audience:
		decode_options["verify_aud"] = True
	if settings.supabase_jwt_issuer:
		decode_options["verify_iss"] = True

	try:
		return jwt.decode(
			token,
			settings.supabase_jwt_secret,
			algorithms=["HS256"],
			audience=settings.supabase_jwt_audience or None,
			issuer=settings.supabase_jwt_issuer,
			options=decode_options,
		)
	except jwt.PyJWTError as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid Supabase access token.",
			headers={"WWW-Authenticate": JWT_TOKEN_TYPE},
		) from exc


def get_supabase_access_token(
	credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> str:
	if credentials is None or credentials.scheme.lower() != JWT_TOKEN_TYPE:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Missing bearer token.",
			headers={"WWW-Authenticate": JWT_TOKEN_TYPE},
		)

	return credentials.credentials


def get_current_supabase_user(token: str = Depends(get_supabase_access_token)) -> SupabaseUserClaims:
	claims = _decode_supabase_token(token)
	app_metadata = claims.get("app_metadata") or {}
	user_metadata = claims.get("user_metadata") or {}

	return SupabaseUserClaims(
		user_id=str(claims["sub"]),
		email=claims.get("email"),
		role=app_metadata.get("role") or claims.get("role"),
		enterprise_id=app_metadata.get("enterprise_id") or user_metadata.get("enterprise_id"),
		raw_claims=claims,
	)
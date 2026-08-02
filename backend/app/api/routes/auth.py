from datetime import UTC, datetime, timedelta
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app import crud
from app.api.deps import CurrentUser, SessionDep, bearer_scheme
from app.core import security
from app.core.config import settings
from app.core.token_store import get_token_store
from app.models import (
    REGISTERABLE_ROLES,
    ErrorResponse,
    LoginRequest,
    RefreshRequest,
    TokenPair,
    TokenPayload,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    role_str,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _issue_token_pair(user: User) -> TokenPair:
    access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    access_token, _, _ = security.create_access_token(
        subject=user.id,
        role=role_str(user.role),
        tenant_id=user.tenant_id,
        expires_delta=access_expires,
    )
    refresh_token, refresh_jti, _ = security.create_refresh_token(
        subject=user.id,
        role=role_str(user.role),
        tenant_id=user.tenant_id,
        expires_delta=refresh_expires,
    )
    get_token_store().store_refresh(
        refresh_jti,
        str(user.id),
        ttl_seconds=int(refresh_expires.total_seconds()),
        tenant_id=user.tenant_id,
    )
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int(access_expires.total_seconds()),
    )


def _blacklist_access_from_creds(
    creds: HTTPAuthorizationCredentials | None,
) -> None:
    if creds is None or creds.scheme.lower() != "bearer":
        return
    try:
        payload = security.decode_token(creds.credentials)
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        return
    if token_data.type != security.TOKEN_TYPE_ACCESS or not token_data.jti:
        return
    exp = payload.get("exp")
    ttl = 60
    if isinstance(exp, int):
        ttl = max(int(exp - datetime.now(UTC).timestamp()), 1)
    get_token_store().blacklist_access(
        token_data.jti,
        ttl_seconds=ttl,
        tenant_id=token_data.tenant_id or settings.TENANT_ID,
    )


@router.post(
    "/register",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse},
        400: {"model": ErrorResponse},
    },
)
def register(session: SessionDep, body: UserRegister) -> TokenPair:
    if body.role not in REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is not allowed for registration",
        )
    existing = crud.get_user_by_email(session=session, email=body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered",
        )
    user_create = UserCreate(
        email=body.email,
        password=body.password,
        role=body.role,
        first_name=body.first_name,
        last_name=body.last_name,
        tenant_id=settings.TENANT_ID,
    )
    user = crud.create_user(session=session, user_create=user_create)
    return _issue_token_pair(user)


@router.post(
    "/login",
    response_model=TokenPair,
    responses={401: {"model": ErrorResponse}},
)
def login(session: SessionDep, body: LoginRequest) -> TokenPair:
    user = crud.authenticate(session=session, email=body.email, password=body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return _issue_token_pair(user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        422: {"description": "Missing refresh_token body"},
    },
)
def logout(
    current_user: CurrentUser,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    body: RefreshRequest,
) -> Response:
    """
    Server-side logout: Bearer access authorizes the call; refresh_token in body
    is hard-revoked so stolen refresh cannot mint new access tokens.
    """
    try:
        payload = security.decode_token(body.refresh_token)
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    if token_data.type != security.TOKEN_TYPE_REFRESH or not token_data.jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    if token_data.sub != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token does not match current user",
        )
    if token_data.tenant_id and token_data.tenant_id != str(settings.TENANT_ID):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant mismatch",
        )

    get_token_store().revoke_refresh(
        token_data.jti,
        grace_seconds=None,
        tenant_id=token_data.tenant_id or settings.TENANT_ID,
    )
    _blacklist_access_from_creds(creds)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserPublic)
def me(current_user: CurrentUser) -> Any:
    return current_user


@router.post(
    "/refresh",
    response_model=TokenPair,
    responses={401: {"model": ErrorResponse}},
)
def refresh(session: SessionDep, body: RefreshRequest) -> TokenPair:
    try:
        payload = security.decode_token(body.refresh_token)
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    if token_data.type != security.TOKEN_TYPE_REFRESH or not token_data.jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    store = get_token_store()
    tenant_id = token_data.tenant_id or settings.TENANT_ID
    stored_user_id = store.get_refresh_user(token_data.jti, tenant_id=tenant_id)
    if not stored_user_id or stored_user_id != token_data.sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    try:
        user_id = UUID(token_data.sub) if token_data.sub else None
    except ValueError:
        user_id = None
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    user = crud.get_user_by_id(session=session, user_id=user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    store.revoke_refresh(
        token_data.jti,
        grace_seconds=settings.REFRESH_TOKEN_GRACE_SECONDS,
        tenant_id=tenant_id,
    )
    return _issue_token_pair(user)

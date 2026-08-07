from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from fastapi.responses import RedirectResponse
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    bearer_scheme,
    extract_access_token,
)
from app.audit.emit import email_hash_metadata, emit_auth_audit
from app.audit.schemas import AuditAction, hash_email
from app.auth.consent import (
    anonymize_user_for_erasure,
    build_user_public,
    get_consent_grant,
    record_consents,
    stamp_legal_acceptance,
    validate_consent_grant,
)
from app.auth.oauth import (
    OAuthProvider,
    build_authorize_url,
    exchange_code,
    new_oauth_state,
)
from app.auth.oauth_state import pop_oauth_pending, store_oauth_pending
from app.auth.rate_limit import (
    clear_rate_limit,
    enforce_check_email_rate_limit,
    enforce_login_rate_limit,
    login_rate_key,
)
from app.auth.request_meta import client_ip
from app.core import security
from app.core.config import settings
from app.core.cookies import clear_auth_cookies, set_auth_cookies
from app.core.crypto import encrypt_secret
from app.core.token_store import get_token_store
from app.models import (
    REGISTERABLE_ROLES,
    AcceptLegalRequest,
    AuthSession,
    CheckEmailRequest,
    CheckEmailResponse,
    ConsentGrant,
    ConsentPublic,
    ErrorResponse,
    LoginRequest,
    OAuthStartRequest,
    RefreshRequest,
    TokenPair,
    TokenPayload,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRole,
    role_str,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

OAUTH_STATE_COOKIE = "oauth_state"


async def _issue_token_pair(session: AsyncSession, user: User) -> TokenPair:
    access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    role = role_str(user.role)
    permissions = await crud.get_permissions_for_role(session=session, role_name=role)
    access_token, _, _ = security.create_access_token(
        subject=user.id,
        role=role,
        tenant_id=user.tenant_id,
        permissions=permissions,
        expires_delta=access_expires,
    )
    refresh_token, refresh_jti, _ = security.create_refresh_token(
        subject=user.id,
        role=role,
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


def _session_from_pair(response: Response, pair: TokenPair) -> AuthSession:
    set_auth_cookies(
        response,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    return AuthSession(token_type="cookie", expires_in=pair.expires_in)


def _blacklist_access_token(token: str | None) -> None:
    if not token:
        return
    try:
        payload = security.decode_token(token)
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


def _resolve_refresh_token(request: Request, body: RefreshRequest | None) -> str | None:
    if body and body.refresh_token:
        return body.refresh_token
    return request.cookies.get(settings.AUTH_COOKIE_REFRESH_NAME)


@router.post(
    "/register",
    response_model=AuthSession,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse},
        400: {"model": ErrorResponse},
    },
)
async def register(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    body: UserRegister,
) -> AuthSession:
    if body.role not in REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is not allowed for registration",
        )
    existing = await crud.get_user_by_email(session=session, email=body.email)
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
    user = await crud.create_user(session=session, user_create=user_create)
    stamp_legal_acceptance(user)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    await record_consents(session=session, user=user, consent=body.consent)
    pair = await _issue_token_pair(session, user)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.REGISTER,
        tenant_id=user.tenant_id,
        user_id=user.id,
        entity_id=user.id,
        metadata={"reason": "register"},
    )
    return _session_from_pair(response, pair)


@router.post(
    "/login",
    response_model=AuthSession,
    responses={401: {"model": ErrorResponse}},
)
async def login(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    body: LoginRequest,
) -> AuthSession:
    ip = client_ip(request)
    enforce_login_rate_limit(ip=ip, email=body.email)
    user = await crud.authenticate(
        session=session, email=body.email, password=body.password
    )
    if not user:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata=email_hash_metadata(body.email, reason="bad_credentials"),
            force_sync=True,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
        )
    if not user.is_active:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            tenant_id=user.tenant_id,
            user_id=user.id,
            entity_id=user.id,
            metadata={"reason": "inactive_user"},
            force_sync=True,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    clear_rate_limit(login_rate_key(ip=ip, email=body.email))
    pair = await _issue_token_pair(session, user)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.LOGIN_SUCCESS,
        tenant_id=user.tenant_id,
        user_id=user.id,
        entity_id=user.id,
        metadata={"reason": "login"},
    )
    return _session_from_pair(response, pair)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
    },
)
async def logout(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    creds: Annotated[str | None, Depends(bearer_scheme)],
    body: Annotated[RefreshRequest | None, Body()] = None,
) -> Response:
    """
    Cookie or Bearer access authorizes; refresh from cookie or optional body
    is hard-revoked. Clears auth cookies.
    """
    refresh_raw = _resolve_refresh_token(request, body)
    if not refresh_raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing refresh_token",
        )
    try:
        payload = security.decode_token(refresh_raw)
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
    access = extract_access_token(request, creds)
    _blacklist_access_token(access)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.LOGOUT,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        entity_id=current_user.id,
        metadata={"reason": "logout"},
    )
    clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserPublic)
async def me(session: SessionDep, current_user: CurrentUser) -> Any:
    return await build_user_public(session, current_user)


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email(
    request: Request,
    session: SessionDep,
    body: CheckEmailRequest,
) -> CheckEmailResponse:
    """Universal auth: detect whether email already has an account (rate-limited)."""
    enforce_check_email_rate_limit(ip=client_ip(request))
    existing = await crud.get_user_by_email(session=session, email=body.email)
    return CheckEmailResponse(registered=existing is not None)


@router.post("/accept-legal", response_model=UserPublic)
async def accept_legal(
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    body: AcceptLegalRequest,
) -> UserPublic:
    """
    Force-major policy update + consent TTL refresh (RK).
    Blocks product use in FE until accepted after login.
    """
    public = await build_user_public(session, current_user)
    if public.consent_refresh_required:
        if body.consent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="consent is required to refresh expired account processing",
            )
        await record_consents(session=session, user=current_user, consent=body.consent)
    elif body.consent is not None:
        await record_consents(session=session, user=current_user, consent=body.consent)

    stamp_legal_acceptance(current_user)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.LEGAL_ACCEPT,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        entity_id=current_user.id,
        metadata={"reason": "legal_accept", "detail": settings.LEGAL_POLICY_VERSION},
    )
    return await build_user_public(session, current_user)


@router.post(
    "/refresh",
    response_model=AuthSession,
    responses={401: {"model": ErrorResponse}},
)
async def refresh(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    body: Annotated[RefreshRequest | None, Body()] = None,
) -> AuthSession:
    refresh_raw = _resolve_refresh_token(request, body)
    if not refresh_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    try:
        payload = security.decode_token(refresh_raw)
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata={"reason": "refresh_invalid"},
            force_sync=True,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    if token_data.type != security.TOKEN_TYPE_REFRESH or not token_data.jti:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata={"reason": "refresh_invalid_type"},
            force_sync=True,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    store = get_token_store()
    tenant_id = token_data.tenant_id or settings.TENANT_ID
    stored_user_id = store.get_refresh_user(token_data.jti, tenant_id=tenant_id)
    if not stored_user_id or stored_user_id != token_data.sub:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata={"reason": "refresh_revoked"},
            force_sync=True,
        )
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
    user = await crud.get_user_by_id(session=session, user_id=user_id)
    if not user or not user.is_active:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata={"reason": "refresh_user_inactive"},
            force_sync=True,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired",
        )
    # Blacklist old access if present
    old_access = request.cookies.get(settings.AUTH_COOKIE_ACCESS_NAME)
    _blacklist_access_token(old_access)
    store.revoke_refresh(
        token_data.jti,
        grace_seconds=settings.REFRESH_TOKEN_GRACE_SECONDS,
        tenant_id=tenant_id,
    )
    pair = await _issue_token_pair(session, user)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.REFRESH,
        tenant_id=user.tenant_id,
        user_id=user.id,
        entity_id=user.id,
        metadata={"reason": "refresh"},
    )
    return _session_from_pair(response, pair)


@router.get("/consent", response_model=ConsentPublic)
async def read_consent(
    session: SessionDep,
    current_user: CurrentUser,
) -> ConsentPublic:
    return await get_consent_grant(session, user_id=current_user.id)


@router.patch("/consent", response_model=ConsentPublic)
async def update_consent(
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    body: ConsentGrant,
) -> ConsentPublic:
    await record_consents(session=session, user=current_user, consent=body)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.CONSENT_UPDATE,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        entity_id=current_user.id,
        metadata={"reason": "consent_update"},
    )
    grant = await get_consent_grant(session, user_id=current_user.id)
    return grant


@router.post(
    "/forget-me",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
)
async def forget_me(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    creds: Annotated[str | None, Depends(bearer_scheme)],
    body: Annotated[RefreshRequest | None, Body()] = None,
) -> Response:
    """
    GDPR Art.17 / RK §3.3 — revoke consents, anonymize auth identity, clear session.
    """
    if role_str(current_user.role) == UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot self-erase via forget-me",
        )
    email_digest = hash_email(current_user.email)
    refresh_raw = _resolve_refresh_token(request, body)
    if refresh_raw:
        try:
            payload = security.decode_token(refresh_raw)
            token_data = TokenPayload(**payload)
            if token_data.jti and token_data.type == security.TOKEN_TYPE_REFRESH:
                get_token_store().revoke_refresh(
                    token_data.jti,
                    grace_seconds=None,
                    tenant_id=token_data.tenant_id or settings.TENANT_ID,
                )
        except (InvalidTokenError, ValidationError):
            pass
    access = extract_access_token(request, creds)
    _blacklist_access_token(access)
    await anonymize_user_for_erasure(session, user=current_user)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.FORGET_ME,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        entity_id=current_user.id,
        metadata={"reason": "forget_me", "email_hash": email_digest},
        force_sync=True,
    )
    clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/oauth/{provider}/start")
async def oauth_start(
    provider: Literal["google", "linkedin"],
    body: OAuthStartRequest,
) -> RedirectResponse:
    validate_consent_grant(body.consent)
    state = new_oauth_state()
    store_oauth_pending(state=state, provider=provider, consent=body.consent)
    url = build_authorize_url(provider, state)
    redirect = RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)
    redirect.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=600,
    )
    return redirect


async def _provision_oauth_user(session: AsyncSession, profile: Any) -> User:
    identity = await crud.get_oauth_identity(
        session=session,
        provider=profile.provider,
        provider_subject=profile.provider_subject,
    )
    if identity:
        user = await crud.get_user_by_id(session=session, user_id=identity.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth identity is orphaned",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        enc = encrypt_secret(profile.refresh_token) if profile.refresh_token else None
        await crud.upsert_oauth_identity(
            session=session,
            provider=profile.provider,
            provider_subject=profile.provider_subject,
            user_id=user.id,
            encrypted_refresh_token=enc,
        )
        return user

    # Link by email within tenant if local account already exists
    existing = await crud.get_user_by_email(session=session, email=profile.email)
    if existing:
        if not existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        user = existing
    else:
        # Core: always candidate on singleton tenant (Postgres is SoT for roles)
        user = await crud.create_user(
            session=session,
            user_create=UserCreate(
                email=profile.email,
                password=None,
                role=UserRole.CANDIDATE,
                first_name=profile.first_name,
                last_name=profile.last_name,
                tenant_id=settings.TENANT_ID,
            ),
        )

    enc = encrypt_secret(profile.refresh_token) if profile.refresh_token else None
    await crud.upsert_oauth_identity(
        session=session,
        provider=profile.provider,
        provider_subject=profile.provider_subject,
        user_id=user.id,
        encrypted_refresh_token=enc,
    )
    return user


async def _oauth_callback(
    *,
    provider: OAuthProvider,
    code: str,
    state: str,
    request: Request,
    background_tasks: BackgroundTasks,
    session: AsyncSession,
) -> RedirectResponse:
    cookie_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if not cookie_state or not state or cookie_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )
    consent = pop_oauth_pending(state)
    if consent is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth consent missing or expired",
        )
    profile = await exchange_code(provider, code)
    try:
        user = await _provision_oauth_user(session, profile)
    except HTTPException as exc:
        await emit_auth_audit(
            request=request,
            background_tasks=background_tasks,
            action=AuditAction.LOGIN_FAILURE,
            metadata={"reason": f"oauth_{provider}_failed", "detail": str(exc.detail)},
            force_sync=True,
        )
        raise
    await record_consents(session=session, user=user, consent=consent)
    stamp_legal_acceptance(user)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    pair = await _issue_token_pair(session, user)
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.LOGIN_SUCCESS,
        tenant_id=user.tenant_id,
        user_id=user.id,
        entity_id=user.id,
        metadata={"reason": f"oauth_{provider}"},
    )
    redirect = RedirectResponse(
        url=f"{settings.FRONTEND_HOST}/auth",
        status_code=status.HTTP_302_FOUND,
    )
    set_auth_cookies(
        redirect,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    redirect.delete_cookie(key=OAUTH_STATE_COOKIE, path="/")
    return redirect


@router.get("/callback/google")
async def google_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    code: str,
    state: str = "",
) -> RedirectResponse:
    return await _oauth_callback(
        provider="google",
        code=code,
        state=state,
        request=request,
        background_tasks=background_tasks,
        session=session,
    )


@router.get("/callback/linkedin")
async def linkedin_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    code: str,
    state: str = "",
) -> RedirectResponse:
    return await _oauth_callback(
        provider="linkedin",
        code=code,
        state=state,
        request=request,
        background_tasks=background_tasks,
        session=session,
    )

import uuid
from collections.abc import AsyncGenerator, Callable, Collection
from typing import Annotated

import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.auth.permissions import has_permission
from app.core import security
from app.core.config import settings
from app.core.context import set_tenant_id, set_user_id, set_user_role
from app.core.db import async_session_maker
from app.core.token_store import get_token_store
from app.models import TokenPayload, User, UserRole, role_str

bearer_scheme = HTTPBearer(auto_error=False)


def set_tenant_guc(connection: Connection, tenant_id: uuid.UUID | str) -> None:
    """Inject tenant id into PostgreSQL session for RLS (transaction-local)."""
    connection.execute(
        text("SELECT set_config('app.current_tenant', :tenant, true)"),
        {"tenant": str(tenant_id)},
    )


def set_user_gucs(
    connection: Connection,
    *,
    user_id: uuid.UUID | str,
    role: str,
) -> None:
    """Inject user id/role for future resource-level RLS policies."""
    connection.execute(
        text("SELECT set_config('app.current_user_id', :user_id, true)"),
        {"user_id": str(user_id)},
    )
    connection.execute(
        text("SELECT set_config('app.current_user_role', :role, true)"),
        {"role": role},
    )


async def set_user_gucs_async(
    session: AsyncSession,
    *,
    user_id: uuid.UUID | str,
    role: str,
) -> None:
    connection = await session.connection()
    await connection.execute(
        text("SELECT set_config('app.current_user_id', :user_id, true)"),
        {"user_id": str(user_id)},
    )
    await connection.execute(
        text("SELECT set_config('app.current_user_role', :role, true)"),
        {"role": role},
    )


def apply_rls_context(
    connection: Connection,
    *,
    tenant_id: uuid.UUID | str | None = None,
    user_id: uuid.UUID | str | None = None,
    role: str | None = None,
) -> None:
    """
    Bind the session to the non-BYPASSRLS app role and set tenant GUC.

    Superusers ignore FORCE RLS; SET LOCAL ROLE hirerank_app is required for
    policies to take effect when the login role is postgres/owner.

    Always re-enable row_security first: a pooled connection may still have
    session-level `row_security=off` from seed/bypass helpers (pool pollution).

    Optional user_id/role GUCs prepare future vacancy/candidate RLS without
    changing the Python session lifecycle later.
    """
    connection.execute(text("SET row_security = on"))
    app_role = settings.RLS_APP_ROLE
    connection.execute(text(f"SET LOCAL ROLE {app_role}"))
    set_tenant_guc(connection, tenant_id or settings.TENANT_ID)
    if user_id is not None and role is not None:
        set_user_gucs(connection, user_id=user_id, role=role)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session_maker() as session:
        if settings.BYPASS_RLS:

            def _bypass(_sess: object, _trans: object, connection: Connection) -> None:
                connection.execute(text("SET LOCAL row_security = off"))

            event.listen(session.sync_session, "after_begin", _bypass)
            try:
                await session.execute(text("SELECT 1"))
                yield session
            finally:
                event.remove(session.sync_session, "after_begin", _bypass)
        else:
            tenant_id = settings.TENANT_ID

            def _set_rls(_sess: object, _trans: object, connection: Connection) -> None:
                apply_rls_context(connection, tenant_id=tenant_id)

            event.listen(session.sync_session, "after_begin", _set_rls)
            try:
                # Start a transaction so after_begin fires and GUC/ROLE are set
                await session.execute(text("SELECT 1"))
                yield session
            finally:
                event.remove(session.sync_session, "after_begin", _set_rls)


SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


async def get_current_user(
    request: Request, session: SessionDep, creds: TokenDep
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = creds.credentials
    try:
        payload = security.decode_token(token)
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if token_data.type != security.TOKEN_TYPE_ACCESS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    if not token_data.sub or not token_data.jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    if get_token_store().is_access_blacklisted(
        token_data.jti,
        tenant_id=token_data.tenant_id or settings.TENANT_ID,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    if token_data.tenant_id and token_data.tenant_id != str(settings.TENANT_ID):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant mismatch",
        )
    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = await crud.get_user_by_id(session=session, user_id=user_id)
    if not user:
        # Prefer 404 over 403 so cross-tenant probes cannot confirm foreign IDs
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # JWT permissions claim — O(1) require_permission; no DB matrix lookup
    request.state.permissions = frozenset(token_data.permissions or [])

    # Future RLS: bind actor identity into the current transaction
    await set_user_gucs_async(
        session,
        user_id=user.id,
        role=role_str(user.role),
    )
    # Request-scoped contextvars for Audit Trail / structlog (JWT lifecycle)
    set_tenant_id(user.tenant_id)
    set_user_id(user.id)
    set_user_role(role_str(user.role))
    structlog.contextvars.bind_contextvars(
        tenant_id=str(user.tenant_id),
        user_id=str(user.id),
        user_role=role_str(user.role),
    )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if role_str(current_user.role) != UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def require_permission(permission: str) -> Callable[..., User]:
    def _checker(request: Request, current_user: CurrentUser) -> User:
        permissions: Collection[str] = getattr(
            request.state, "permissions", frozenset()
        )
        if not has_permission(permissions, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _checker

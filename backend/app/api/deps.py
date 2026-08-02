import uuid
from collections.abc import Callable, Generator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlmodel import Session

from app.auth.permissions import has_permission
from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.core.token_store import get_token_store
from app.models import TokenPayload, User, UserRole, role_str

bearer_scheme = HTTPBearer(auto_error=False)


def set_tenant_guc(connection: Connection, tenant_id: uuid.UUID | str) -> None:
    """Inject tenant id into PostgreSQL session for RLS (transaction-local)."""
    connection.execute(
        text("SELECT set_config('app.current_tenant', :tenant, true)"),
        {"tenant": str(tenant_id)},
    )


def apply_rls_context(
    connection: Connection, *, tenant_id: uuid.UUID | str | None = None
) -> None:
    """
    Bind the session to the non-BYPASSRLS app role and set tenant GUC.

    Superusers ignore FORCE RLS; SET LOCAL ROLE hirerank_app is required for
    policies to take effect when the login role is postgres/owner.

    Always re-enable row_security first: a pooled connection may still have
    session-level `row_security=off` from seed/bypass helpers (pool pollution).
    """
    connection.execute(text("SET row_security = on"))
    role = settings.RLS_APP_ROLE
    connection.execute(text(f"SET LOCAL ROLE {role}"))
    set_tenant_guc(connection, tenant_id or settings.TENANT_ID)


def get_db() -> Generator[Session]:
    with Session(engine) as session:
        if settings.BYPASS_RLS:

            def _bypass(_sess: Session, _trans: object, connection: Connection) -> None:
                connection.execute(text("SET LOCAL row_security = off"))

            event.listen(session, "after_begin", _bypass)
            try:
                session.execute(text("SELECT 1"))
                yield session
            finally:
                event.remove(session, "after_begin", _bypass)
        else:
            tenant_id = settings.TENANT_ID

            def _set_rls(
                _sess: Session, _trans: object, connection: Connection
            ) -> None:
                apply_rls_context(connection, tenant_id=tenant_id)

            event.listen(session, "after_begin", _set_rls)
            try:
                # Start a transaction so after_begin fires and GUC/ROLE are set
                session.execute(text("SELECT 1"))
                yield session
            finally:
                event.remove(session, "after_begin", _set_rls)


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def get_current_user(session: SessionDep, creds: TokenDep) -> User:
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
    if get_token_store().is_access_blacklisted(token_data.jti):
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
    user = session.get(User, user_id)
    if not user:
        # Prefer 404 over 403 so cross-tenant probes cannot confirm foreign IDs
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if role_str(current_user.role) != UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def require_permission(permission: str) -> Callable[..., User]:
    def _checker(current_user: CurrentUser) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _checker

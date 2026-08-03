"""ASGI middleware: bind IP/UA + default tenant into contextvars per request."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.audit.emit import sanitize_ip
from app.core.config import settings
from app.core.context import (
    clear_security_context,
    set_request_meta,
    set_tenant_id,
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Application vs Audit separation helper:
    - Binds request network meta for Audit Trail
    - Seeds tenant_id for Core single-tenant deploy
    - Clears contextvars after the response (no worker leak)
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        clear_security_context()
        set_tenant_id(settings.TENANT_ID)
        set_request_meta(
            {
                "ip": sanitize_ip(request.client.host if request.client else None),
                "user_agent": request.headers.get("user-agent"),
                "path": request.url.path,
                "method": request.method,
            }
        )
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            tenant_id=str(settings.TENANT_ID),
            path=request.url.path,
            method=request.method,
        )
        try:
            return await call_next(request)
        finally:
            structlog.contextvars.clear_contextvars()
            clear_security_context()

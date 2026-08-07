"""Dashboard aggregates (UC-05).

Rate-limited: multi-table COUNT joins under RLS are expensive (Attack 4).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.ats import dashboard as dashboard_svc
from app.auth.rate_limit import enforce_dashboard_rate_limit
from app.auth.request_meta import client_ip
from app.schemas.ats import (
    AdminDashboard,
    CandidateDashboard,
    HRDashboard,
    ManagerDashboard,
)

router = APIRouter(tags=["Dashboard"])


@router.get(
    "/dashboard",
    response_model=AdminDashboard | HRDashboard | ManagerDashboard | CandidateDashboard,
)
async def get_dashboard(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.read")),
) -> AdminDashboard | HRDashboard | ManagerDashboard | CandidateDashboard:
    enforce_dashboard_rate_limit(user_id=current_user.id, ip=client_ip(request))
    return await dashboard_svc.build_dashboard(session=session, user=current_user)

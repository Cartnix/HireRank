"""Vacancy CRUD routes (UC-03)."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.ats import candidates as candidate_svc
from app.ats import vacancies as vacancy_svc
from app.audit.emit import emit_auth_audit
from app.audit.schemas import AuditAction
from app.models import VacancyStatus
from app.schemas.ats import (
    ApplicationPublic,
    ApplyToVacancyRequest,
    CreateVacancyRequest,
    PagedVacancyResponse,
    UpdateVacancyRequest,
    VacancyPublic,
)

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


@router.post(
    "/{vacancy_id}/applications",
    response_model=ApplicationPublic,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_vacancy(
    *,
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: CurrentUser,
    vacancy_id: uuid.UUID,
    body: ApplyToVacancyRequest,
    _: Any = Depends(require_permission("application.apply")),
) -> ApplicationPublic:
    _ = body
    try:
        application = await candidate_svc.apply_to_vacancy(
            session=session, user=current_user, vacancy_id=vacancy_id
        )
    except HTTPException as exc:
        if (
            exc.status_code == status.HTTP_409_CONFLICT
            and exc.detail == "Candidate already applied to this vacancy"
        ):
            await emit_auth_audit(
                request=request,
                background_tasks=None,
                action=AuditAction.APPLICATION_DUPLICATE,
                tenant_id=current_user.tenant_id,
                user_id=current_user.id,
                entity_id=vacancy_id,
                entity_type="vacancy",
                metadata={"detail": "duplicate application attempt"},
                force_sync=True,
            )
        raise
    await emit_auth_audit(
        request=request,
        background_tasks=background_tasks,
        action=AuditAction.APPLICATION_CREATED,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        entity_id=application.id,
        entity_type="application",
        metadata={"detail": f"vacancy_id={vacancy_id}"},
    )
    return ApplicationPublic.model_validate(application)


@router.get("/", response_model=PagedVacancyResponse)
async def list_vacancies(
    session: SessionDep,
    current_user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.read")),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: VacancyStatus | None = Query(None, alias="status"),
    search: str | None = None,
) -> PagedVacancyResponse:
    if current_user.role == "candidate":
        status_filter = VacancyStatus.OPEN
    rows, pagination = await vacancy_svc.list_vacancies(
        session=session,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search=search,
    )
    items = [
        await vacancy_svc.to_public(
            session, v, include_assigned=current_user.role != "candidate"
        )
        for v in rows
    ]
    return PagedVacancyResponse(items=items, pagination=pagination)


@router.post(
    "/",
    response_model=VacancyPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("vacancy.create"))],
)
async def create_vacancy(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    body: CreateVacancyRequest,
) -> VacancyPublic:
    vacancy = await vacancy_svc.create_vacancy(
        session=session, body=body, created_by=current_user.id
    )
    return await vacancy_svc.to_public(session, vacancy)


@router.get("/{vacancy_id}", response_model=VacancyPublic)
async def get_vacancy(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    vacancy_id: uuid.UUID,
    _: Any = Depends(require_permission("vacancy.read")),
) -> VacancyPublic:
    _ = current_user
    vacancy = await vacancy_svc.get_vacancy(session=session, vacancy_id=vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    if current_user.role == "candidate" and vacancy.status != VacancyStatus.OPEN:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return await vacancy_svc.to_public(
        session, vacancy, include_assigned=current_user.role != "candidate"
    )


@router.patch(
    "/{vacancy_id}",
    response_model=VacancyPublic,
    dependencies=[Depends(require_permission("vacancy.update"))],
)
async def update_vacancy(
    *,
    session: SessionDep,
    vacancy_id: uuid.UUID,
    body: UpdateVacancyRequest,
) -> VacancyPublic:
    vacancy = await vacancy_svc.get_vacancy(session=session, vacancy_id=vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    vacancy = await vacancy_svc.update_vacancy(
        session=session, vacancy=vacancy, body=body
    )
    return await vacancy_svc.to_public(session, vacancy)


@router.delete(
    "/{vacancy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=[Depends(require_permission("vacancy.delete"))],
)
async def delete_vacancy(*, session: SessionDep, vacancy_id: uuid.UUID) -> Response:
    vacancy = await vacancy_svc.get_vacancy(session=session, vacancy_id=vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    await vacancy_svc.delete_vacancy(session=session, vacancy=vacancy)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

"""Vacancy CRUD routes (UC-03)."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import CurrentUser, SessionDep, require_permission
from app.ats import vacancies as vacancy_svc
from app.models import VacancyStatus
from app.schemas.ats import (
    CreateVacancyRequest,
    PagedVacancyResponse,
    UpdateVacancyRequest,
    VacancyPublic,
)

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


@router.get("/", response_model=PagedVacancyResponse)
async def list_vacancies(
    session: SessionDep,
    _user: CurrentUser,
    _: Any = Depends(require_permission("vacancy.read")),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: VacancyStatus | None = Query(None, alias="status"),
    search: str | None = None,
) -> PagedVacancyResponse:
    rows, pagination = await vacancy_svc.list_vacancies(
        session=session,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search=search,
    )
    items = [await vacancy_svc.to_public(session, v) for v in rows]
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
    return await vacancy_svc.to_public(session, vacancy)


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

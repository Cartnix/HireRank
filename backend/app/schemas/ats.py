"""ATS API request/response schemas (OpenAPI-aligned)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models import CandidateStatus, VacancyStatus


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class CreateVacancyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    status: VacancyStatus = VacancyStatus.DRAFT
    department: str | None = Field(default=None, max_length=255)
    description: str | None = None
    requirements: list[str] = Field(default_factory=list)


class UpdateVacancyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    status: VacancyStatus | None = None
    department: str | None = Field(default=None, max_length=255)
    description: str | None = None
    requirements: list[str] | None = None


class PipelineStagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_name: str
    sort_order: int


class VacancyPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    department: str | None = None
    description: str | None = None
    requirements: list[Any] = Field(default_factory=list)
    status: VacancyStatus
    created_by: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    assigned_candidate_ids: list[uuid.UUID] = Field(default_factory=list)
    stages: list[PipelineStagePublic] = Field(default_factory=list)


class PagedVacancyResponse(BaseModel):
    items: list[VacancyPublic]
    pagination: Pagination


class CreateCandidateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    questionnaire: dict[str, Any]
    email: str | None = Field(default=None, max_length=255)
    resume_url: str | None = None


class UpdateQuestionnaireRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    questionnaire: dict[str, Any]


class AssignCandidateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    vacancy_id: uuid.UUID


class CandidatePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID | None = None
    email: str | None = None
    status: CandidateStatus
    questionnaire: dict[str, Any] = Field(default_factory=dict)
    resume_url: str | None = None
    active_package_id: uuid.UUID | None = None
    assigned_vacancy_id: uuid.UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PagedCandidateResponse(BaseModel):
    items: list[CandidatePublic]
    pagination: Pagination


class ResumeUrlResponse(BaseModel):
    url: str
    expires_in: int = 900


class AdminDashboard(BaseModel):
    role: str = "administrator"
    total_candidates: int = 0
    unassigned_candidates: int = 0
    pending_hitl: int = 0
    total_vacancies: int = 0
    open_vacancies: int = 0
    total_users: int = 0
    unread_notifications: int = 0
    recent_pending_packages: list[dict[str, Any]] = Field(default_factory=list)


class HRDashboard(BaseModel):
    role: str = "hr"
    candidates_created_by_me: int = 0
    total_candidates: int = 0
    open_vacancies: int = 0
    unread_notifications: int = 0


class ManagerDashboard(BaseModel):
    role: str = "manager"
    assigned_candidates: int = 0
    pending_hitl: int = 0
    open_vacancies: int = 0
    unread_notifications: int = 0


class CandidateDashboard(BaseModel):
    role: str = "candidate"
    questionnaire_filled: bool = False
    status: CandidateStatus = CandidateStatus.UNASSIGNED
    assigned_vacancy: dict[str, Any] | None = None

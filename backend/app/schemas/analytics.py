"""Shared database-derived overview contract for production and development."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Distribution(BaseModel):
    stage: str
    count: int


class TrendPoint(BaseModel):
    date: str
    value: float


class RankedCandidate(BaseModel):
    id: uuid.UUID
    email: str | None = None
    name: str
    position: str
    stage: str
    rating: float


class ScheduledInterview(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    position: str
    stage: str
    scheduled_at: datetime
    duration_minutes: int


class DashboardAnalytics(BaseModel):
    active_jobs: int
    total_candidates: int
    todays_interviews: int
    avg_time_to_hire: float | None
    pipeline: list[Distribution]
    sources: list[Distribution]
    candidate_trend: list[TrendPoint]
    vacancy_trend: list[TrendPoint]
    interview_trend: list[TrendPoint]
    hire_trend: list[TrendPoint]
    top_candidates: list[RankedCandidate]
    upcoming_interviews: list[ScheduledInterview]


class InterviewInput(BaseModel):
    application_id: uuid.UUID
    interviewer_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int = Field(default=45, ge=5, le=480)


class ScorecardInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    notes: str | None = None

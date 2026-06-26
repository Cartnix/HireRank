"""Candidate schemas."""

from pydantic import BaseModel


class CandidateRead(BaseModel):
    id: str
    enterprise_id: str
    status: str
    assigned_vacancy_id: str | None = None
    created_at: str
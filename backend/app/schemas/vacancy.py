"""Vacancy schemas."""

from pydantic import BaseModel


class VacancyRead(BaseModel):
    id: str
    enterprise_id: str
    title: str
    status: str
    created_at: str
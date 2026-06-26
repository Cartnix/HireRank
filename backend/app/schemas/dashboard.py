"""Dashboard schemas."""

from pydantic import BaseModel


class DashboardRead(BaseModel):
    role: str
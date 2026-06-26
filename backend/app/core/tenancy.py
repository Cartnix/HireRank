"""Tenant context helpers."""

from contextvars import ContextVar


current_enterprise_id: ContextVar[str | None] = ContextVar("current_enterprise_id", default=None)


def set_current_enterprise_id(enterprise_id: str | None) -> None:
    current_enterprise_id.set(enterprise_id)


def get_current_enterprise_id() -> str | None:
    return current_enterprise_id.get()
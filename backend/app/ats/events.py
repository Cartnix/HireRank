"""In-memory / log stubs for ATS domain events (broker deferred to MS2)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime

import structlog

logger = structlog.get_logger()


@dataclass
class ResumeUploadedEvent:
    candidate_id: uuid.UUID
    tenant_id: uuid.UUID
    published_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class ApplicationCreatedEvent:
    application_id: uuid.UUID
    vacancy_id: uuid.UUID
    candidate_id: uuid.UUID
    tenant_id: uuid.UUID
    published_at: datetime = field(default_factory=lambda: datetime.now(UTC))


_PUBLISHED: list[ResumeUploadedEvent] = []
_APPLICATION_EVENTS: list[ApplicationCreatedEvent] = []


def clear_published_events() -> None:
    _PUBLISHED.clear()
    _APPLICATION_EVENTS.clear()


def published_events() -> list[ResumeUploadedEvent]:
    return list(_PUBLISHED)


def application_events() -> list[ApplicationCreatedEvent]:
    return list(_APPLICATION_EVENTS)


def publish_application_created(
    *,
    application_id: uuid.UUID,
    vacancy_id: uuid.UUID,
    candidate_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> ApplicationCreatedEvent:
    event = ApplicationCreatedEvent(
        application_id=application_id,
        vacancy_id=vacancy_id,
        candidate_id=candidate_id,
        tenant_id=tenant_id,
    )
    _APPLICATION_EVENTS.append(event)
    logger.info(
        "event.application.created",
        application_id=str(application_id),
        vacancy_id=str(vacancy_id),
        candidate_id=str(candidate_id),
        tenant_id=str(tenant_id),
    )
    return event


def publish_resume_uploaded(
    *, candidate_id: uuid.UUID, tenant_id: uuid.UUID
) -> ResumeUploadedEvent:
    event = ResumeUploadedEvent(candidate_id=candidate_id, tenant_id=tenant_id)
    _PUBLISHED.append(event)
    logger.info(
        "event.resume.uploaded",
        candidate_id=str(candidate_id),
        tenant_id=str(tenant_id),
    )
    return event

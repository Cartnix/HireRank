"""In-memory / log stub for resume.uploaded (broker deferred to MS2)."""

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


_PUBLISHED: list[ResumeUploadedEvent] = []


def clear_published_events() -> None:
    _PUBLISHED.clear()


def published_events() -> list[ResumeUploadedEvent]:
    return list(_PUBLISHED)


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

"""RLS-gated resume URL stub (no real S3 in MVP)."""

from __future__ import annotations

import uuid
from urllib.parse import quote

from app.core.config import settings
from app.models import Candidate


def build_presigned_resume_url(candidate: Candidate, *, expires_in: int = 900) -> str:
    """
    Return a stub URL only after the caller loaded ``candidate`` under an
    RLS-scoped session (row invisible → 404 before this is called).
    """
    key = candidate.resume_url or f"resumes/{candidate.id}"
    return (
        f"https://presign.local/{settings.TENANT_ID}/"
        f"{quote(key, safe='')}?exp={expires_in}&cid={candidate.id}"
    )


def opaque_object_key(*, candidate_id: uuid.UUID) -> str:
    return f"tenants/{settings.TENANT_ID}/candidates/{candidate_id}/resume"

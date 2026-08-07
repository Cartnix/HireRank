"""Consent validation & persistence (RK PD Law §1.4, GDPR Art.6–7 / Art.17)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import (
    ConsentGrant,
    ConsentPublic,
    ConsentPurpose,
    OAuthIdentity,
    User,
    UserConsent,
    UserPublic,
)


def validate_consent_grant(consent: ConsentGrant) -> None:
    if consent.account_processing is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_processing consent is required",
        )
    if consent.cross_border and not consent.cross_border_countries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="cross_border_countries required when cross_border is true",
        )
    if not consent.cross_border and consent.cross_border_countries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="cross_border_countries must be empty when cross_border is false",
        )


def _countries_json(countries: list[str]) -> str | None:
    if not countries:
        return None
    return json.dumps(countries)


def _parse_countries(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if isinstance(data, list):
        return [str(x) for x in data]
    return []


def _ttl_days(purpose: ConsentPurpose) -> int:
    if purpose == ConsentPurpose.TALENT_POOL:
        return settings.CONSENT_TALENT_POOL_TTL_DAYS
    if purpose == ConsentPurpose.CROSS_BORDER:
        return settings.CONSENT_CROSS_BORDER_TTL_DAYS
    return settings.CONSENT_ACCOUNT_TTL_DAYS


def _expiry_for(
    purpose: ConsentPurpose, *, now: datetime, granted: bool
) -> datetime | None:
    if not granted:
        return None
    return now + timedelta(days=_ttl_days(purpose))


def _is_active_grant(row: UserConsent | None, *, now: datetime) -> bool:
    if row is None or not row.granted:
        return False
    if row.expires_at is not None:
        expires = row.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        if expires <= now:
            return False
    return True


async def record_consents(
    session: AsyncSession,
    *,
    user: User,
    consent: ConsentGrant,
) -> None:
    """Upsert the three separated consent purposes for a user (with TTL)."""
    validate_consent_grant(consent)
    now = datetime.now(UTC)
    grants: list[tuple[ConsentPurpose, bool, list[str]]] = [
        (ConsentPurpose.ACCOUNT_PROCESSING, consent.account_processing, []),
        (ConsentPurpose.TALENT_POOL, consent.talent_pool, []),
        (
            ConsentPurpose.CROSS_BORDER,
            consent.cross_border,
            list(consent.cross_border_countries),
        ),
    ]
    for purpose, granted, countries in grants:
        existing = (
            await session.exec(
                select(UserConsent).where(
                    UserConsent.user_id == user.id,
                    UserConsent.purpose == purpose.value,
                )
            )
        ).first()
        expires_at = _expiry_for(purpose, now=now, granted=granted)
        if existing:
            was_granted = existing.granted
            existing.granted = granted
            existing.countries = _countries_json(countries) if granted else None
            existing.recorded_at = now
            existing.expires_at = expires_at
            if granted:
                existing.revoked_at = None
            elif was_granted:
                existing.revoked_at = now
            session.add(existing)
        else:
            session.add(
                UserConsent(
                    user_id=user.id,
                    tenant_id=user.tenant_id,
                    purpose=purpose.value,
                    granted=granted,
                    countries=_countries_json(countries) if granted else None,
                    recorded_at=now,
                    revoked_at=None,
                    expires_at=expires_at,
                )
            )
    await session.commit()


async def get_consent_grant(
    session: AsyncSession, *, user_id: uuid.UUID
) -> ConsentPublic:
    now = datetime.now(UTC)
    rows = (
        await session.exec(select(UserConsent).where(UserConsent.user_id == user_id))
    ).all()
    by_purpose = {r.purpose: r for r in rows}
    ap = by_purpose.get(ConsentPurpose.ACCOUNT_PROCESSING.value)
    tp = by_purpose.get(ConsentPurpose.TALENT_POOL.value)
    cb = by_purpose.get(ConsentPurpose.CROSS_BORDER.value)
    return ConsentPublic(
        account_processing=_is_active_grant(ap, now=now),
        talent_pool=_is_active_grant(tp, now=now),
        cross_border=_is_active_grant(cb, now=now),
        cross_border_countries=_parse_countries(cb.countries if cb else None)
        if _is_active_grant(cb, now=now)
        else [],
    )


async def account_consent_refresh_required(
    session: AsyncSession, *, user_id: uuid.UUID
) -> bool:
    grant = await get_consent_grant(session, user_id=user_id)
    return grant.account_processing is not True


def legal_acceptance_required(user: User) -> bool:
    return user.legal_policy_version != settings.LEGAL_POLICY_VERSION


async def build_user_public(session: AsyncSession, user: User) -> UserPublic:
    consent_refresh = await account_consent_refresh_required(session, user_id=user.id)
    legal_required = legal_acceptance_required(user)
    return UserPublic(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name,
        tenant_id=user.tenant_id,
        created_at=user.created_at,
        legal_policy_version=user.legal_policy_version,
        legal_accepted_at=user.legal_accepted_at,
        legal_acceptance_required=legal_required,
        consent_refresh_required=consent_refresh,
        current_legal_policy_version=settings.LEGAL_POLICY_VERSION,
    )


def stamp_legal_acceptance(user: User) -> None:
    now = datetime.now(UTC)
    user.legal_policy_version = settings.LEGAL_POLICY_VERSION
    user.legal_accepted_at = now


async def revoke_all_consents(session: AsyncSession, *, user_id: uuid.UUID) -> None:
    now = datetime.now(UTC)
    rows = (
        await session.exec(select(UserConsent).where(UserConsent.user_id == user_id))
    ).all()
    for row in rows:
        row.granted = False
        row.revoked_at = now
        row.countries = None
        row.expires_at = None
        session.add(row)
    await session.commit()


async def anonymize_user_for_erasure(session: AsyncSession, *, user: User) -> None:
    """Hard anonymize auth identity (GDPR Art.17 / RK §3.3) within auth module."""
    await revoke_all_consents(session, user_id=user.id)
    identities = (
        await session.exec(
            select(OAuthIdentity).where(OAuthIdentity.user_id == user.id)
        )
    ).all()
    for identity in identities:
        await session.delete(identity)
    user.email = f"deleted-{user.id}@invalid.local"
    user.first_name = None
    user.last_name = None
    user.hashed_password = None
    user.is_active = False
    user.legal_policy_version = None
    user.legal_accepted_at = None
    session.add(user)
    await session.commit()
    await session.refresh(user)

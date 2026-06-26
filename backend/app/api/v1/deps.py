"""Shared API dependencies."""

from collections.abc import Generator

from sqlalchemy.orm import Session

from app.core.security import SupabaseUserClaims, get_current_supabase_user
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user() -> SupabaseUserClaims:
    return get_current_supabase_user()
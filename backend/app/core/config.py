"""Application settings."""

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic.aliases import AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


load_dotenv(os.getenv("ENV_FILE", ".env"))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=os.getenv("ENV_FILE", ".env"), env_file_encoding="utf-8", extra="ignore")

    app_name: str = "HireAI API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        default="sqlite:///./hireai.db",
        validation_alias=AliasChoices("DATABASE_URL", "SUPABASE_DATABASE_URL"),
    )
    supabase_url: str | None = Field(default=None, validation_alias=AliasChoices("SUPABASE_URL"))
    supabase_anon_key: str | None = Field(default=None, validation_alias=AliasChoices("SUPABASE_ANON_KEY"))
    supabase_service_role_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY"),
    )
    supabase_jwt_secret: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET", "JWT_SECRET"),
    )
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_issuer: str | None = Field(default=None, validation_alias=AliasChoices("SUPABASE_JWT_ISSUER"))
    ai_model_name: str = "qwen2.5"


@lru_cache
def get_settings() -> Settings:
    return Settings()
import secrets
import uuid
import warnings
from typing import Annotated, Any, Literal, Self

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

# Stable default tenant for Core / self-hosted (hidden multi-tenancy)
DEFAULT_TENANT_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    FRONTEND_HOST: str = "http://localhost:3000"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_POOL_MODE: Literal["queue", "null"] = "queue"
    SQLALCHEMY_POOL_SIZE: int = 20
    SQLALCHEMY_MAX_OVERFLOW: int = 10
    SQLALCHEMY_POOL_RECYCLE: int = 1800

    # Hidden multi-tenancy (Core): single enterprise per deploy
    TENANT_ID: uuid.UUID = DEFAULT_TENANT_ID
    TENANT_SLUG: str = "default"
    TENANT_NAME: str = "Default"
    # When True, DB sessions skip SET LOCAL / use row_security=off (migrations, seed)
    BYPASS_RLS: bool = False
    # Non-BYPASSRLS role; get_db does SET LOCAL ROLE so FORCE RLS actually applies
    RLS_APP_ROLE: str = "hirerank_app"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    # memory | redis — Core default is memory (zero-ops self-host);
    # set redis for multi-replica Enterprise / SaaS
    TOKEN_STORE: Literal["memory", "redis"] = "memory"
    # Soft-revoke window after refresh rotation (parallel mobile retries)
    REFRESH_TOKEN_GRACE_SECONDS: int = 20

    # Cookie session (issue #31). Prefer __Host- names only when COOKIE_SECURE
    # and same-host deploy; local HTTP uses non-__Host- names.
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    AUTH_COOKIE_ACCESS_NAME: str = "access_token"
    AUTH_COOKIE_REFRESH_NAME: str = "refresh_token"
    AUTH_COOKIE_CSRF_NAME: str = "csrf_token"
    # When True and COOKIE_SECURE, use __Host- prefixed cookie names
    AUTH_COOKIE_HOST_PREFIX: bool = False

    # Social OAuth (identity only; session is first-party JWT cookies)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = ""
    # Fernet key (url-safe base64) or empty → derived from SECRET_KEY
    OAUTH_TOKEN_ENCRYPTION_KEY: str = ""

    # RK legal docs version (must bump when Terms / PD policy change materially)
    LEGAL_POLICY_VERSION: str = "2026-08-06"
    # Consent TTL (RK: consent cannot be indefinite; equals purpose horizon)
    CONSENT_ACCOUNT_TTL_DAYS: int = 365
    CONSENT_TALENT_POOL_TTL_DAYS: int = 180
    CONSENT_CROSS_BORDER_TTL_DAYS: int = 365
    # Brute-force soft gate (per IP+email for login; per IP for check-email)
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 20
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300
    CHECK_EMAIL_RATE_LIMIT_ATTEMPTS: int = 60
    CHECK_EMAIL_RATE_LIMIT_WINDOW_SECONDS: int = 300

    @model_validator(mode="after")
    def _apply_cookie_defaults(self) -> Self:
        if self.ENVIRONMENT == "production":
            object.__setattr__(self, "COOKIE_SECURE", True)
            if self.AUTH_COOKIE_HOST_PREFIX:
                object.__setattr__(
                    self, "AUTH_COOKIE_ACCESS_NAME", "__Host-access_token"
                )
                object.__setattr__(
                    self, "AUTH_COOKIE_REFRESH_NAME", "__Host-refresh_token"
                )
        return self

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_ASYNC_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_URL(self) -> str:
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@mrx.com"
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore

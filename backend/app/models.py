import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import EmailStr, field_validator
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.audit.schemas import new_event_id


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


class UserRole(StrEnum):
    ADMINISTRATOR = "administrator"
    HR = "hr"
    MANAGER = "manager"
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"


REGISTERABLE_ROLES: frozenset[UserRole] = frozenset(
    {
        UserRole.HR,
        UserRole.MANAGER,
        UserRole.RECRUITER,
        UserRole.CANDIDATE,
    }
)


def role_str(role: UserRole | str) -> str:
    return role.value if isinstance(role, UserRole) else str(role)


class RolePermission(SQLModel, table=True):
    __tablename__ = "role_permission"

    role_id: uuid.UUID = Field(foreign_key="role.id", primary_key=True)
    permission_id: uuid.UUID = Field(foreign_key="permission.id", primary_key=True)


class Permission(SQLModel, table=True):
    __tablename__ = "permission"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=64, unique=True, index=True)
    roles: list["Role"] = Relationship(
        back_populates="permissions", link_model=RolePermission
    )


class Role(SQLModel, table=True):
    __tablename__ = "role"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=32, unique=True, index=True)
    permissions: list[Permission] = Relationship(
        back_populates="roles", link_model=RolePermission
    )


class Tenant(SQLModel, table=True):
    __tablename__ = "tenant"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: str = Field(max_length=64, unique=True, index=True)
    name: str = Field(max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    users: list["User"] = Relationship(back_populates="tenant")


class AuditLog(SQLModel, table=True):
    """Append-only auth/business audit row (schema audit, monthly partitions)."""

    __tablename__ = "audit_log"
    __table_args__ = {"schema": "audit"}

    id: uuid.UUID = Field(default_factory=new_event_id, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        primary_key=True,
        sa_type=DateTime(timezone=True),  # type: ignore
        nullable=False,
    )
    tenant_id: uuid.UUID = Field(nullable=False, index=True)
    user_id: uuid.UUID | None = Field(default=None, nullable=True)
    action: str = Field(max_length=100, nullable=False, index=True)
    entity_type: str = Field(default="user", max_length=100, nullable=False)
    entity_id: uuid.UUID | None = Field(default=None, nullable=True)
    ip_address: str | None = Field(
        default=None,
        sa_column=Column(INET, nullable=True),
    )
    user_agent: str | None = Field(default=None, nullable=True)
    # `metadata` is reserved on SQLAlchemy declarative; map to column "metadata"
    metadata_: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(
            "metadata",
            JSONB,
            nullable=False,
            server_default=text("'{}'::jsonb"),
        ),
    )


class UserBase(SQLModel):
    email: EmailStr = Field(max_length=255, index=True)
    is_active: bool = True
    role: UserRole = Field(
        default=UserRole.CANDIDATE,
        sa_column=Column(
            String(32),
            ForeignKey("role.name"),
            nullable=False,
            server_default="candidate",
        ),
    )
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)

    @field_validator("role", mode="before")
    @classmethod
    def _coerce_role(cls, value: object) -> object:
        if isinstance(value, str):
            return UserRole(value)
        return value


class UserCreate(UserBase):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    tenant_id: uuid.UUID | None = None


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None
    role: UserRole | None = None
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


class UserUpdateMe(SQLModel):
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    __tablename__ = "user"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_user_tenant_email"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenant.id", index=True, nullable=False)
    # Nullable for OAuth-only accounts (no local password)
    hashed_password: str | None = Field(default=None, nullable=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    tenant: Tenant | None = Relationship(back_populates="users")
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    oauth_identities: list["OAuthIdentity"] = Relationship(back_populates="user")

    @property
    def is_superuser(self) -> bool:
        return role_str(self.role) == UserRole.ADMINISTRATOR.value


class OAuthIdentity(SQLModel, table=True):
    """Immutable IdP subject ↔ HireRank user (email alone is not the join key)."""

    __tablename__ = "oauth_identity"
    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_subject", name="uq_oauth_provider_subject"
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    provider: str = Field(max_length=32, index=True)
    provider_subject: str = Field(max_length=255, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, ondelete="CASCADE")
    # Encrypted IdP refresh token (AES/Fernet) — never put in session JWT
    encrypted_refresh_token: str | None = Field(default=None, nullable=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user: User | None = Relationship(back_populates="oauth_identities")


class UserPublic(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPair(SQLModel):
    """Legacy / Swagger form login response (Bearer tooling)."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthSession(SQLModel):
    """Browser cookie session metadata — no usable JWTs in body."""

    token_type: str = "cookie"
    expires_in: int


class LoginRequest(SQLModel):
    email: EmailStr
    password: str


class RefreshRequest(SQLModel):
    refresh_token: str | None = None


class TokenPayload(SQLModel):
    sub: str | None = None
    role: str | None = None
    tenant_id: str | None = None
    jti: str | None = None
    type: str | None = None
    permissions: list[str] = []


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ErrorResponse(SQLModel):
    code: str
    message: str

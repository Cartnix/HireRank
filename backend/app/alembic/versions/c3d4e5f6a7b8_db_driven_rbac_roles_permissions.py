"""DB-driven RBAC: role, permission, role_permission + seed

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-03 13:00:00.000000

"""

from uuid import UUID

from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None

# Fixed UUIDs so seeds are idempotent across environments
ROLE_IDS = {
    "administrator": UUID("a0000000-0000-4000-8000-000000000001"),
    "hr": UUID("a0000000-0000-4000-8000-000000000002"),
    "manager": UUID("a0000000-0000-4000-8000-000000000003"),
    "recruiter": UUID("a0000000-0000-4000-8000-000000000004"),
    "candidate": UUID("a0000000-0000-4000-8000-000000000005"),
}

PERMISSION_IDS = {
    "admin.panel": UUID("b0000000-0000-4000-8000-000000000001"),
    "users.manage": UUID("b0000000-0000-4000-8000-000000000002"),
    "vacancy.create": UUID("b0000000-0000-4000-8000-000000000003"),
    "vacancy.update": UUID("b0000000-0000-4000-8000-000000000004"),
    "vacancy.delete": UUID("b0000000-0000-4000-8000-000000000005"),
    "vacancy.read": UUID("b0000000-0000-4000-8000-000000000006"),
    "resume.upload": UUID("b0000000-0000-4000-8000-000000000007"),
    "candidate.read": UUID("b0000000-0000-4000-8000-000000000008"),
}

ROLE_PERMISSIONS: dict[str, tuple[str, ...]] = {
    "administrator": (
        "admin.panel",
        "users.manage",
        "vacancy.create",
        "vacancy.update",
        "vacancy.delete",
        "vacancy.read",
        "resume.upload",
        "candidate.read",
    ),
    "hr": (
        "vacancy.create",
        "vacancy.update",
        "vacancy.delete",
        "vacancy.read",
        "resume.upload",
        "candidate.read",
    ),
    "manager": (
        "vacancy.read",
        "candidate.read",
    ),
    "recruiter": (
        "vacancy.read",
        "resume.upload",
    ),
    "candidate": (
        "vacancy.read",
        "resume.upload",
        "candidate.read",
    ),
}


def upgrade() -> None:
    op.create_table(
        "role",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_role_name"), "role", ["name"], unique=True)

    op.create_table(
        "permission",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_permission_name"), "permission", ["name"], unique=True)

    op.create_table(
        "role_permission",
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("permission_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permission.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"]),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    role_table = sa.table(
        "role",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
    )
    permission_table = sa.table(
        "permission",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
    )
    role_permission_table = sa.table(
        "role_permission",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )

    op.bulk_insert(
        role_table,
        [{"id": role_id, "name": name} for name, role_id in ROLE_IDS.items()],
    )
    op.bulk_insert(
        permission_table,
        [
            {"id": perm_id, "name": name}
            for name, perm_id in PERMISSION_IDS.items()
        ],
    )
    op.bulk_insert(
        role_permission_table,
        [
            {
                "role_id": ROLE_IDS[role_name],
                "permission_id": PERMISSION_IDS[perm_name],
            }
            for role_name, perms in ROLE_PERMISSIONS.items()
            for perm_name in perms
        ],
    )

    # Ensure any legacy / unexpected role strings are remapped before FK
    op.execute(
        sa.text(
            "UPDATE \"user\" SET role = 'candidate' "
            "WHERE role NOT IN ("
            "'administrator', 'hr', 'manager', 'recruiter', 'candidate')"
        )
    )
    op.create_foreign_key(
        "fk_user_role_role_name",
        "user",
        "role",
        ["role"],
        ["name"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_user_role_role_name", "user", type_="foreignkey")
    op.drop_table("role_permission")
    op.drop_index(op.f("ix_permission_name"), table_name="permission")
    op.drop_table("permission")
    op.drop_index(op.f("ix_role_name"), table_name="role")
    op.drop_table("role")

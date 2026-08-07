"""Seed ATS API permissions; align HR vacancy writes with UC-03 (admin-only)

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-08-06 21:00:00.000000
"""

from uuid import UUID

from alembic import op
import sqlalchemy as sa

revision = "e1f2a3b4c5d6"
down_revision = "d0e1f2a3b4c5"
branch_labels = None
depends_on = None

ROLE_IDS = {
    "administrator": UUID("a0000000-0000-4000-8000-000000000001"),
    "hr": UUID("a0000000-0000-4000-8000-000000000002"),
    "manager": UUID("a0000000-0000-4000-8000-000000000003"),
    "recruiter": UUID("a0000000-0000-4000-8000-000000000004"),
    "candidate": UUID("a0000000-0000-4000-8000-000000000005"),
}

NEW_PERMISSIONS = {
    "candidate.create": UUID("b0000000-0000-4000-8000-000000000009"),
    "candidate.update": UUID("b0000000-0000-4000-8000-00000000000a"),
    "candidate.delete": UUID("b0000000-0000-4000-8000-00000000000b"),
    "application.assign": UUID("b0000000-0000-4000-8000-00000000000c"),
    "application.read": UUID("b0000000-0000-4000-8000-00000000000d"),
}

# Existing vacancy write perms to revoke from HR
VACANCY_WRITE = (
    UUID("b0000000-0000-4000-8000-000000000003"),  # vacancy.create
    UUID("b0000000-0000-4000-8000-000000000004"),  # vacancy.update
    UUID("b0000000-0000-4000-8000-000000000005"),  # vacancy.delete
)


def upgrade() -> None:
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
        permission_table,
        [{"id": pid, "name": name} for name, pid in NEW_PERMISSIONS.items()],
    )

    # Revoke HR vacancy write grants (UC-03 / OpenAPI: administrator only)
    conn = op.get_bind()
    for perm_id in VACANCY_WRITE:
        conn.execute(
            sa.text(
                "DELETE FROM role_permission "
                "WHERE role_id = :role_id AND permission_id = :perm_id"
            ),
            {"role_id": ROLE_IDS["hr"], "perm_id": perm_id},
        )

    grants: list[tuple[str, str]] = [
        ("administrator", "candidate.create"),
        ("administrator", "candidate.update"),
        ("administrator", "candidate.delete"),
        ("administrator", "application.assign"),
        ("administrator", "application.read"),
        ("hr", "candidate.create"),
        ("hr", "candidate.update"),
        ("hr", "application.read"),
        ("manager", "application.read"),
    ]
    op.bulk_insert(
        role_permission_table,
        [
            {
                "role_id": ROLE_IDS[role],
                "permission_id": NEW_PERMISSIONS[perm],
            }
            for role, perm in grants
        ],
    )


def downgrade() -> None:
    conn = op.get_bind()
    for _name, pid in NEW_PERMISSIONS.items():
        conn.execute(
            sa.text("DELETE FROM role_permission WHERE permission_id = :pid"),
            {"pid": pid},
        )
        conn.execute(sa.text("DELETE FROM permission WHERE id = :pid"), {"pid": pid})

    role_permission_table = sa.table(
        "role_permission",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )
    op.bulk_insert(
        role_permission_table,
        [
            {"role_id": ROLE_IDS["hr"], "permission_id": perm_id}
            for perm_id in VACANCY_WRITE
        ],
    )

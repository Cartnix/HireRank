"""Auth RBAC + hidden multi-tenancy + RLS

Revision ID: a1b2c3d4e5f6
Revises: fe56fa70289e
Create Date: 2026-08-02 23:40:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None

DEFAULT_TENANT_ID = "00000000-0000-4000-8000-000000000001"


def upgrade() -> None:
    op.create_table(
        "tenant",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tenant_slug"), "tenant", ["slug"], unique=True)

    op.execute(
        sa.text(
            "INSERT INTO tenant (id, slug, name, created_at) "
            f"VALUES ('{DEFAULT_TENANT_ID}'::uuid, 'default', 'Default', NOW())"
        )
    )

    op.add_column("user", sa.Column("tenant_id", sa.Uuid(), nullable=True))
    op.add_column(
        "user",
        sa.Column(
            "role",
            sa.String(length=32),
            nullable=False,
            server_default="candidate",
        ),
    )
    op.add_column(
        "user", sa.Column("first_name", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "user", sa.Column("last_name", sa.String(length=255), nullable=True)
    )

    op.execute(
        sa.text(
            f"UPDATE \"user\" SET tenant_id = '{DEFAULT_TENANT_ID}'::uuid "
            "WHERE tenant_id IS NULL"
        )
    )
    op.execute(
        sa.text(
            "UPDATE \"user\" SET role = 'administrator' "
            "WHERE is_superuser IS TRUE"
        )
    )
    op.execute(
        sa.text(
            "UPDATE \"user\" SET first_name = split_part(full_name, ' ', 1), "
            "last_name = NULLIF(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '') "
            "WHERE full_name IS NOT NULL"
        )
    )

    op.alter_column("user", "tenant_id", nullable=False)
    op.create_foreign_key(
        "fk_user_tenant_id_tenant",
        "user",
        "tenant",
        ["tenant_id"],
        ["id"],
    )
    op.create_index(op.f("ix_user_tenant_id"), "user", ["tenant_id"], unique=False)

    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=False)
    op.create_unique_constraint(
        "uq_user_tenant_email", "user", ["tenant_id", "email"]
    )

    op.drop_column("user", "is_superuser")
    op.drop_column("user", "full_name")

    # RLS: hidden multi-tenancy defense-in-depth
    op.execute(sa.text('ALTER TABLE "user" ENABLE ROW LEVEL SECURITY'))
    op.execute(sa.text('ALTER TABLE "user" FORCE ROW LEVEL SECURITY'))
    op.execute(
        sa.text(
            'CREATE POLICY tenant_isolation_policy ON "user" '
            "AS PERMISSIVE FOR ALL TO PUBLIC "
            "USING (tenant_id::text = current_setting('app.current_tenant', true)) "
            "WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true))"
        )
    )
    op.execute(sa.text("ALTER TABLE tenant ENABLE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE tenant FORCE ROW LEVEL SECURITY"))
    op.execute(
        sa.text(
            "CREATE POLICY tenant_self_policy ON tenant "
            "AS PERMISSIVE FOR ALL TO PUBLIC "
            "USING (id::text = current_setting('app.current_tenant', true)) "
            "WITH CHECK (id::text = current_setting('app.current_tenant', true))"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP POLICY IF EXISTS tenant_self_policy ON tenant"))
    op.execute(sa.text("ALTER TABLE tenant NO FORCE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE tenant DISABLE ROW LEVEL SECURITY"))
    op.execute(sa.text('DROP POLICY IF EXISTS tenant_isolation_policy ON "user"'))
    op.execute(sa.text('ALTER TABLE "user" NO FORCE ROW LEVEL SECURITY'))
    op.execute(sa.text('ALTER TABLE "user" DISABLE ROW LEVEL SECURITY'))

    op.add_column(
        "user",
        sa.Column("full_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "user",
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.execute(
        sa.text(
            "UPDATE \"user\" SET is_superuser = TRUE "
            "WHERE role = 'administrator'"
        )
    )
    op.execute(
        sa.text(
            "UPDATE \"user\" SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))"
        )
    )

    op.drop_constraint("uq_user_tenant_email", "user", type_="unique")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.drop_constraint("fk_user_tenant_id_tenant", "user", type_="foreignkey")
    op.drop_index(op.f("ix_user_tenant_id"), table_name="user")
    op.drop_column("user", "last_name")
    op.drop_column("user", "first_name")
    op.drop_column("user", "role")
    op.drop_column("user", "tenant_id")

    op.drop_index(op.f("ix_tenant_slug"), table_name="tenant")
    op.drop_table("tenant")

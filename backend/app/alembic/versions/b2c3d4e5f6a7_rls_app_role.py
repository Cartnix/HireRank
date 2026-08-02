"""Create non-BYPASSRLS app role for PostgreSQL RLS

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-03 00:25:00.000000

Superusers and BYPASSRLS roles ignore FORCE RLS. Runtime sessions must
SET LOCAL ROLE to this app role so tenant policies actually apply.
"""

from alembic import op
import sqlalchemy as sa

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None

APP_ROLE = "hirerank_app"


def upgrade() -> None:
    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{APP_ROLE}') THEN
                    CREATE ROLE {APP_ROLE} NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE INHERIT;
                END IF;
            END
            $$;
            """
        )
    )
    # Login role (migration owner) must be allowed to SET ROLE hirerank_app
    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
                EXECUTE format(
                    'GRANT {APP_ROLE} TO %I',
                    current_user
                );
            EXCEPTION WHEN duplicate_object THEN
                NULL;
            END
            $$;
            """
        )
    )
    op.execute(sa.text(f"GRANT USAGE ON SCHEMA public TO {APP_ROLE}"))
    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {APP_ROLE}"
        )
    )
    op.execute(
        sa.text(
            f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {APP_ROLE}"
        )
    )
    op.execute(
        sa.text(
            f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {APP_ROLE}"
        )
    )
    op.execute(
        sa.text(
            f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
            f"GRANT USAGE, SELECT ON SEQUENCES TO {APP_ROLE}"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{APP_ROLE}') THEN
                    EXECUTE format('REVOKE {APP_ROLE} FROM %I', current_user);
                    DROP ROLE {APP_ROLE};
                END IF;
            EXCEPTION WHEN dependent_objects_still_exist THEN
                NULL;
            END
            $$;
            """
        )
    )

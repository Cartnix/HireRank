"""ATS domain schema + FORCE RLS; drop legacy item

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-08-06 20:00:00.000000

SoT names (vacancy/candidate) with normalized application, pipeline_stage,
interview, scorecard. Tenant isolation via app.current_tenant + hirerank_app.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.db.rls_policies import (
    tenant_isolation_on_application,
    tenant_isolation_on_candidate,
    tenant_isolation_on_interview,
    tenant_isolation_on_pipeline_stage,
    tenant_isolation_on_scorecard,
    tenant_isolation_on_vacancy,
)

revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None

APP_ROLE = "hirerank_app"

ATS_TABLES = (
    "vacancy",
    "pipeline_stage",
    "candidate",
    "application",
    "interview",
    "scorecard",
)

ATS_POLICIES = (
    tenant_isolation_on_vacancy,
    tenant_isolation_on_pipeline_stage,
    tenant_isolation_on_candidate,
    tenant_isolation_on_application,
    tenant_isolation_on_interview,
    tenant_isolation_on_scorecard,
)


def upgrade() -> None:
    op.create_table(
        "vacancy",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "requirements",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=50),
            server_default="draft",
            nullable=False,
        ),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vacancy_tenant_id", "vacancy", ["tenant_id"])
    op.create_index(
        "ix_vacancy_tenant_status", "vacancy", ["tenant_id", "status"]
    )
    op.create_index("ix_vacancy_created_by", "vacancy", ["created_by"])

    op.create_table(
        "pipeline_stage",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("vacancy_id", sa.Uuid(), nullable=False),
        sa.Column("stage_name", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.ForeignKeyConstraint(
            ["vacancy_id"], ["vacancy.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "vacancy_id", "sort_order", name="uq_pipeline_stage_order"
        ),
    )
    op.create_index(
        "ix_pipeline_stage_tenant_id", "pipeline_stage", ["tenant_id"]
    )
    op.create_index(
        "ix_pipeline_stage_tenant_vacancy",
        "pipeline_stage",
        ["tenant_id", "vacancy_id"],
    )
    op.create_index(
        "ix_pipeline_stage_vacancy_id", "pipeline_stage", ["vacancy_id"]
    )

    op.create_table(
        "candidate",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.String(length=50),
            server_default="unassigned",
            nullable=False,
        ),
        sa.Column(
            "questionnaire",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("resume_url", sa.Text(), nullable=True),
        sa.Column("active_package_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id", "email", name="uq_candidate_tenant_email"
        ),
    )
    op.create_index("ix_candidate_tenant_id", "candidate", ["tenant_id"])
    op.create_index(
        "ix_candidate_tenant_status", "candidate", ["tenant_id", "status"]
    )
    op.create_index("ix_candidate_user_id", "candidate", ["user_id"])
    op.create_index("ix_candidate_email", "candidate", ["email"])

    op.create_table(
        "application",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("vacancy_id", sa.Uuid(), nullable=False),
        sa.Column("candidate_id", sa.Uuid(), nullable=False),
        sa.Column("current_stage_id", sa.Uuid(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=50),
            server_default="active",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["candidate_id"], ["candidate.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["current_stage_id"], ["pipeline_stage.id"]
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.ForeignKeyConstraint(
            ["vacancy_id"], ["vacancy.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "vacancy_id",
            "candidate_id",
            name="uq_application_vacancy_candidate",
        ),
    )
    op.create_index("ix_application_tenant_id", "application", ["tenant_id"])
    op.create_index(
        "ix_application_tenant_vacancy",
        "application",
        ["tenant_id", "vacancy_id"],
    )
    op.create_index("ix_application_vacancy_id", "application", ["vacancy_id"])
    op.create_index(
        "ix_application_candidate_id", "application", ["candidate_id"]
    )
    op.create_index(
        "ix_application_current_stage_id", "application", ["current_stage_id"]
    )

    op.create_table(
        "interview",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("interviewer_id", sa.Uuid(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "duration_minutes",
            sa.Integer(),
            server_default="45",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["application.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["interviewer_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_interview_tenant_id", "interview", ["tenant_id"])
    op.create_index(
        "ix_interview_tenant_application",
        "interview",
        ["tenant_id", "application_id"],
    )
    op.create_index(
        "ix_interview_application_id", "interview", ["application_id"]
    )
    op.create_index(
        "ix_interview_interviewer_id", "interview", ["interviewer_id"]
    )

    op.create_table(
        "scorecard",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("interview_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5", name="ck_scorecard_rating_range"
        ),
        sa.ForeignKeyConstraint(
            ["interview_id"], ["interview.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scorecard_tenant_id", "scorecard", ["tenant_id"])
    op.create_index(
        "ix_scorecard_tenant_interview",
        "scorecard",
        ["tenant_id", "interview_id"],
    )
    op.create_index(
        "ix_scorecard_interview_id", "scorecard", ["interview_id"]
    )

    for table in ATS_TABLES:
        op.execute(sa.text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
        op.execute(sa.text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY"))

    for policy in ATS_POLICIES:
        for statement in policy.to_sql_statement_create_or_replace():
            op.execute(statement)

    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "
            f"{', '.join(ATS_TABLES)} TO {APP_ROLE}"
        )
    )

    op.drop_table("item")


def downgrade() -> None:
    for policy in ATS_POLICIES:
        for statement in policy.to_sql_statement_drop():
            op.execute(statement)

    op.execute(
        sa.text(
            f"REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "
            f"{', '.join(ATS_TABLES)} FROM {APP_ROLE}"
        )
    )

    op.drop_table("scorecard")
    op.drop_table("interview")
    op.drop_table("application")
    op.drop_table("candidate")
    op.drop_table("pipeline_stage")
    op.drop_table("vacancy")

    op.create_table(
        "item",
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["user.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        sa.text(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE item TO {APP_ROLE}"
        )
    )

"""Composite tenant FKs — block cross-tenant FK tree poisoning

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-08-06 20:30:00.000000

Postgres FK checks bypass RLS visibility. Composite (tenant_id, fk)
REFERENCES parent(tenant_id, id) enforces same-tenant graphs for
application.stage / interview.application / scorecard.interview.
"""

from alembic import op

revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Unique (tenant_id, id) targets for composite FKs
    op.create_unique_constraint("uq_vacancy_tenant_id", "vacancy", ["tenant_id", "id"])
    op.create_unique_constraint(
        "uq_pipeline_stage_tenant_id", "pipeline_stage", ["tenant_id", "id"]
    )
    op.create_unique_constraint(
        "uq_candidate_tenant_id", "candidate", ["tenant_id", "id"]
    )
    op.create_unique_constraint(
        "uq_application_tenant_id", "application", ["tenant_id", "id"]
    )
    op.create_unique_constraint(
        "uq_interview_tenant_id", "interview", ["tenant_id", "id"]
    )

    # Drop single-column FKs that allow cross-tenant linking
    op.drop_constraint(
        "pipeline_stage_vacancy_id_fkey", "pipeline_stage", type_="foreignkey"
    )
    op.drop_constraint(
        "application_vacancy_id_fkey", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "application_candidate_id_fkey", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "application_current_stage_id_fkey", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "interview_application_id_fkey", "interview", type_="foreignkey"
    )
    op.drop_constraint(
        "scorecard_interview_id_fkey", "scorecard", type_="foreignkey"
    )

    op.create_foreign_key(
        "fk_pipeline_stage_vacancy_tenant",
        "pipeline_stage",
        "vacancy",
        ["tenant_id", "vacancy_id"],
        ["tenant_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_application_vacancy_tenant",
        "application",
        "vacancy",
        ["tenant_id", "vacancy_id"],
        ["tenant_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_application_candidate_tenant",
        "application",
        "candidate",
        ["tenant_id", "candidate_id"],
        ["tenant_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_application_stage_tenant",
        "application",
        "pipeline_stage",
        ["tenant_id", "current_stage_id"],
        ["tenant_id", "id"],
    )
    op.create_foreign_key(
        "fk_interview_application_tenant",
        "interview",
        "application",
        ["tenant_id", "application_id"],
        ["tenant_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_scorecard_interview_tenant",
        "scorecard",
        "interview",
        ["tenant_id", "interview_id"],
        ["tenant_id", "id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_scorecard_interview_tenant", "scorecard", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_interview_application_tenant", "interview", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_application_stage_tenant", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_application_candidate_tenant", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_application_vacancy_tenant", "application", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_pipeline_stage_vacancy_tenant", "pipeline_stage", type_="foreignkey"
    )

    op.create_foreign_key(
        "scorecard_interview_id_fkey",
        "scorecard",
        "interview",
        ["interview_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "interview_application_id_fkey",
        "interview",
        "application",
        ["application_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "application_current_stage_id_fkey",
        "application",
        "pipeline_stage",
        ["current_stage_id"],
        ["id"],
    )
    op.create_foreign_key(
        "application_candidate_id_fkey",
        "application",
        "candidate",
        ["candidate_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "application_vacancy_id_fkey",
        "application",
        "vacancy",
        ["vacancy_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "pipeline_stage_vacancy_id_fkey",
        "pipeline_stage",
        "vacancy",
        ["vacancy_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint("uq_interview_tenant_id", "interview", type_="unique")
    op.drop_constraint("uq_application_tenant_id", "application", type_="unique")
    op.drop_constraint("uq_candidate_tenant_id", "candidate", type_="unique")
    op.drop_constraint("uq_pipeline_stage_tenant_id", "pipeline_stage", type_="unique")
    op.drop_constraint("uq_vacancy_tenant_id", "vacancy", type_="unique")

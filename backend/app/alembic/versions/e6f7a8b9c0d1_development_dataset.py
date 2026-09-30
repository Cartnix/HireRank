"""Development preview configuration (same schema in all databases)."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e6f7a8b9c0d1"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("development_dataset", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("config", postgresql.JSONB(), nullable=False))
    op.execute("REVOKE ALL ON development_dataset FROM PUBLIC, hirerank_app")


def downgrade():
    op.drop_table("development_dataset")

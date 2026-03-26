"""add new applicationstatus enum values

Revision ID: update_status_enum
Revises: add_explanation_col
Create Date: 2026-03-22

NOTE: The ALTER TYPE statements must be run manually before this migration:
    ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'recommended';
    ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'under_review';

PostgreSQL does not allow ADD VALUE inside a transaction, so Alembic
cannot run these automatically. Run them in psql or pgAdmin first,
then run alembic upgrade head.
"""
from alembic import op

revision = 'update_status_enum'
down_revision = 'add_explanation_col'
branch_labels = None
depends_on = None


def upgrade():
    # Enum values added manually via psql before running this migration.
    # This revision exists solely to keep the migration chain intact.
    pass


def downgrade():
    # PostgreSQL does not support removing enum values.
    pass
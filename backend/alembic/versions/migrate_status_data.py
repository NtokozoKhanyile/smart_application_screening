"""migrate application status data to new values

Revision ID: migrate_status_data
Revises: update_status_enum
Create Date: 2026-03-22

"""
from alembic import op

revision = 'migrate_status_data'
down_revision = 'update_status_enum'
branch_labels = None
depends_on = None


def upgrade():
    # Migrate existing rows to new status values
    op.execute("UPDATE applications SET status = 'recommended' WHERE status = 'screened'")
    op.execute("UPDATE applications SET status = 'under_review' WHERE status = 'pending'")


def downgrade():
    op.execute("UPDATE applications SET status = 'screened' WHERE status = 'recommended'")
    op.execute("UPDATE applications SET status = 'pending' WHERE status = 'under_review'")
    op.execute("UPDATE applications SET status = 'draft' WHERE status = 'submitted'")
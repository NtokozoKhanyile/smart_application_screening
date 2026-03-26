"""add explanation to screening_results

Revision ID: add_explanation_col
Revises: 
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_explanation_col'
down_revision = 'a9e73ea5d1b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'screening_results',
        sa.Column('explanation', sa.Text(), nullable=True)
    )


def downgrade():
    op.drop_column('screening_results', 'explanation')
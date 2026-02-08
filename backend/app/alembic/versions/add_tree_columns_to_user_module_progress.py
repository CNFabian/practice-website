"""add tree columns to user_module_progress

Revision ID: a1b2c3d4e5f6
Revises: 79ff08d8abcb
Create Date: 2026-02-06

Adds Grow Your Nest tree state columns to user_module_progress:
- tree_growth_points, tree_current_stage, tree_completed, tree_completed_at
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "79ff08d8abcb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_module_progress",
        sa.Column("tree_growth_points", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "user_module_progress",
        sa.Column("tree_current_stage", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "user_module_progress",
        sa.Column("tree_completed", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "user_module_progress",
        sa.Column("tree_completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_module_progress", "tree_completed_at")
    op.drop_column("user_module_progress", "tree_completed")
    op.drop_column("user_module_progress", "tree_current_stage")
    op.drop_column("user_module_progress", "tree_growth_points")

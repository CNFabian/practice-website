"""add coins_awarded_stages to user_module_progress

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-17

Adds coins_awarded_stages column to track the highest tree stage
that has already paid out coins (idempotency guard for stage-based
coin economy). Default 0 means no stages have been paid out yet.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6g7"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_module_progress",
        sa.Column("coins_awarded_stages", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("user_module_progress", "coins_awarded_stages")
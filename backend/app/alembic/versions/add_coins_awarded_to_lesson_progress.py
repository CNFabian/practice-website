"""add coins_awarded to user_lesson_progress

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-02-25

Adds coins_awarded boolean column to track whether lesson completion
coins have already been awarded, preventing double-awarding when a
user uncompletes and re-completes a lesson.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6g7h8"
down_revision = "b2c3d4e5f6g7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_lesson_progress",
        sa.Column("coins_awarded", sa.Boolean(), server_default="false", nullable=False),
    )
    # Backfill: mark coins as already awarded for any lesson that's already completed
    op.execute(
        "UPDATE user_lesson_progress SET coins_awarded = true WHERE status = 'completed'"
    )


def downgrade() -> None:
    op.drop_column("user_lesson_progress", "coins_awarded")
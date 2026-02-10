"""drop user email_verification_token and email_verification_expires_at

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-06

All users now verify email before sign-up via pending_email_verifications.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_token")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_expires_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

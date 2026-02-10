"""add pending_email_verifications table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-02-06

Table for verify-email-before-sign-up flow: stores code and verified_at per email.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pending_email_verifications",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("code_expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("verified_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pending_email_verifications_email"), "pending_email_verifications", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_pending_email_verifications_email"), table_name="pending_email_verifications")
    op.drop_table("pending_email_verifications")

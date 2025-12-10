"""sync user_onboarding columns

Revision ID: ef1eaa0defeb
Revises: 3a23cbd446f3
Create Date: 2025-09-23 15:57:16.188180

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ef1eaa0defeb"
down_revision = "3a23cbd446f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing = {c["name"] for c in insp.get_columns("user_onboarding")}

    def add(name, type_, **kwargs):
        if name not in existing:
            op.add_column("user_onboarding", sa.Column(name, type_, **kwargs))

    add("selected_avatar", sa.String(100), nullable=True)
    add("homebuying_timeline_months", sa.Integer(), nullable=True)
    add("has_realtor", sa.Boolean(), nullable=True, server_default=sa.text("false"))
    add(
        "has_loan_officer", sa.Boolean(), nullable=True, server_default=sa.text("false")
    )
    add("learning_style", sa.String(50), nullable=True)
    add("reward_interests", sa.JSON(), nullable=True)
    add("homebuying_stage", sa.String(50), nullable=True)
    add("budget_range", sa.String(50), nullable=True)
    add("target_location", sa.String(255), nullable=True)
    add("timeline_to_buy", sa.String(50), nullable=True)
    add("first_time_buyer", sa.Boolean(), nullable=True, server_default=sa.text("true"))
    add("credit_score_range", sa.String(50), nullable=True)
    add("completed_at", sa.TIMESTAMP(timezone=True), nullable=True)
    add("updated_at", sa.TIMESTAMP(timezone=True), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing = {c["name"] for c in insp.get_columns("user_onboarding")}
    for col in [
        "selected_avatar",
        "homebuying_timeline_months",
        "has_realtor",
        "has_loan_officer",
        "learning_style",
        "reward_interests",
        "homebuying_stage",
        "budget_range",
        "target_location",
        "timeline_to_buy",
        "first_time_buyer",
        "credit_score_range",
        "completed_at",
        "updated_at",
    ]:
        if col in existing:
            op.drop_column("user_onboarding", col)

"""Update onboarding process with new 5-step flow

Revision ID: update_onboarding_5step
Revises: ef1eaa0defeb
Create Date: 2025-01-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'update_onboarding_5step'
down_revision = 'ef1eaa0defeb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns for the 5-step onboarding process
    op.add_column('user_onboarding', sa.Column('wants_expert_contact', sa.String(length=20), nullable=True))
    op.add_column('user_onboarding', sa.Column('homeownership_timeline_months', sa.Integer(), nullable=True))
    op.add_column('user_onboarding', sa.Column('zipcode', sa.String(length=10), nullable=True))
    
    # Add comments to clarify the new step structure
    op.create_index('ix_user_onboarding_wants_expert_contact', 'user_onboarding', ['wants_expert_contact'])
    op.create_index('ix_user_onboarding_zipcode', 'user_onboarding', ['zipcode'])


def downgrade() -> None:
    # Remove the new columns
    op.drop_index('ix_user_onboarding_zipcode', table_name='user_onboarding')
    op.drop_index('ix_user_onboarding_wants_expert_contact', table_name='user_onboarding')
    op.drop_column('user_onboarding', 'zipcode')
    op.drop_column('user_onboarding', 'homeownership_timeline_months')
    op.drop_column('user_onboarding', 'wants_expert_contact')

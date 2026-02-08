"""enable_uuid_extension

Revision ID: 774f3ab6250e
Revises: populate_learning_data
Create Date: 2026-02-07 21:51:34.889924

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '774f3ab6250e'
down_revision = 'populate_learning_data'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')


def downgrade():
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp";')
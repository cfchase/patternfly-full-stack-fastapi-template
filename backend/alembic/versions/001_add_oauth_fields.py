"""Add OAuth provider fields to User model

Revision ID: 001
Revises:
Create Date: 2025-10-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make hashed_password nullable for OAuth users
    op.alter_column('user', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=True)

    # Add OAuth provider field
    op.add_column('user', sa.Column('oauth_provider', sa.String(length=50), nullable=True))

    # Add external ID field for OAuth provider's user ID
    op.add_column('user', sa.Column('external_id', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove OAuth fields
    op.drop_column('user', 'external_id')
    op.drop_column('user', 'oauth_provider')

    # Make hashed_password required again
    op.alter_column('user', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=False)

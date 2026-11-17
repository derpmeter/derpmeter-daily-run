"""Add deleted_at to character suggestion

Revision ID: 314cc56dd7ef
Revises: 203bb45fc9bc
Create Date: 2025-12-19 11:38:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '314cc56dd7ef'
down_revision: Union[str, None] = '203bb45fc9bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('charactersuggestion', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('charactersuggestion', 'deleted_at')

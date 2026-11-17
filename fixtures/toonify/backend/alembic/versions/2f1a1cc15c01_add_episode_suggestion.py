"""add_episode_suggestion

Revision ID: 2f1a1cc15c01
Revises: a59e87f7dfc2
Create Date: 2025-12-24 18:40:11.308075

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '2f1a1cc15c01'
down_revision: Union[str, None] = 'a59e87f7dfc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('episodesuggestion',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('user_instruction', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('episodesuggestion')

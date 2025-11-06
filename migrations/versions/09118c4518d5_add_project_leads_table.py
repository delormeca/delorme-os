"""add_project_leads_table

Revision ID: 09118c4518d5
Revises: 7cc07beed57e
Create Date: 2025-11-05 19:20:17.025520

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '09118c4518d5'
down_revision: Union[str, None] = '7cc07beed57e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create project_leads table
    op.create_table(
        'projectlead',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_projectlead_id'), 'projectlead', ['id'], unique=False)
    op.create_index(op.f('ix_projectlead_email'), 'projectlead', ['email'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_projectlead_email'), table_name='projectlead')
    op.drop_index(op.f('ix_projectlead_id'), table_name='projectlead')

    # Drop table
    op.drop_table('projectlead')

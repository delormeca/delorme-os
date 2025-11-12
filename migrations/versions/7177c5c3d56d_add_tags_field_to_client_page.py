"""add tags field to client_page

Revision ID: 7177c5c3d56d
Revises: 8020ac743462
Create Date: 2025-11-11 22:10:18.062366

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7177c5c3d56d'
down_revision: Union[str, None] = '8020ac743462'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tags column as nullable JSONB field for PostgreSQL
    op.add_column(
        'client_page',
        sa.Column(
            'tags',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment='Array of tag strings for categorization and filtering'
        )
    )

    # Create GIN index for efficient tag queries in PostgreSQL
    # GIN index allows fast containment queries: WHERE tags @> '["tag1"]'
    op.create_index(
        'ix_client_page_tags_gin',
        'client_page',
        ['tags'],
        unique=False,
        postgresql_using='gin'
    )


def downgrade() -> None:
    # Drop GIN index first
    op.drop_index('ix_client_page_tags_gin', table_name='client_page')

    # Drop tags column
    op.drop_column('client_page', 'tags')

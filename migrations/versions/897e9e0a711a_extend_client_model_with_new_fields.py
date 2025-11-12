"""extend_client_model_with_new_fields

Revision ID: 897e9e0a711a
Revises: 09118c4518d5
Create Date: 2025-11-05 19:20:43.605624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '897e9e0a711a'
down_revision: Union[str, None] = '09118c4518d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to client table
    op.add_column('client', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('client', sa.Column('website_url', sa.String(), nullable=True))
    op.add_column('client', sa.Column('sitemap_url', sa.String(), nullable=True))
    op.add_column('client', sa.Column('project_lead_id', sa.UUID(), nullable=True))
    op.add_column('client', sa.Column('logo_url', sa.String(), nullable=True))
    op.add_column('client', sa.Column('crawl_frequency', sa.String(), nullable=False, server_default='Manual Only'))
    op.add_column('client', sa.Column('status', sa.String(), nullable=False, server_default='Active'))
    op.add_column('client', sa.Column('page_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('client', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_client_project_lead_id',
        'client',
        'projectlead',
        ['project_lead_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Create indexes
    op.create_index(op.f('ix_client_status'), 'client', ['status'], unique=False)
    op.create_index(op.f('ix_client_project_lead_id'), 'client', ['project_lead_id'], unique=False)
    op.create_index(op.f('ix_client_name'), 'client', ['name'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_client_name'), table_name='client')
    op.drop_index(op.f('ix_client_project_lead_id'), table_name='client')
    op.drop_index(op.f('ix_client_status'), table_name='client')

    # Drop foreign key
    op.drop_constraint('fk_client_project_lead_id', 'client', type_='foreignkey')

    # Drop columns
    op.drop_column('client', 'updated_at')
    op.drop_column('client', 'page_count')
    op.drop_column('client', 'status')
    op.drop_column('client', 'crawl_frequency')
    op.drop_column('client', 'logo_url')
    op.drop_column('client', 'project_lead_id')
    op.drop_column('client', 'sitemap_url')
    op.drop_column('client', 'website_url')
    op.drop_column('client', 'description')

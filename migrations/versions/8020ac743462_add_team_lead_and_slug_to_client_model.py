"""add team_lead and slug to client model

Revision ID: 8020ac743462
Revises: 99898f8234b9
Create Date: 2025-11-11 17:00:35.349918

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8020ac743462'
down_revision: Union[str, None] = '99898f8234b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add team_lead column
    op.add_column('client', sa.Column('team_lead', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    # Add slug column as nullable first
    op.add_column('client', sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    # DATA MIGRATION: Generate slugs for existing clients
    connection = op.get_bind()
    clients = connection.execute(sa.text("SELECT id, name FROM client")).fetchall()

    import re
    for client_id, name in clients:
        # Generate slug from name
        slug = name.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')

        # Ensure uniqueness by appending counter if needed
        base_slug = slug
        counter = 1
        while True:
            existing = connection.execute(
                sa.text("SELECT id FROM client WHERE slug = :slug"),
                {"slug": slug}
            ).fetchone()
            if not existing:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        connection.execute(
            sa.text("UPDATE client SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": client_id}
        )

    # Now make slug non-nullable and add unique constraint
    op.alter_column('client', 'slug', nullable=False)
    op.create_index(op.f('ix_client_slug'), 'client', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_client_slug'), table_name='client')
    op.drop_column('client', 'team_lead')
    op.drop_column('client', 'slug')

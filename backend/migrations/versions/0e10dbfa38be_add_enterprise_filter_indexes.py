"""add enterprise filter indexes

Revision ID: 0e10dbfa38be
Revises: daa6f431baea
Create Date: 2026-05-04 13:48:00.977804

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0e10dbfa38be"
down_revision: Union[str, None] = "daa6f431baea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_enterprises_is_active",
        "enterprises",
        ["is_active"],
    )

    op.create_index(
        "ix_enterprises_created_at",
        "enterprises",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_enterprises_created_at", table_name="enterprises")
    op.drop_index("ix_enterprises_is_active", table_name="enterprises")
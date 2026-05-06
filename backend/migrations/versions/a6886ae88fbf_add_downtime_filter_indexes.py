"""add downtime filter indexes

Revision ID: a6886ae88fbf
Revises: 0e10dbfa38be
Create Date: 2026-05-04 18:30:52.719501

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a6886ae88fbf"
down_revision: Union[str, None] = "0e10dbfa38be"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_downtimes_equipment_id",
        "downtimes",
        ["equipment_id"],
    )

    op.create_index(
        "ix_downtimes_start_time",
        "downtimes",
        ["start_time"],
    )

    op.create_index(
        "ix_downtimes_created_at",
        "downtimes",
        ["created_at"],
    )

    op.create_index(
        "ix_downtimes_reason_category",
        "downtimes",
        ["reason_category"],
    )


def downgrade() -> None:
    op.drop_index("ix_downtimes_reason_category", table_name="downtimes")
    op.drop_index("ix_downtimes_created_at", table_name="downtimes")
    op.drop_index("ix_downtimes_start_time", table_name="downtimes")
    op.drop_index("ix_downtimes_equipment_id", table_name="downtimes")

"""add equipment filter indexes

Revision ID: 8a06d7398349
Revises: 1517a2c5b15e
Create Date: 2026-05-03 22:58:14.452119

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "8a06d7398349"
down_revision: Union[str, None] = "1517a2c5b15e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_equipment_enterprise_id",
        "equipment",
        ["enterprise_id"],
    )

    op.create_index(
        "ix_equipment_equipment_type_id",
        "equipment",
        ["equipment_type_id"],
    )

    op.create_index(
        "ix_equipment_created_at",
        "equipment",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_equipment_created_at", table_name="equipment")
    op.drop_index("ix_equipment_equipment_type_id", table_name="equipment")
    op.drop_index("ix_equipment_enterprise_id", table_name="equipment")

"""add user filter indexes

Revision ID: daa6f431baea
Revises: 8a06d7398349
Create Date: 2026-05-04 00:01:18.964234

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "daa6f431baea"
down_revision: Union[str, None] = "8a06d7398349"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_users_enterprise_id",
        "users",
        ["enterprise_id"],
    )

    op.create_index(
        "ix_users_role",
        "users",
        ["role"],
    )

    op.create_index(
        "ix_users_is_active",
        "users",
        ["is_active"],
    )

    op.create_index(
        "ix_users_created_at",
        "users",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_enterprise_id", table_name="users")

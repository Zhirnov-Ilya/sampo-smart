"""add hypothesis filter indexes

Revision ID: b9c2c339b9f2
Revises: a6886ae88fbf
Create Date: 2026-05-06 00:47:00.565315

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b9c2c339b9f2"
down_revision: Union[str, None] = "a6886ae88fbf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_hypotheses_status",
        "hypotheses",
        ["status"],
    )

    op.create_index(
        "ix_hypotheses_downtime_id",
        "hypotheses",
        ["downtime_id"],
    )

    op.create_index(
        "ix_hypotheses_created_at",
        "hypotheses",
        ["created_at"],
    )

    op.create_index(
        "ix_hypotheses_priority_score",
        "hypotheses",
        ["priority_score"],
    )


def downgrade() -> None:
    op.drop_index("ix_hypotheses_priority_score", table_name="hypotheses")
    op.drop_index("ix_hypotheses_created_at", table_name="hypotheses")
    op.drop_index("ix_hypotheses_downtime_id", table_name="hypotheses")
    op.drop_index("ix_hypotheses_status", table_name="hypotheses")

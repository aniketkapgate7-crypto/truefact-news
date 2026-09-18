"""add_editorial_review_fields

Revision ID: 31b4e80f2d9c
Revises: 20df757dd0e1
Create Date: 2026-08-27 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "31b4e80f2d9c"
down_revision: Union[str, Sequence[str], None] = "20df757dd0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("credibility_assessments", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "review_status",
                sa.String(length=50),
                server_default="automated",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "verdict",
                sa.String(length=50),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "reviewer_id",
                sa.String(length=100),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "reviewer_name",
                sa.String(length=255),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "claim",
                sa.String(length=500),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "claimant",
                sa.String(length=255),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "claim_date",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "conclusion",
                sa.Text(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "correction_summary",
                sa.Text(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "review_version",
                sa.Integer(),
                server_default="1",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "reviewed_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "review_published_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("credibility_assessments", schema=None) as batch_op:
        batch_op.drop_column("review_published_at")
        batch_op.drop_column("reviewed_at")
        batch_op.drop_column("review_version")
        batch_op.drop_column("correction_summary")
        batch_op.drop_column("conclusion")
        batch_op.drop_column("claim_date")
        batch_op.drop_column("claimant")
        batch_op.drop_column("claim")
        batch_op.drop_column("reviewer_name")
        batch_op.drop_column("reviewer_id")
        batch_op.drop_column("verdict")
        batch_op.drop_column("review_status")

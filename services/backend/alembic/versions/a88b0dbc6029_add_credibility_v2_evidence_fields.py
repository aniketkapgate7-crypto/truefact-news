"""Add Credibility V2 evidence fields.

Revision ID: a88b0dbc6029
Revises: ed255c0d953b
Create Date: 2026-08-19 18:23:46.531443
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a88b0dbc6029"
down_revision: Union[str, Sequence[str], None] = "ed255c0d953b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Credibility V2 evidence fields."""

    with op.batch_alter_table(
        "credibility_assessments",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "supporting_evidence_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "contradicting_evidence_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "independent_source_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "primary_source_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "is_evolving",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            )
        )

        batch_op.create_check_constraint(
            "ck_credibility_supporting_evidence_count",
            "supporting_evidence_count >= 0",
        )
        batch_op.create_check_constraint(
            "ck_credibility_contradicting_evidence_count",
            "contradicting_evidence_count >= 0",
        )
        batch_op.create_check_constraint(
            "ck_credibility_independent_source_count",
            "independent_source_count >= 0",
        )
        batch_op.create_check_constraint(
            "ck_credibility_primary_source_count",
            "primary_source_count >= 0",
        )


def downgrade() -> None:
    """Remove Credibility V2 evidence fields."""

    with op.batch_alter_table(
        "credibility_assessments",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_credibility_primary_source_count",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_credibility_independent_source_count",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_credibility_contradicting_evidence_count",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_credibility_supporting_evidence_count",
            type_="check",
        )

        batch_op.drop_column("is_evolving")
        batch_op.drop_column("primary_source_count")
        batch_op.drop_column("independent_source_count")
        batch_op.drop_column("contradicting_evidence_count")
        batch_op.drop_column("supporting_evidence_count")
        
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.news import NewsArticleModel


class CredibilityAssessmentModel(Base):
    __tablename__ = "credibility_assessments"

    __table_args__ = (
        CheckConstraint(
            "source_reliability_score BETWEEN 0 AND 100",
            name="ck_credibility_source_score",
        ),
        CheckConstraint(
            "evidence_quality_score BETWEEN 0 AND 100",
            name="ck_credibility_evidence_score",
        ),
        CheckConstraint(
            "corroboration_score BETWEEN 0 AND 100",
            name="ck_credibility_corroboration_score",
        ),
        CheckConstraint(
            "content_quality_score BETWEEN 0 AND 100",
            name="ck_credibility_content_score",
        ),
        CheckConstraint(
            "credibility_score BETWEEN 0 AND 100",
            name="ck_credibility_overall_score",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    news_article_id: Mapped[int] = mapped_column(
        ForeignKey(
            "news_articles.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    source_reliability_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    evidence_quality_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    corroboration_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    content_quality_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    credibility_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    method_version: Mapped[str] = mapped_column(
        String(50),
        default="rules-v1",
        nullable=False,
    )

    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    news_article: Mapped[NewsArticleModel] = relationship(
        back_populates="credibility_assessment",
    )

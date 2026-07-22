from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.credibility import CredibilityAssessmentModel
    from app.models.social_post import SocialPostModel


class NewsArticleModel(Base):
    __tablename__ = "news_articles"

    __table_args__ = (
        CheckConstraint(
            "evidence_score >= 0 AND evidence_score <= 100",
            name="ck_news_articles_evidence_score",
        ),
        CheckConstraint(
            "comment_count >= 0",
            name="ck_news_articles_comment_count",
        ),
        CheckConstraint(
            "repost_count >= 0",
            name="ck_news_articles_repost_count",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        index=True,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    source_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    source_url: Mapped[str] = mapped_column(
        String(2048),
        unique=True,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    region: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    evidence_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    comment_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    repost_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
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

    social_posts: Mapped[list[SocialPostModel]] = relationship(
        back_populates="news_article",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    credibility_assessment: Mapped[CredibilityAssessmentModel | None] = relationship(
        back_populates="news_article",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

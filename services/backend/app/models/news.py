from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class NewsArticleModel(Base):
    __tablename__ = "news_articles"

    __table_args__ = (
        CheckConstraint(
            "evidence_score BETWEEN 0 AND 100",
            name="ck_news_evidence_score",
        ),
        CheckConstraint(
            "comment_count >= 0",
            name="ck_news_comment_count",
        ),
        CheckConstraint(
            "repost_count >= 0",
            name="ck_news_repost_count",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        index=True,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    source_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    source_url: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
        unique=True,
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
        nullable=False,
        default=0,
        index=True,
    )

    comment_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    repost_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
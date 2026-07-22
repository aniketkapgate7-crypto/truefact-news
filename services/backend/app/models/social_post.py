from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy import (
    Enum as SqlEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.news import NewsArticleModel


class SocialPlatform(str, Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    X = "x"
    FACEBOOK = "facebook"
    REDDIT = "reddit"
    TIKTOK = "tiktok"
    OTHER = "other"


class SocialPostModel(Base):
    __tablename__ = "social_posts"

    __table_args__ = (
        UniqueConstraint(
            "platform",
            "external_post_id",
            name="uq_social_post_platform_external_id",
        ),
        CheckConstraint(
            "view_count >= 0",
            name="ck_social_posts_view_count",
        ),
        CheckConstraint(
            "like_count >= 0",
            name="ck_social_posts_like_count",
        ),
        CheckConstraint(
            "comment_count >= 0",
            name="ck_social_posts_comment_count",
        ),
        CheckConstraint(
            "repost_count >= 0",
            name="ck_social_posts_repost_count",
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
        nullable=False,
        index=True,
    )

    platform: Mapped[SocialPlatform] = mapped_column(
        SqlEnum(
            SocialPlatform,
            name="social_platform",
            native_enum=False,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        index=True,
    )

    external_post_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    post_url: Mapped[str] = mapped_column(
        String(2048),
        unique=True,
        nullable=False,
    )

    account_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    like_count: Mapped[int] = mapped_column(
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

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    news_article: Mapped["NewsArticleModel"] = relationship(
        back_populates="social_posts",
    )

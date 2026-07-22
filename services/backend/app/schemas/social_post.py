from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models.social_post import SocialPlatform


class SocialPostBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    platform: SocialPlatform
    external_post_id: str = Field(
        min_length=1,
        max_length=255,
    )
    post_url: HttpUrl
    account_name: str | None = Field(
        default=None,
        max_length=255,
    )
    view_count: int = Field(default=0, ge=0)
    like_count: int = Field(default=0, ge=0)
    comment_count: int = Field(default=0, ge=0)
    repost_count: int = Field(default=0, ge=0)
    published_at: datetime | None = None


class SocialPostCreate(SocialPostBase):
    pass


class SocialPostUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    platform: SocialPlatform | None = None
    external_post_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    post_url: HttpUrl | None = None
    account_name: str | None = Field(
        default=None,
        max_length=255,
    )
    view_count: int | None = Field(default=None, ge=0)
    like_count: int | None = Field(default=None, ge=0)
    comment_count: int | None = Field(default=None, ge=0)
    repost_count: int | None = Field(default=None, ge=0)
    published_at: datetime | None = None


class SocialPost(SocialPostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    news_article_id: int
    last_synced_at: datetime


class SocialPostListResponse(BaseModel):
    items: list[SocialPost]
    total_items: int = Field(ge=0)


class PlatformEngagementSummary(BaseModel):
    platform: SocialPlatform
    post_count: int = Field(ge=0)
    view_count: int = Field(ge=0)
    like_count: int = Field(ge=0)
    comment_count: int = Field(ge=0)
    repost_count: int = Field(ge=0)


class NewsEngagementSummary(BaseModel):
    news_article_id: int
    total_posts: int = Field(ge=0)
    total_views: int = Field(ge=0)
    total_likes: int = Field(ge=0)
    total_comments: int = Field(ge=0)
    total_reposts: int = Field(ge=0)
    platform_breakdown: list[PlatformEngagementSummary]

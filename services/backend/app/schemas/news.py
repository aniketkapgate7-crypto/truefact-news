from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class NewsArticleBase(BaseModel):
    title: str = Field(min_length=5, max_length=250)
    summary: str = Field(min_length=10, max_length=1000)
    source_name: str = Field(min_length=2, max_length=150)
    source_url: HttpUrl
    # Optional article hero image URL (extracted from RSS feed).
    image_url: Optional[HttpUrl] = None
    category: str = Field(min_length=2, max_length=100)
    region: str = Field(min_length=2, max_length=100)
    published_at: datetime
    evidence_score: int = Field(default=0, ge=0, le=100)
    comment_count: int = Field(default=0, ge=0)
    repost_count: int = Field(default=0, ge=0)


class NewsArticleCreate(NewsArticleBase):
    """Information required to create an article."""

    pass


class NewsArticle(NewsArticleBase):
    """Article returned by the API."""

    id: int = Field(gt=0)

    # Credibility score from CredibilityAssessmentModel, null when no
    # assessment exists (article is still "Assessment pending").
    credibility_score: Optional[int] = Field(default=None, ge=0, le=100)

    model_config = ConfigDict(from_attributes=True)


class NewsArticleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=5, max_length=250)
    summary: Optional[str] = Field(default=None, min_length=10, max_length=1000)
    source_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    source_url: Optional[HttpUrl] = None
    # image_url may be set to null to clear it; omitting the field leaves it unchanged.
    image_url: Optional[HttpUrl] = None
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    region: Optional[str] = Field(default=None, min_length=2, max_length=100)
    published_at: Optional[datetime] = None
    evidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    comment_count: Optional[int] = Field(default=None, ge=0)
    repost_count: Optional[int] = Field(default=None, ge=0)


class PaginationMetadata(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool


class NewsFeedResponse(BaseModel):
    items: list[NewsArticle]
    pagination: PaginationMetadata

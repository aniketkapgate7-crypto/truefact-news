from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class NewsArticleBase(BaseModel):
    title: str = Field(min_length=5, max_length=250)
    summary: str = Field(min_length=10, max_length=1000)
    source_name: str = Field(min_length=2, max_length=150)
    source_url: HttpUrl
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

    model_config = ConfigDict(from_attributes=True)

class NewsArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=250)
    summary: str | None = Field(default=None, min_length=10, max_length=1000)
    source_name: str | None = Field(default=None, min_length=2, max_length=150)
    source_url: HttpUrl | None = None
    category: str | None = Field(default=None, min_length=2, max_length=100)
    region: str | None = Field(default=None, min_length=2, max_length=100)
    published_at: datetime | None = None
    evidence_score: int | None = Field(default=None, ge=0, le=100)
    comment_count: int | None = Field(default=None, ge=0)
    repost_count: int | None = Field(default=None, ge=0)   
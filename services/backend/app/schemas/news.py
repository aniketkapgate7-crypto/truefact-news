from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


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
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NewsArticleUpdate(BaseModel):
    """Fields that may be updated. All are optional but none may be set to null."""

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

    @model_validator(mode="after")
    def reject_explicit_nulls(self) -> Self:
        """Prevent any explicitly supplied field from being set to null."""
        model_fields_set = self.model_fields_set
        for field in model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(
                    f"Field '{field}' was explicitly set to null, "
                    "which is not permitted on update."
                )
        return self


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

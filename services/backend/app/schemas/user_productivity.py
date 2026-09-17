import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SavedStoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    article_id: int
    article_title: str
    article_url: str
    source_domain: str | None = None
    source_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedSavedStoriesResponse(BaseModel):
    items: list[SavedStoryResponse]
    total: int
    limit: int
    offset: int


class WatchlistCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    article_id: int = Field(
        ..., description="Existing article ID to derive source domain and name"
    )


class WatchlistResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    source_domain: str
    source_name_snapshot: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedWatchlistsResponse(BaseModel):
    items: list[WatchlistResponse]
    total: int
    limit: int
    offset: int

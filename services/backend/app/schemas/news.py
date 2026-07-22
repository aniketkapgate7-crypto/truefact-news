from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class NewsArticle(BaseModel):
    id: int = Field(gt=0)
    title: str = Field(min_length=5, max_length=250)
    summary: str = Field(min_length=10, max_length=1000)
    source_name: str
    source_url: HttpUrl
    category: str
    region: str
    published_at: datetime
    evidence_score: int = Field(ge=0, le=100)
    comment_count: int = Field(default=0, ge=0)
    repost_count: int = Field(default=0, ge=0)
    
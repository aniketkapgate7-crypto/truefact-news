from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.services.credibility import FactCheckVerdict, ReviewStatus


class FactCheckMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    claim_text: str
    claimant: str | None
    verdict: str
    publisher: str
    review_url: HttpUrl
    review_date: date | None


class FactCheckSearchResponse(BaseModel):
    provider: str = "google_fact_check"
    query: str
    match_count: int = Field(ge=0)
    matches: tuple[FactCheckMatchResponse, ...]
    disclaimer: str


class ArticleFactCheckResponse(FactCheckSearchResponse):
    article_id: int = Field(gt=0)


class EditorialFactCheckItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: int
    title: str
    summary: str
    category: str
    source_name: str
    source_url: str
    image_url: str | None = None
    published_at: datetime

    claim: str
    claimant: str | None = None
    claim_date: datetime | None = None
    verdict: FactCheckVerdict
    review_status: ReviewStatus
    reviewer_name: str | None = None
    reviewed_at: datetime | None = None
    review_published_at: datetime | None = None
    conclusion: str | None = None
    correction_summary: str | None = None
    review_version: int = 1
    credibility_score: int = Field(ge=0, le=100)
    supporting_evidence_count: int = 0
    contradicting_evidence_count: int = 0
    independent_source_count: int = 0
    primary_source_count: int = 0


class PublishedFactChecksResponse(BaseModel):
    items: list[EditorialFactCheckItem]
    total_count: int = Field(ge=0)

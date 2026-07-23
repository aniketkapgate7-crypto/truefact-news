from datetime import date

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


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

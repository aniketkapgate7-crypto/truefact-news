from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CredibilityAssessmentBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    source_reliability_score: int = Field(ge=0, le=100)
    evidence_quality_score: int = Field(ge=0, le=100)
    corroboration_score: int = Field(ge=0, le=100)
    content_quality_score: int = Field(ge=0, le=100)
    explanation: str = Field(
        min_length=10,
        max_length=3000,
    )


class CredibilityAssessmentCreate(CredibilityAssessmentBase):
    pass


class CredibilityAssessmentUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    source_reliability_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    evidence_quality_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    corroboration_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    content_quality_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    explanation: str | None = Field(
        default=None,
        min_length=10,
        max_length=3000,
    )


class CredibilityAssessment(CredibilityAssessmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    news_article_id: int
    credibility_score: int = Field(ge=0, le=100)
    method_version: str
    assessed_at: datetime
    updated_at: datetime

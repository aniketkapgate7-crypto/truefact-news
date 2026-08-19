from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.services.credibility import (
    AssessmentStatus,
    ConfidenceLevel,
    CredibilityRating,
    CredibilityReasonCode,
    generate_credibility_reason_codes,
    get_assessment_status,
    get_confidence_level,
    get_credibility_rating,
    get_credibility_reason_message,
)


class CredibilityAssessmentBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    source_reliability_score: int = Field(ge=0, le=100)
    evidence_quality_score: int = Field(ge=0, le=100)
    corroboration_score: int = Field(ge=0, le=100)
    content_quality_score: int = Field(ge=0, le=100)

    supporting_evidence_count: int = Field(default=0, ge=0)
    contradicting_evidence_count: int = Field(default=0, ge=0)
    independent_source_count: int = Field(default=0, ge=0)
    primary_source_count: int = Field(default=0, ge=0)

    is_evolving: bool = False

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

    supporting_evidence_count: int | None = Field(
        default=None,
        ge=0,
    )
    contradicting_evidence_count: int | None = Field(
        default=None,
        ge=0,
    )
    independent_source_count: int | None = Field(
        default=None,
        ge=0,
    )
    primary_source_count: int | None = Field(
        default=None,
        ge=0,
    )

    is_evolving: bool | None = None

    explanation: str | None = Field(
        default=None,
        min_length=10,
        max_length=3000,
    )


class CredibilityReason(BaseModel):
    code: CredibilityReasonCode
    message: str


class CredibilityAssessment(CredibilityAssessmentBase):
    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        str_strip_whitespace=True,
    )

    id: int
    news_article_id: int
    credibility_score: int = Field(ge=0, le=100)
    method_version: str
    assessed_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def credibility_rating(self) -> CredibilityRating:
        return get_credibility_rating(self.credibility_score)

    @computed_field
    @property
    def assessment_status(self) -> AssessmentStatus:
        return get_assessment_status(
            supporting_evidence_count=self.supporting_evidence_count,
            contradicting_evidence_count=(self.contradicting_evidence_count),
        )

    @computed_field
    @property
    def confidence_level(self) -> ConfidenceLevel:
        return get_confidence_level(
            independent_source_count=self.independent_source_count,
            primary_source_count=self.primary_source_count,
        )

    @computed_field
    @property
    def credibility_reason_codes(
        self,
    ) -> tuple[CredibilityReasonCode, ...]:
        return generate_credibility_reason_codes(
            source_reliability_score=self.source_reliability_score,
            evidence_quality_score=self.evidence_quality_score,
            corroboration_score=self.corroboration_score,
            content_quality_score=self.content_quality_score,
        )

    @computed_field
    @property
    def credibility_reasons(
        self,
    ) -> tuple[CredibilityReason, ...]:
        return tuple(
            CredibilityReason(
                code=reason_code,
                message=get_credibility_reason_message(reason_code),
            )
            for reason_code in self.credibility_reason_codes
        )

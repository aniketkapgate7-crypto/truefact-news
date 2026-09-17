from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class VerificationStatus(StrEnum):
    EXISTING_FACT_CHECK = "existing_fact_check"
    AUTOMATED_ASSESSMENT_AVAILABLE = "automated_assessment_available"
    SUBMITTED_FOR_REVIEW = "submitted_for_review"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    VERIFICATION_UNAVAILABLE = "verification_unavailable"


class VerifyClaimRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    claim_text: str = Field(min_length=3, max_length=1000)
    article_url: HttpUrl | None = None
    supporting_context: str | None = Field(default=None, max_length=2000)


class VerifyClaimResult(BaseModel):
    title: str
    summary: str
    matched_type: str  # "human_verdict" | "automated_assessment" | "external_fact_check" | "submission_receipt"
    url: str | None = None
    score: int | None = None
    verdict: str | None = None
    reviewer: str | None = None
    evidence_count: int | None = None
    extra: dict[str, Any] | None = None


class VerifyClaimResponse(BaseModel):
    query: str
    status: VerificationStatus
    message: str
    submitted_at: datetime
    result: VerifyClaimResult | None = None

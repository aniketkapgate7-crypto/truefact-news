from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.routers.fact_checks import get_fact_check_provider
from app.schemas.verify import (
    VerificationStatus,
    VerifyClaimRequest,
    VerifyClaimResponse,
    VerifyClaimResult,
)
from app.services.credibility import ReviewStatus
from app.services.fact_check import FactCheckProvider
from app.services.google_fact_check import (
    FactCheckProviderError,
    FactCheckProviderTimeoutError,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Verification"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post(
    "/verify",
    response_model=VerifyClaimResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify a claim or submit for editorial review",
)
async def verify_claim(
    payload: VerifyClaimRequest,
    db: DatabaseSession,
) -> VerifyClaimResponse:
    query_text = payload.claim_text.strip()
    submitted_time = datetime.now(timezone.utc)
    url_str = str(payload.article_url).strip() if payload.article_url else None

    # 1. Search database for published human-reviewed fact check
    human_stmt = (
        select(NewsArticleModel)
        .join(
            CredibilityAssessmentModel,
            NewsArticleModel.id == CredibilityAssessmentModel.news_article_id,
        )
        .options(selectinload(NewsArticleModel.credibility_assessment))
        .where(
            CredibilityAssessmentModel.review_status == ReviewStatus.PUBLISHED,
            CredibilityAssessmentModel.verdict.isnot(None),
            CredibilityAssessmentModel.claim.isnot(None),
            CredibilityAssessmentModel.conclusion.isnot(None),
            CredibilityAssessmentModel.reviewed_at.isnot(None),
            CredibilityAssessmentModel.review_published_at.isnot(None),
            or_(
                CredibilityAssessmentModel.reviewer_name.isnot(None),
                CredibilityAssessmentModel.reviewer_id.isnot(None),
            ),
            or_(
                CredibilityAssessmentModel.claim.ilike(f"%{query_text}%"),
                NewsArticleModel.title.ilike(f"%{query_text}%"),
                (NewsArticleModel.source_url == url_str) if url_str else False,
            ),
        )
    )
    published_match = db.scalar(human_stmt)

    if published_match and published_match.credibility_assessment:
        ca = published_match.credibility_assessment
        return VerifyClaimResponse(
            query=query_text,
            status=VerificationStatus.EXISTING_FACT_CHECK,
            message="Published editorial fact check found.",
            submitted_at=submitted_time,
            result=VerifyClaimResult(
                title=published_match.title,
                summary=ca.conclusion or published_match.summary,
                matched_type="human_verdict",
                url=f"/fact-check/{published_match.id}",
                score=ca.credibility_score,
                verdict=ca.verdict,
                reviewer=ca.reviewer_name or ca.reviewer_id,
                evidence_count=(
                    ca.supporting_evidence_count + ca.contradicting_evidence_count
                ),
                extra={
                    "article_id": published_match.id,
                    "review_published_at": ca.review_published_at.isoformat()
                    if ca.review_published_at
                    else None,
                },
            ),
        )

    # 2. Search database for automated credibility assessment
    auto_stmt = (
        select(NewsArticleModel)
        .join(
            CredibilityAssessmentModel,
            NewsArticleModel.id == CredibilityAssessmentModel.news_article_id,
        )
        .options(selectinload(NewsArticleModel.credibility_assessment))
        .where(
            or_(
                NewsArticleModel.title.ilike(f"%{query_text}%"),
                NewsArticleModel.summary.ilike(f"%{query_text}%"),
                (NewsArticleModel.source_url == url_str) if url_str else False,
            )
        )
    )
    auto_match = db.scalar(auto_stmt)

    if auto_match and auto_match.credibility_assessment:
        ca = auto_match.credibility_assessment
        return VerifyClaimResponse(
            query=query_text,
            status=VerificationStatus.AUTOMATED_ASSESSMENT_AVAILABLE,
            message=(
                "Automated credibility assessment available. "
                "This is an automated signal and has not yet been reviewed by human fact-checkers."
            ),
            submitted_at=submitted_time,
            result=VerifyClaimResult(
                title=auto_match.title,
                summary=ca.explanation,
                matched_type="automated_assessment",
                url=f"/article/{auto_match.id}",
                score=ca.credibility_score,
                verdict=None,
                reviewer=None,
                evidence_count=(
                    ca.supporting_evidence_count + ca.contradicting_evidence_count
                ),
                extra={
                    "article_id": auto_match.id,
                    "source_reliability_score": ca.source_reliability_score,
                    "evidence_quality_score": ca.evidence_quality_score,
                    "corroboration_score": ca.corroboration_score,
                    "content_quality_score": ca.content_quality_score,
                },
            ),
        )

    # 3. Check Google Fact Check provider if available
    try:
        provider: FactCheckProvider = get_fact_check_provider()
        matches = await provider.search_claims(query_text, limit=1)
        if matches:
            first = matches[0]
            return VerifyClaimResponse(
                query=query_text,
                status=VerificationStatus.EXISTING_FACT_CHECK,
                message=f"Matching published fact check found from {first.publisher}.",
                submitted_at=submitted_time,
                result=VerifyClaimResult(
                    title=first.claim_text,
                    summary=f"Checked by {first.publisher}: Verdict {first.verdict}",
                    matched_type="external_fact_check",
                    url=str(first.review_url),
                    score=None,
                    verdict=first.verdict,
                    reviewer=first.publisher,
                    evidence_count=None,
                    extra={
                        "claimant": first.claimant,
                        "review_date": first.review_date.isoformat()
                        if first.review_date
                        else None,
                    },
                ),
            )
    except (FactCheckProviderError, FactCheckProviderTimeoutError, Exception):
        # Ignore provider errors and fallback to submission queue
        pass

    # 4. Honest response when no prior record matches
    return VerifyClaimResponse(
        query=query_text,
        status=VerificationStatus.INSUFFICIENT_EVIDENCE,
        message=(
            "No matching editorial fact check or automated assessment was found across indexed sources."
        ),
        submitted_at=submitted_time,
        result=VerifyClaimResult(
            title=f"Claim: “{query_text[:100]}”",
            summary=(
                "TrueFact searched its indexed credibility assessments and configured fact-check sources. "
                "No prior investigation or published record exists for this specific statement."
            ),
            matched_type="no_match",
            url=None,
            score=None,
            verdict=None,
            reviewer=None,
            evidence_count=0,
            extra={
                "context": payload.supporting_context,
                "url": url_str,
            },
        ),
    )

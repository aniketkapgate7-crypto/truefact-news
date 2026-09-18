from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.guards import require_editorial_mutation_access
from app.core.permissions import require_reviewer_or_admin
from app.db.database import get_db
from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.schemas.credibility import CredibilityAssessment, EditorialReviewUpdate
from app.schemas.fact_check import (
    ArticleFactCheckResponse,
    EditorialFactCheckItem,
    FactCheckSearchResponse,
    PublishedFactChecksResponse,
)
from app.services.credibility import FactCheckVerdict, ReviewStatus
from app.services.fact_check import (
    FactCheckMatch,
    FactCheckProvider,
)
from app.services.google_fact_check import (
    FactCheckProviderError,
    FactCheckProviderTimeoutError,
    GoogleFactCheckProvider,
)

FACT_CHECK_DISCLAIMER = (
    "Matches are previously published fact checks. No match does not prove "
    "or disprove a claim."
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Fact Checks"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


def get_fact_check_provider() -> FactCheckProvider:
    api_key = settings.google_fact_check_api_key

    if api_key is None or not api_key.get_secret_value().strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fact-check service is not configured",
        )

    return GoogleFactCheckProvider(
        api_key=api_key.get_secret_value(),
        base_url=settings.google_fact_check_base_url,
        timeout_seconds=settings.google_fact_check_timeout_seconds,
        language_code=settings.google_fact_check_language_code,
    )


FactCheckProviderDependency = Annotated[
    FactCheckProvider,
    Depends(get_fact_check_provider),
]


def _normalize_query(query: str) -> str:
    normalized_query = " ".join(query.split())

    if len(normalized_query) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fact-check query must contain at least 3 characters",
        )

    return normalized_query


async def _search_provider(
    provider: FactCheckProvider,
    *,
    query: str,
    limit: int,
) -> tuple[FactCheckMatch, ...]:
    try:
        return await provider.search_claims(query, limit=limit)
    except FactCheckProviderTimeoutError as error:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Fact-check provider timed out",
        ) from error
    except FactCheckProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Fact-check provider is currently unavailable",
        ) from error


@router.get(
    "/fact-checks/search",
    response_model=FactCheckSearchResponse,
    summary="Search published fact checks",
)
async def search_fact_checks(
    provider: FactCheckProviderDependency,
    query: str = Query(min_length=3, max_length=500),
    limit: int = Query(default=5, ge=1, le=20),
) -> FactCheckSearchResponse:
    normalized_query = _normalize_query(query)
    matches = await _search_provider(
        provider,
        query=normalized_query,
        limit=limit,
    )

    return FactCheckSearchResponse(
        query=normalized_query,
        match_count=len(matches),
        matches=matches,
        disclaimer=FACT_CHECK_DISCLAIMER,
    )


@router.get(
    "/news/{article_id}/fact-checks",
    response_model=ArticleFactCheckResponse,
    summary="Find published fact checks for a news article",
)
async def get_article_fact_checks(
    article_id: int,
    db: DatabaseSession,
    provider: FactCheckProviderDependency,
    limit: int = Query(default=5, ge=1, le=20),
) -> ArticleFactCheckResponse:
    article = db.get(NewsArticleModel, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )

    query = _normalize_query(article.title)
    matches = await _search_provider(
        provider,
        query=query,
        limit=limit,
    )

    return ArticleFactCheckResponse(
        article_id=article.id,
        query=query,
        match_count=len(matches),
        matches=matches,
        disclaimer=FACT_CHECK_DISCLAIMER,
    )


@router.get(
    "/fact-checks/published",
    response_model=PublishedFactChecksResponse,
    summary="List all human-reviewed and published fact checks",
)
def get_published_fact_checks(
    db: DatabaseSession,
    limit: int = Query(default=10, ge=1, le=50),
) -> PublishedFactChecksResponse:
    """Retrieve articles that have completed human review and are published."""
    statement = (
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
        )
        .order_by(
            CredibilityAssessmentModel.review_published_at.desc().nullslast(),
            NewsArticleModel.published_at.desc(),
        )
        .limit(limit)
    )
    articles = list(db.scalars(statement).all())

    items = []
    for art in articles:
        ca = art.credibility_assessment
        if (
            ca
            and ca.review_status == ReviewStatus.PUBLISHED
            and ca.verdict
            and (ca.reviewer_name or ca.reviewer_id)
            and ca.reviewed_at
            and ca.review_published_at
            and ca.claim
            and ca.conclusion
        ):
            items.append(
                EditorialFactCheckItem(
                    article_id=art.id,
                    title=art.title,
                    summary=art.summary,
                    category=art.category,
                    source_name=art.source_name,
                    source_url=art.source_url,
                    image_url=art.image_url,
                    published_at=art.published_at,
                    claim=ca.claim,
                    claimant=ca.claimant or art.source_name,
                    claim_date=ca.claim_date or art.published_at,
                    verdict=FactCheckVerdict(ca.verdict),
                    review_status=ReviewStatus(ca.review_status),
                    reviewer_name=ca.reviewer_name or ca.reviewer_id,
                    reviewed_at=ca.reviewed_at,
                    review_published_at=ca.review_published_at,
                    conclusion=ca.conclusion,
                    correction_summary=ca.correction_summary,
                    review_version=ca.review_version,
                    credibility_score=ca.credibility_score,
                    supporting_evidence_count=ca.supporting_evidence_count,
                    contradicting_evidence_count=ca.contradicting_evidence_count,
                    independent_source_count=ca.independent_source_count,
                    primary_source_count=ca.primary_source_count,
                )
            )

    return PublishedFactChecksResponse(
        items=items,
        total_count=len(items),
    )


@router.get(
    "/fact-checks/editorial/{article_id}",
    response_model=EditorialFactCheckItem,
    summary="Get human-reviewed fact check report for an article",
)
def get_editorial_fact_check(
    article_id: int,
    db: DatabaseSession,
) -> EditorialFactCheckItem:
    statement = (
        select(NewsArticleModel)
        .options(selectinload(NewsArticleModel.credibility_assessment))
        .where(NewsArticleModel.id == article_id)
    )
    art = db.scalar(statement)
    if art is None or art.credibility_assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fact check report not found for this article",
        )

    ca = art.credibility_assessment
    # Strict validation: automated assessments must NEVER become fact check reports
    has_reviewer = bool(
        (ca.reviewer_name and ca.reviewer_name.strip())
        or (ca.reviewer_id and ca.reviewer_id.strip())
    )
    if (
        ca.review_status != ReviewStatus.PUBLISHED
        or not ca.verdict
        or not has_reviewer
        or not ca.reviewed_at
        or not ca.review_published_at
        or not ca.claim
        or not ca.conclusion
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Editorial fact check report not published for this article",
        )

    return EditorialFactCheckItem(
        article_id=art.id,
        title=art.title,
        summary=art.summary,
        category=art.category,
        source_name=art.source_name,
        source_url=art.source_url,
        image_url=art.image_url,
        published_at=art.published_at,
        claim=ca.claim,
        claimant=ca.claimant or art.source_name,
        claim_date=ca.claim_date or art.published_at,
        verdict=FactCheckVerdict(ca.verdict),
        review_status=ReviewStatus(ca.review_status),
        reviewer_name=ca.reviewer_name or ca.reviewer_id,
        reviewed_at=ca.reviewed_at,
        review_published_at=ca.review_published_at,
        conclusion=ca.conclusion,
        correction_summary=ca.correction_summary,
        review_version=ca.review_version,
        credibility_score=ca.credibility_score,
        supporting_evidence_count=ca.supporting_evidence_count,
        contradicting_evidence_count=ca.contradicting_evidence_count,
        independent_source_count=ca.independent_source_count,
        primary_source_count=ca.primary_source_count,
    )


@router.patch(
    "/editorial/review/{article_id}",
    response_model=CredibilityAssessment,
    summary="Update editorial review status and publish fact checks (internal workspace)",
    dependencies=[
        Depends(require_editorial_mutation_access),
        Depends(require_reviewer_or_admin),
    ],
)
def update_editorial_review(
    article_id: int,
    updates: EditorialReviewUpdate,
    db: DatabaseSession,
) -> CredibilityAssessment:

    statement = select(CredibilityAssessmentModel).where(
        CredibilityAssessmentModel.news_article_id == article_id
    )
    assessment = db.scalar(statement)

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credibility assessment not found for this article",
        )

    update_dict = updates.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update",
        )

    target_status = updates.review_status or assessment.review_status
    target_verdict = (
        updates.verdict if updates.verdict is not None else assessment.verdict
    )
    target_reviewer = (
        updates.reviewer_name
        or updates.reviewer_id
        or assessment.reviewer_name
        or assessment.reviewer_id
    )
    target_claim = updates.claim if updates.claim is not None else assessment.claim
    target_conclusion = (
        updates.conclusion if updates.conclusion is not None else assessment.conclusion
    )

    if target_status == ReviewStatus.PUBLISHED:
        missing = []
        if not target_verdict:
            missing.append("verdict")
        if not target_reviewer:
            missing.append("reviewer attribution (reviewer_name or reviewer_id)")
        if not target_claim:
            missing.append("claim")
        if not target_conclusion:
            missing.append("human-written conclusion")

        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cannot publish fact check. Missing required fields: {', '.join(missing)}",
            )

    now = datetime.now(timezone.utc)
    for field_name, value in update_dict.items():
        if value is not None:
            setattr(assessment, field_name, value)

    # Set reviewed_at if moving to reviewed or published
    if target_status in (ReviewStatus.REVIEWED, ReviewStatus.PUBLISHED):
        if not assessment.reviewed_at:
            assessment.reviewed_at = now

    # Set review_published_at if publishing
    if target_status == ReviewStatus.PUBLISHED:
        if not assessment.review_published_at:
            assessment.review_published_at = now

    if target_status == ReviewStatus.CORRECTED:
        assessment.review_version += 1

    assessment.updated_at = now
    db.commit()
    db.refresh(assessment)

    return CredibilityAssessment.model_validate(assessment)

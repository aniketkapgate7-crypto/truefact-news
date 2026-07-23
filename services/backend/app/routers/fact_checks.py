from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.news import NewsArticleModel
from app.schemas.fact_check import (
    ArticleFactCheckResponse,
    FactCheckSearchResponse,
)
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

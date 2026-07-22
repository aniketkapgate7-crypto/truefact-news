from typing import Annotated, Literal
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.news import NewsArticleModel
from app.schemas.news import (
    NewsArticle,
    NewsArticleCreate,
    NewsArticleUpdate,
    NewsFeedResponse,
    PaginationMetadata,
)

router = APIRouter(
    prefix="/api/v1/news",
    tags=["News"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]

@router.get(
    "/",
    response_model=NewsFeedResponse,
    summary="Search, filter, sort, and paginate news",
)
def get_news(
    db: DatabaseSession,
    search: str | None = Query(
        default=None,
        min_length=2,
        max_length=100,
    ),
    region: str | None = Query(default=None),
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
    min_evidence_score: int = Query(default=0, ge=0, le=100),
    sort_by: Literal[
        "published_at",
        "evidence_score",
        "comment_count",
        "repost_count",
    ] = Query(default="published_at"),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    filters = [
        NewsArticleModel.evidence_score >= min_evidence_score
    ]

    if search:
        keyword = search.strip()

        if len(keyword) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Search must contain at least two non-space characters",
            )

        search_pattern = f"%{keyword}%"

        filters.append(
            or_(
                NewsArticleModel.title.ilike(search_pattern),
                NewsArticleModel.summary.ilike(search_pattern),
                NewsArticleModel.source_name.ilike(search_pattern),
            )
        )

    if region:
        filters.append(
            func.lower(NewsArticleModel.region)
            == region.strip().lower()
        )

    if category:
        filters.append(
            func.lower(NewsArticleModel.category)
            == category.strip().lower()
        )

    if source:
        filters.append(
            NewsArticleModel.source_name.ilike(
                f"%{source.strip()}%"
            )
        )

    count_statement = (
        select(func.count())
        .select_from(NewsArticleModel)
        .where(*filters)
    )

    total_items = db.scalar(count_statement) or 0
    total_pages = ceil(total_items / page_size) if total_items else 0
    offset = (page - 1) * page_size

    sort_columns = {
        "published_at": NewsArticleModel.published_at,
        "evidence_score": NewsArticleModel.evidence_score,
        "comment_count": NewsArticleModel.comment_count,
        "repost_count": NewsArticleModel.repost_count,
    }

    sort_column = sort_columns[sort_by]

    if sort_order == "asc":
        ordering = sort_column.asc()
    else:
        ordering = sort_column.desc()

    articles_statement = (
        select(NewsArticleModel)
        .where(*filters)
        .order_by(ordering, NewsArticleModel.id.desc())
        .offset(offset)
        .limit(page_size)
    )

    articles = db.scalars(articles_statement).all()

    return NewsFeedResponse(
        items=articles,
        pagination=PaginationMetadata(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1 and total_pages > 0,
        ),
    )
from math import ceil
from typing import Annotated, Literal

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
SortField = Literal[
    "published_at",
    "evidence_score",
    "comment_count",
    "repost_count",
]
SortOrder = Literal["asc", "desc"]


def _get_article_or_404(
    article_id: int,
    db: Session,
) -> NewsArticleModel:
    article = db.get(NewsArticleModel, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )

    return article


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
    sort_by: SortField = Query(default="published_at"),
    sort_order: SortOrder = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> NewsFeedResponse:
    filters = [
        NewsArticleModel.evidence_score >= min_evidence_score,
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
        filters.append(func.lower(NewsArticleModel.region) == region.strip().lower())

    if category:
        filters.append(
            func.lower(NewsArticleModel.category) == category.strip().lower()
        )

    if source:
        filters.append(NewsArticleModel.source_name.ilike(f"%{source.strip()}%"))

    count_statement = select(func.count()).select_from(NewsArticleModel).where(*filters)
    total_items = db.scalar(count_statement) or 0
    total_pages = ceil(total_items / page_size) if total_items else 0

    sort_columns = {
        "published_at": NewsArticleModel.published_at,
        "evidence_score": NewsArticleModel.evidence_score,
        "comment_count": NewsArticleModel.comment_count,
        "repost_count": NewsArticleModel.repost_count,
    }
    sort_column = sort_columns[sort_by]
    ordering = sort_column.asc() if sort_order == "asc" else sort_column.desc()

    articles_statement = (
        select(NewsArticleModel)
        .where(*filters)
        .order_by(ordering, NewsArticleModel.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    articles = list(db.scalars(articles_statement).all())

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


@router.post(
    "/",
    response_model=NewsArticle,
    status_code=status.HTTP_201_CREATED,
    summary="Create a news article",
)
def create_news_article(
    article: NewsArticleCreate,
    db: DatabaseSession,
) -> NewsArticleModel:
    article_data = article.model_dump()
    article_data["source_url"] = str(article.source_url)
    database_article = NewsArticleModel(**article_data)

    try:
        db.add(database_article)
        db.commit()
        db.refresh(database_article)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An article with this source URL already exists",
        ) from error

    return database_article


@router.get(
    "/{article_id}",
    response_model=NewsArticle,
    summary="Get one news article",
)
def get_news_article(
    article_id: int,
    db: DatabaseSession,
) -> NewsArticleModel:
    return _get_article_or_404(article_id, db)


@router.patch(
    "/{article_id}",
    response_model=NewsArticle,
    summary="Update a news article",
)
def update_news_article(
    article_id: int,
    updates: NewsArticleUpdate,
    db: DatabaseSession,
) -> NewsArticleModel:
    article = _get_article_or_404(article_id, db)
    update_data = updates.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update",
        )

    if any(value is None for value in update_data.values()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Updated fields cannot be null",
        )

    if "source_url" in update_data:
        update_data["source_url"] = str(update_data["source_url"])

    for field_name, value in update_data.items():
        setattr(article, field_name, value)

    try:
        db.commit()
        db.refresh(article)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An article with this source URL already exists",
        ) from error

    return article


@router.delete(
    "/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a news article",
)
def delete_news_article(
    article_id: int,
    db: DatabaseSession,
) -> Response:
    article = _get_article_or_404(article_id, db)

    db.delete(article)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

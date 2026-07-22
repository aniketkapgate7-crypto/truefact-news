from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.news import NewsArticleModel
from app.schemas.news import NewsArticle, NewsArticleCreate


router = APIRouter(
    prefix="/api/v1/news",
    tags=["News"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/",
    response_model=list[NewsArticle],
    summary="Get and filter news",
)
def get_news(
    db: DatabaseSession,
    region: str | None = Query(default=None),
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
    min_evidence_score: int = Query(default=0, ge=0, le=100),
    limit: int = Query(default=20, ge=1, le=100),
):
    statement = select(NewsArticleModel)

    if region:
        statement = statement.where(
            func.lower(NewsArticleModel.region) == region.strip().lower()
        )

    if category:
        statement = statement.where(
            func.lower(NewsArticleModel.category) == category.strip().lower()
        )

    if source:
        statement = statement.where(
            NewsArticleModel.source_name.ilike(
                f"%{source.strip()}%"
            )
        )

    statement = (
        statement
        .where(
            NewsArticleModel.evidence_score >= min_evidence_score
        )
        .order_by(NewsArticleModel.published_at.desc())
        .limit(limit)
    )

    return db.scalars(statement).all()


@router.get(
    "/{article_id}",
    response_model=NewsArticle,
    summary="Get one news article",
)
def get_news_article(
    article_id: int,
    db: DatabaseSession,
):
    article = db.get(NewsArticleModel, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )

    return article


@router.post(
    "/",
    response_model=NewsArticle,
    status_code=status.HTTP_201_CREATED,
    summary="Create a news article",
)
def create_news_article(
    article: NewsArticleCreate,
    db: DatabaseSession,
):
    article_data = article.model_dump()
    article_data["source_url"] = str(article.source_url)

    database_article = NewsArticleModel(**article_data)

    try:
        db.add(database_article)
        db.commit()
        db.refresh(database_article)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An article with this source URL already exists",
        )

    return database_article

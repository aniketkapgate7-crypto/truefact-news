from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.news import NewsArticleModel
from app.models.social_post import SocialPostModel
from app.schemas.social_post import (
    SocialPost,
    SocialPostCreate,
    SocialPostListResponse,
    SocialPostUpdate,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Social Posts"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


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


def _get_social_post_or_404(
    social_post_id: int,
    db: Session,
) -> SocialPostModel:
    social_post = db.get(SocialPostModel, social_post_id)

    if social_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social post not found",
        )

    return social_post


def _raise_duplicate_error(error: IntegrityError) -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=("A social post with this URL or platform post ID already exists"),
    ) from error


@router.post(
    "/news/{article_id}/social-posts",
    response_model=SocialPost,
    status_code=status.HTTP_201_CREATED,
    summary="Add a social post to a news article",
)
def create_social_post(
    article_id: int,
    social_post: SocialPostCreate,
    db: DatabaseSession,
) -> SocialPostModel:
    _get_article_or_404(article_id, db)

    post_data = social_post.model_dump()
    post_data["post_url"] = str(social_post.post_url)

    database_post = SocialPostModel(
        news_article_id=article_id,
        **post_data,
    )

    try:
        db.add(database_post)
        db.commit()
        db.refresh(database_post)
    except IntegrityError as error:
        db.rollback()
        _raise_duplicate_error(error)

    return database_post


@router.get(
    "/news/{article_id}/social-posts",
    response_model=SocialPostListResponse,
    summary="List social posts for a news article",
)
def list_social_posts(
    article_id: int,
    db: DatabaseSession,
) -> SocialPostListResponse:
    _get_article_or_404(article_id, db)

    statement = (
        select(SocialPostModel)
        .where(SocialPostModel.news_article_id == article_id)
        .order_by(
            SocialPostModel.published_at.desc(),
            SocialPostModel.id.desc(),
        )
    )

    items = list(db.scalars(statement).all())

    count_statement = (
        select(func.count())
        .select_from(SocialPostModel)
        .where(SocialPostModel.news_article_id == article_id)
    )
    total_items = db.scalar(count_statement) or 0

    return SocialPostListResponse(
        items=items,
        total_items=total_items,
    )


@router.get(
    "/social-posts/{social_post_id}",
    response_model=SocialPost,
    summary="Get one social post",
)
def get_social_post(
    social_post_id: int,
    db: DatabaseSession,
) -> SocialPostModel:
    return _get_social_post_or_404(social_post_id, db)


@router.patch(
    "/social-posts/{social_post_id}",
    response_model=SocialPost,
    summary="Update social-post metrics",
)
def update_social_post(
    social_post_id: int,
    updates: SocialPostUpdate,
    db: DatabaseSession,
) -> SocialPostModel:
    social_post = _get_social_post_or_404(social_post_id, db)
    update_data = updates.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update",
        )

    required_fields = {
        "platform",
        "external_post_id",
        "post_url",
        "view_count",
        "like_count",
        "comment_count",
        "repost_count",
    }

    if any(
        field in update_data and update_data[field] is None for field in required_fields
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Required social-post fields cannot be null",
        )

    if "post_url" in update_data:
        update_data["post_url"] = str(update_data["post_url"])

    for field_name, value in update_data.items():
        setattr(social_post, field_name, value)

    try:
        db.commit()
        db.refresh(social_post)
    except IntegrityError as error:
        db.rollback()
        _raise_duplicate_error(error)

    return social_post


@router.delete(
    "/social-posts/{social_post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a social post",
)
def delete_social_post(
    social_post_id: int,
    db: DatabaseSession,
) -> Response:
    social_post = _get_social_post_or_404(social_post_id, db)

    db.delete(social_post)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

import logging
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.entitlements import FeatureKey, require_feature
from app.db.database import get_db
from app.models.news import NewsArticleModel
from app.models.user import ApplicationUserModel
from app.models.user_productivity import (
    UserSavedStoryModel,
    UserSourceWatchlistModel,
)
from app.schemas.user_productivity import (
    PaginatedSavedStoriesResponse,
    PaginatedWatchlistsResponse,
    SavedStoryResponse,
    WatchlistCreateRequest,
    WatchlistResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users/me", tags=["User Productivity"])


def _extract_domain(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc or "unknown"
    except Exception:
        return "unknown"


# =====================================================================
# SAVED STORIES ENDPOINTS (Available to all authenticated users)
# =====================================================================


@router.get("/saved-stories", response_model=PaginatedSavedStoriesResponse)
def list_saved_stories(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(UserSavedStoryModel)
        .filter(UserSavedStoryModel.user_id == current_user.id)
        .order_by(UserSavedStoryModel.created_at.desc())
    )

    total = query.count()
    saved_items = query.offset(offset).limit(limit).all()

    items = []
    for item in saved_items:
        art = item.article
        domain = _extract_domain(art.source_url) if art else None
        items.append(
            SavedStoryResponse(
                id=item.id,
                user_id=item.user_id,
                article_id=item.article_id,
                article_title=art.title if art else "Article Deleted",
                article_url=art.source_url if art else "",
                source_domain=domain,
                source_name=art.source_name if art else domain,
                created_at=item.created_at,
            )
        )

    return PaginatedSavedStoriesResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/saved-stories/{article_id}", response_model=SavedStoryResponse)
def save_story(
    article_id: int,
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = (
        db.query(NewsArticleModel).filter(NewsArticleModel.id == article_id).first()
    )
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found.",
        )

    existing = (
        db.query(UserSavedStoryModel)
        .filter(
            UserSavedStoryModel.user_id == current_user.id,
            UserSavedStoryModel.article_id == article_id,
        )
        .first()
    )
    if existing:
        domain = _extract_domain(article.source_url)
        return SavedStoryResponse(
            id=existing.id,
            user_id=existing.user_id,
            article_id=existing.article_id,
            article_title=article.title,
            article_url=article.source_url,
            source_domain=domain,
            source_name=article.source_name or domain,
            created_at=existing.created_at,
        )

    saved_model = UserSavedStoryModel(
        user_id=current_user.id,
        article_id=article_id,
    )
    db.add(saved_model)
    try:
        db.commit()
        db.refresh(saved_model)
    except IntegrityError:
        db.rollback()
        saved_model = (
            db.query(UserSavedStoryModel)
            .filter(
                UserSavedStoryModel.user_id == current_user.id,
                UserSavedStoryModel.article_id == article_id,
            )
            .first()
        )
        if not saved_model:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save story.",
            )

    domain = _extract_domain(article.source_url)
    return SavedStoryResponse(
        id=saved_model.id,
        user_id=saved_model.user_id,
        article_id=saved_model.article_id,
        article_title=article.title,
        article_url=article.source_url,
        source_domain=domain,
        source_name=article.source_name or domain,
        created_at=saved_model.created_at,
    )


@router.delete("/saved-stories/{article_id}")
def remove_saved_story(
    article_id: int,
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved_model = (
        db.query(UserSavedStoryModel)
        .filter(
            UserSavedStoryModel.user_id == current_user.id,
            UserSavedStoryModel.article_id == article_id,
        )
        .first()
    )
    if not saved_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved story not found.",
        )

    db.delete(saved_model)
    db.commit()
    return {"success": True, "message": "Saved story removed."}


# =====================================================================
# SOURCE WATCHLIST ENDPOINTS (Requires PRO Entitlement)
# =====================================================================


@router.get(
    "/source-watchlists",
    response_model=PaginatedWatchlistsResponse,
    dependencies=[Depends(require_feature(FeatureKey.SOURCE_WATCHLISTS))],
)
def list_source_watchlists(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(UserSourceWatchlistModel)
        .filter(UserSourceWatchlistModel.user_id == current_user.id)
        .order_by(UserSourceWatchlistModel.created_at.desc())
    )

    total = query.count()
    watchlists = query.offset(offset).limit(limit).all()

    return PaginatedWatchlistsResponse(
        items=[WatchlistResponse.model_validate(w) for w in watchlists],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/source-watchlists",
    response_model=WatchlistResponse,
    dependencies=[Depends(require_feature(FeatureKey.SOURCE_WATCHLISTS))],
)
def create_source_watchlist(
    req: WatchlistCreateRequest,
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = (
        db.query(NewsArticleModel).filter(NewsArticleModel.id == req.article_id).first()
    )
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found.",
        )

    domain = _extract_domain(article.source_url)
    source_name = article.source_name or domain

    existing = (
        db.query(UserSourceWatchlistModel)
        .filter(
            UserSourceWatchlistModel.user_id == current_user.id,
            UserSourceWatchlistModel.source_domain == domain,
        )
        .first()
    )
    if existing:
        return WatchlistResponse.model_validate(existing)

    watchlist = UserSourceWatchlistModel(
        user_id=current_user.id,
        source_domain=domain,
        source_name_snapshot=source_name,
    )
    db.add(watchlist)
    try:
        db.commit()
        db.refresh(watchlist)
    except IntegrityError:
        db.rollback()
        watchlist = (
            db.query(UserSourceWatchlistModel)
            .filter(
                UserSourceWatchlistModel.user_id == current_user.id,
                UserSourceWatchlistModel.source_domain == domain,
            )
            .first()
        )
        if not watchlist:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create watchlist.",
            )

    return WatchlistResponse.model_validate(watchlist)


@router.delete(
    "/source-watchlists/{watchlist_id}",
    dependencies=[Depends(require_feature(FeatureKey.SOURCE_WATCHLISTS))],
)
def remove_source_watchlist(
    watchlist_id: uuid.UUID,
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watchlist = (
        db.query(UserSourceWatchlistModel)
        .filter(
            UserSourceWatchlistModel.id == watchlist_id,
            UserSourceWatchlistModel.user_id == current_user.id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist entry not found.",
        )

    db.delete(watchlist)
    db.commit()
    return {"success": True, "message": "Source watchlist removed."}

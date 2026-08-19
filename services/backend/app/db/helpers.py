from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.news import NewsArticleModel


def get_article_or_404(
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

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.schemas.news import NewsArticle


router = APIRouter(
    prefix="/api/v1/news",
    tags=["News"],
)


sample_news = [
    NewsArticle(
        id=1,
        title="Sample global news story",
        summary="This sample article is used to test the TrueFact News API.",
        source_name="TrueFact Demo",
        source_url="https://example.com/news/1",
        category="World",
        region="Global",
        published_at=datetime.now(timezone.utc),
        evidence_score=75,
        comment_count=24,
        repost_count=12,
    ),
    NewsArticle(
        id=2,
        title="Technology development reported across Asia",
        summary="Multiple sources are reporting a major technology development.",
        source_name="Asia News Demo",
        source_url="https://example.com/news/2",
        category="Technology",
        region="Asia",
        published_at=datetime.now(timezone.utc),
        evidence_score=82,
        comment_count=36,
        repost_count=18,
    ),
    NewsArticle(
        id=3,
        title="European climate initiative receives new support",
        summary="Governments and researchers have announced support for a climate initiative.",
        source_name="Europe News Demo",
        source_url="https://example.com/news/3",
        category="Climate",
        region="Europe",
        published_at=datetime.now(timezone.utc),
        evidence_score=88,
        comment_count=41,
        repost_count=29,
    ),
    NewsArticle(
        id=4,
        title="Indian space research programme announces new mission",
        summary="An official announcement describes the goals of an upcoming space mission.",
        source_name="India News Demo",
        source_url="https://example.com/news/4",
        category="Science",
        region="India",
        published_at=datetime.now(timezone.utc),
        evidence_score=91,
        comment_count=72,
        repost_count=48,
    ),
]


@router.get(
    "/",
    response_model=list[NewsArticle],
    summary="Get and filter news",
)
def get_news(
    region: str | None = Query(default=None),
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
    min_evidence_score: int = Query(default=0, ge=0, le=100),
    limit: int = Query(default=20, ge=1, le=100),
):
    articles = sample_news

    if region:
        articles = [
            article
            for article in articles
            if article.region.casefold() == region.casefold()
        ]

    if category:
        articles = [
            article
            for article in articles
            if article.category.casefold() == category.casefold()
        ]

    if source:
        articles = [
            article
            for article in articles
            if source.casefold() in article.source_name.casefold()
        ]

    articles = [
        article
        for article in articles
        if article.evidence_score >= min_evidence_score
    ]

    return articles[:limit]


@router.get(
    "/{article_id}",
    response_model=NewsArticle,
    summary="Get one news article",
)
def get_news_article(article_id: int):
    for article in sample_news:
        if article.id == article_id:
            return article

    raise HTTPException(
        status_code=404,
        detail="News article not found",
    )
    
"""Regression tests for the assessment backfill script and dry-run transactions.

Verifies:
- Database state and assessment count are identical before and after --dry-run.
- Image URLs remain unchanged after --dry-run.
- A real run creates eligible assessments and image updates.
- A second real run is idempotent.
- Rollback remains effective on SQLite.
"""

from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.models import CredibilityAssessmentModel, NewsArticleModel
from app.scripts.backfill import run_backfill


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    _SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = _SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def _seed_articles(db: Session) -> list[NewsArticleModel]:
    articles = [
        NewsArticleModel(
            title="NASA Discovers High-Value Exoplanet with Atmosphere in Goldilocks Zone",
            summary="NASA scientists report a major breakthrough in exoplanet analysis with direct imaging.",
            source_name="NASA",
            source_url="https://www.nasa.gov/press-release/exoplanet-2026",
            image_url=None,
            category="Science",
            region="Global",
            published_at=datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc),
        ),
        NewsArticleModel(
            title="Reuters Global Economic Summary on Clean Energy Investment Surges",
            summary="Reuters reports global capital inflows into renewable storage reached record highs this quarter.",
            source_name="Reuters",
            source_url="https://www.reuters.com/business/energy-investment-2026",
            image_url=None,
            category="Business",
            region="Global",
            published_at=datetime(2026, 8, 21, 11, 0, 0, tzinfo=timezone.utc),
        ),
        NewsArticleModel(
            title="Unverified Rumor from Unregistered Blog Spreads on Forum Boards",
            summary="A mysterious blog claim went viral without corroboration or official comment.",
            source_name="RandomBlog",
            source_url="https://random-unverified-blog.example.com/rumor",
            image_url=None,
            category="Tech",
            region="Global",
            published_at=datetime(2026, 8, 22, 12, 0, 0, tzinfo=timezone.utc),
        ),
    ]
    db.add_all(articles)
    db.commit()
    for a in articles:
        db.refresh(a)
    return articles


@pytest.mark.anyio
async def test_dry_run_preserves_database_state_and_assessment_count(
    db: Session,
) -> None:
    _seed_articles(db)

    # Record baseline state
    initial_assessments_count = db.scalar(
        select(func.count()).select_from(CredibilityAssessmentModel)
    )
    initial_articles = list(db.scalars(select(NewsArticleModel)).all())
    initial_images = {a.id: a.image_url for a in initial_articles}

    assert initial_assessments_count == 0
    assert all(img is None for img in initial_images.values())

    # Mock image fetch to simulate finding images for articles
    with patch(
        "app.scripts.backfill._fetch_og_image",
        new=AsyncMock(return_value="https://discovered.example.com/hero.jpg"),
    ):
        report = await run_backfill(
            dry_run=True,
            do_images=True,
            do_assessments=True,
            session=db,
        )

    # Report indicates prospective actions
    assert report.articles_inspected == 3
    assert report.images_updated == 3
    assert report.assessments_created == 2  # NASA and Reuters are eligible
    assert report.assessments_ineligible == 1  # RandomBlog is ineligible

    # Query DB: exactly zero assessments must exist, image URLs must be untouched
    current_assessments_count = db.scalar(
        select(func.count()).select_from(CredibilityAssessmentModel)
    )
    assert current_assessments_count == 0

    current_articles = list(db.scalars(select(NewsArticleModel)).all())
    assert len(current_articles) == len(initial_articles)
    for article in current_articles:
        assert article.image_url == initial_images[article.id]


@pytest.mark.anyio
async def test_dry_run_image_urls_remain_unchanged(db: Session) -> None:
    articles = _seed_articles(db)
    target = articles[0]
    assert target.image_url is None

    with patch(
        "app.scripts.backfill._fetch_og_image",
        new=AsyncMock(return_value="https://nasa.gov/new-hero.png"),
    ):
        report = await run_backfill(
            dry_run=True,
            do_images=True,
            do_assessments=False,
            session=db,
        )

    assert report.images_updated == 3
    # Refresh model from DB
    db.expire_all()
    fresh_article = db.get(NewsArticleModel, target.id)
    assert fresh_article is not None
    assert fresh_article.image_url is None


@pytest.mark.anyio
async def test_real_run_creates_eligible_assessments_and_image_updates(
    db: Session,
) -> None:
    _seed_articles(db)

    with patch(
        "app.scripts.backfill._fetch_og_image",
        new=AsyncMock(return_value="https://images.example.com/hero.jpg"),
    ):
        report = await run_backfill(
            dry_run=False,
            do_images=True,
            do_assessments=True,
            session=db,
        )

    assert report.images_updated == 3
    assert report.assessments_created == 2
    assert report.assessments_ineligible == 1

    # Verify persistent DB state
    db.expire_all()
    assessments = list(db.scalars(select(CredibilityAssessmentModel)).all())
    assert len(assessments) == 2

    assessed_article_ids = {a.news_article_id for a in assessments}
    nasa_article = db.scalar(
        select(NewsArticleModel).where(NewsArticleModel.source_name == "NASA")
    )
    reuters_article = db.scalar(
        select(NewsArticleModel).where(NewsArticleModel.source_name == "Reuters")
    )
    blog_article = db.scalar(
        select(NewsArticleModel).where(NewsArticleModel.source_name == "RandomBlog")
    )

    assert nasa_article is not None and nasa_article.id in assessed_article_ids
    assert reuters_article is not None and reuters_article.id in assessed_article_ids
    assert blog_article is not None and blog_article.id not in assessed_article_ids

    # Image URLs updated in database
    assert nasa_article.image_url == "https://images.example.com/hero.jpg"
    assert reuters_article.image_url == "https://images.example.com/hero.jpg"


@pytest.mark.anyio
async def test_second_real_run_is_idempotent(db: Session) -> None:
    _seed_articles(db)

    with patch(
        "app.scripts.backfill._fetch_og_image",
        new=AsyncMock(return_value="https://images.example.com/hero.jpg"),
    ):
        first_report = await run_backfill(
            dry_run=False,
            do_images=True,
            do_assessments=True,
            session=db,
        )

    assert first_report.assessments_created == 2
    assert first_report.images_updated == 3

    # Second run immediately following the first
    with patch(
        "app.scripts.backfill._fetch_og_image",
        new=AsyncMock(return_value="https://images.example.com/hero.jpg"),
    ):
        second_report = await run_backfill(
            dry_run=False,
            do_images=True,
            do_assessments=True,
            session=db,
        )

    # Second run should skip everything already processed
    assert second_report.assessments_created == 0
    assert second_report.assessments_skipped == 2
    assert second_report.assessments_ineligible == 1
    assert second_report.images_updated == 0
    assert second_report.images_skipped == 3

    # Database still has exactly 2 assessments
    db.expire_all()
    count = db.scalar(select(func.count()).select_from(CredibilityAssessmentModel))
    assert count == 2


def test_rollback_remains_effective_on_sqlite(db: Session) -> None:
    article = NewsArticleModel(
        title="NASA Test Article For Explicit SQLite Rollback Verification",
        summary="A verified article with sufficient content for scoring.",
        source_name="NASA",
        source_url="https://nasa.gov/article-rollback-test",
        image_url=None,
        category="Science",
        region="Global",
        published_at=datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc),
    )
    db.add(article)
    db.commit()
    db.refresh(article)

    from app.services.auto_assessment import AutomaticAssessmentService

    service = AutomaticAssessmentService()
    # Stage an assessment
    assessment = service.assess_article(article, db)
    assert assessment is not None

    # Rollback without committing
    db.rollback()

    # Verify 0 rows in SQLite credibility_assessments table
    persisted = list(db.scalars(select(CredibilityAssessmentModel)).all())
    assert len(persisted) == 0


@pytest.mark.anyio
async def test_refresh_dry_run_does_not_mutate_database(db: Session) -> None:
    _seed_articles(db)

    # Initial backfill
    await run_backfill(
        dry_run=False,
        do_images=False,
        do_assessments=True,
        refresh=False,
        session=db,
    )

    db.expire_all()
    initial_assessments = list(db.scalars(select(CredibilityAssessmentModel)).all())
    assert len(initial_assessments) == 2
    initial_scores = {a.id: a.credibility_score for a in initial_assessments}

    # Run refresh with --dry-run
    report = await run_backfill(
        dry_run=True,
        do_images=False,
        do_assessments=True,
        refresh=True,
        session=db,
    )
    assert report.articles_inspected == 3

    db.expire_all()
    current_assessments = list(db.scalars(select(CredibilityAssessmentModel)).all())
    assert len(current_assessments) == 2
    for a in current_assessments:
        assert a.credibility_score == initial_scores[a.id]

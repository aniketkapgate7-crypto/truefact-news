"""Tests for the automatic credibility assessment service.

All database operations use an in-memory SQLite instance.
No network requests are made.
"""

from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.models import CredibilityAssessmentModel, NewsArticleModel
from app.services.auto_assessment import (
    SOURCE_RELIABILITY_CONFIG,
    AutomaticAssessmentService,
    _content_quality_score,
    _evidence_quality_score,
    _lookup_source_reliability,
    get_registered_domain,
    match_corroborating_articles,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


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


def _make_article(
    db: Session,
    *,
    title: str = "NASA Scientists Discover Rare Exoplanet with Earth-like Properties",
    summary: str = (
        "Scientists at NASA's Jet Propulsion Laboratory announced the discovery "
        "of a rare exoplanet orbiting within the habitable zone of its host star. "
        "The findings, published in the Astrophysical Journal, represent a "
        "significant step toward understanding planetary formation."
    ),
    source_url: str = "https://www.nasa.gov/press-release/exoplanet-discovery",
    source_name: str = "NASA",
    category: str = "Science",
    image_url: str | None = None,
) -> NewsArticleModel:
    article = NewsArticleModel(
        title=title,
        summary=summary,
        source_name=source_name,
        source_url=source_url,
        image_url=image_url,
        category=category,
        region="Global",
        published_at=datetime(2026, 8, 18, 12, 0, 0, tzinfo=timezone.utc),
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


# ---------------------------------------------------------------------------
# Unit tests — source reliability & independence lookup
# ---------------------------------------------------------------------------


class TestSourceReliabilityLookup:
    def test_exact_match(self) -> None:
        assert (
            _lookup_source_reliability("https://nasa.gov/article")
            == SOURCE_RELIABILITY_CONFIG["nasa.gov"]
        )

    def test_subdomain_match(self) -> None:
        result = _lookup_source_reliability("https://science.nasa.gov/article")
        assert result == SOURCE_RELIABILITY_CONFIG["nasa.gov"]

    def test_unknown_source_returns_none(self) -> None:
        assert (
            _lookup_source_reliability("https://unknown-blog.example.com/post") is None
        )

    def test_reuters_match(self) -> None:
        assert (
            _lookup_source_reliability("https://reuters.com/news/article") is not None
        )

    def test_invalid_url_returns_none(self) -> None:
        assert _lookup_source_reliability("not-a-url") is None


class TestSourceIndependence:
    def test_subdomain_resolves_to_same_registered_domain(self) -> None:
        d1 = get_registered_domain("https://science.nasa.gov/earth/heat")
        d2 = get_registered_domain("https://www.nasa.gov/news-release/item")
        assert d1 == "nasa.gov"
        assert d2 == "nasa.gov"
        assert d1 == d2  # Same organization

    def test_independent_domains_differentiated(self) -> None:
        nasa = get_registered_domain("https://science.nasa.gov/article")
        esa = get_registered_domain("https://www.esa.int/article")
        bbc = get_registered_domain("https://feeds.bbci.co.uk/news/world")
        assert nasa == "nasa.gov"
        assert esa == "esa.int"
        assert bbc == "bbc.co.uk"
        assert len({nasa, esa, bbc}) == 3

    def test_same_organization_rejected_as_corroboration(self, db: Session) -> None:
        a1 = _make_article(
            db,
            title="European Heatwave Breaks Temperature Records Across France and Spain",
            source_url="https://science.nasa.gov/earth/europe-heat",
        )
        a2 = _make_article(
            db,
            title="NASA Earth Observatory Records Extreme European Heatwave Conditions",
            source_url="https://www.nasa.gov/earth/heat-record",
        )
        corrob = match_corroborating_articles(a1, [a2])
        # Both are nasa.gov -> must NOT be counted as independent corroboration
        assert len(corrob) == 0


class TestCorroborationMatching:
    def test_rejects_weak_single_word_overlap(self, db: Session) -> None:
        a1 = _make_article(
            db,
            title="NASA Launches New Space Telescope to Study Distant Galaxies",
            summary="Astronomers will observe star formation in deep space using infrared optics.",
            source_url="https://nasa.gov/telescope",
        )
        a2 = _make_article(
            db,
            title="European Parliament Passes Landmark AI Regulation Law",
            summary="Lawmakers in Europe agreed on regulations for frontier artificial intelligence models.",
            source_url="https://bbc.co.uk/news/ai-law",
        )
        corrob = match_corroborating_articles(a1, [a2])
        assert len(corrob) == 0

    def test_matches_genuine_independent_corroboration(self, db: Session) -> None:
        a1 = _make_article(
            db,
            title="Record Heatwave Scorches Southern Europe with Extreme Temperatures",
            summary="A massive series of heatwaves in Europe is breaking temperature records across Spain and Italy.",
            source_url="https://science.nasa.gov/earth/europes-scorching-summer",
        )
        a2 = _make_article(
            db,
            title="European Heatwave: Southern Europe Facing Extreme Record High Temperatures",
            summary="Climate scientists confirm record temperatures scorching southern Europe amid severe heatwave conditions.",
            source_url="https://www.esa.int/Observing_the_Earth/Europe_heatwave",
        )
        corrob = match_corroborating_articles(a1, [a2])
        assert len(corrob) == 1
        assert corrob[0].id == a2.id


# ---------------------------------------------------------------------------
# Unit tests — scoring helpers
# ---------------------------------------------------------------------------


class TestEvidenceQualityScore:
    def _article_with(
        self,
        summary: str,
        title: str = "Standard Article Title Length Here",
        category: str = "Science",
        image_url=None,
    ) -> NewsArticleModel:
        return NewsArticleModel(
            title=title,
            summary=summary,
            source_name="NASA",
            source_url="https://nasa.gov/article",
            image_url=image_url,
            category=category,
            region="Global",
            published_at=datetime(2026, 8, 18, 12, 0, 0, tzinfo=timezone.utc),
        )

    def test_long_summary_scores_higher(self) -> None:
        short = self._article_with("Brief." * 10)
        long = self._article_with(
            "This is a longer and more detailed article summary. " * 10
        )
        assert _evidence_quality_score(long) > _evidence_quality_score(short)

    def test_with_image_scores_higher_than_without(self) -> None:
        without = self._article_with("A detailed summary with plenty of words." * 5)
        with_img = self._article_with(
            "A detailed summary with plenty of words." * 5,
            image_url="https://nasa.gov/img.jpg",
        )
        assert _evidence_quality_score(with_img) > _evidence_quality_score(without)


class TestContentQualityScore:
    def _article_with(
        self, title: str, summary: str = "A" * 200, category: str = "Science"
    ) -> NewsArticleModel:
        return NewsArticleModel(
            title=title,
            summary=summary,
            source_name="NASA",
            source_url="https://nasa.gov/article",
            image_url=None,
            category=category,
            region="Global",
            published_at=datetime(2026, 8, 18, 12, 0, 0, tzinfo=timezone.utc),
        )

    def test_capped_at_40(self) -> None:
        article = self._article_with("A good title about science", category="Science")
        assert _content_quality_score(article) <= 40

    def test_title_with_question_mark_scores_lower(self) -> None:
        no_q = self._article_with("NASA Announces New Space Mission")
        with_q = self._article_with("Did NASA Discover Aliens?")
        assert _content_quality_score(no_q) > _content_quality_score(with_q)


# ---------------------------------------------------------------------------
# Integration tests — assess_article & recalculation
# ---------------------------------------------------------------------------


class TestAssessArticle:
    def test_creates_assessment_for_known_source(self, db: Session) -> None:
        article = _make_article(db)
        service = AutomaticAssessmentService()

        result = service.assess_article(article, db)
        db.commit()

        assert result is not None
        assert result.news_article_id == article.id
        assert 0 <= result.credibility_score <= 100

    def test_idempotency_when_no_new_evidence(self, db: Session) -> None:
        """When no new evidence exists, re-assessment returns None without mutating."""
        article = _make_article(db)
        service = AutomaticAssessmentService()

        first = service.assess_article(article, db)
        db.commit()
        assert first is not None
        original_score = first.credibility_score

        second = service.assess_article(article, db)
        assert second is None  # no new evidence -> unchanged

        existing = db.scalar(
            select(CredibilityAssessmentModel).where(
                CredibilityAssessmentModel.news_article_id == article.id
            )
        )
        assert existing is not None
        assert existing.credibility_score == original_score

    def test_recalculation_when_new_corroboration_exists(self, db: Session) -> None:
        """When a new independent article arrives, assessment recalculates with higher score."""
        a1 = _make_article(
            db,
            title="Record Heatwave Scorches Southern Europe with Extreme Temperatures",
            summary="A massive series of heatwaves in Europe is breaking temperature records across Spain and Italy.",
            source_url="https://science.nasa.gov/earth/heat",
        )
        service = AutomaticAssessmentService()
        first_assessment = service.assess_article(a1, db)
        db.commit()
        assert first_assessment is not None
        initial_score = first_assessment.credibility_score
        assert first_assessment.independent_source_count == 0

        # Now add independent corroborating story from ESA
        a2 = _make_article(
            db,
            title="European Heatwave: Southern Europe Facing Extreme Record High Temperatures",
            summary="Climate scientists confirm record temperatures scorching southern Europe amid severe heatwave conditions.",
            source_url="https://www.esa.int/Observing_the_Earth/Europe_heatwave",
        )
        # Assess a2
        service.assess_article(a2, db)
        db.commit()

        # Re-assess a1 with new corroborating candidate a2
        updated_assessment = service.assess_article(
            a1, db, all_articles=[a1, a2], force=True
        )
        db.commit()

        assert updated_assessment is not None
        assert updated_assessment.independent_source_count == 1
        assert updated_assessment.corroboration_score == 40
        assert updated_assessment.credibility_score > initial_score

    def test_does_not_assess_unknown_source(self, db: Session) -> None:
        article = _make_article(db, source_url="https://unknown-blog.example.com/post")
        service = AutomaticAssessmentService()

        result = service.assess_article(article, db)
        assert result is None

    def test_engagement_counts_not_in_score(self, db: Session) -> None:
        """Reposts and comments must never increase credibility_score."""
        article_low = _make_article(db)
        service = AutomaticAssessmentService()
        assessment = service.assess_article(article_low, db)
        db.commit()
        assert assessment is not None

        article_low.repost_count = 999_999
        article_low.comment_count = 999_999
        db.commit()

        stored = db.scalar(
            select(CredibilityAssessmentModel).where(
                CredibilityAssessmentModel.news_article_id == article_low.id
            )
        )
        assert stored is not None
        assert stored.credibility_score == assessment.credibility_score

    def test_method_version_recorded(self, db: Session) -> None:
        article = _make_article(db)
        service = AutomaticAssessmentService()
        result = service.assess_article(article, db)
        db.commit()

        assert result is not None
        assert result.method_version == "auto-v2"


# ---------------------------------------------------------------------------
# Integration tests — assess_batch
# ---------------------------------------------------------------------------


class TestAssessBatch:
    def test_batch_assesses_all_eligible(self, db: Session) -> None:
        _make_article(
            db,
            source_url="https://nasa.gov/article1",
            title="NASA Makes Big Discovery in Space Exploration Research",
        )
        _make_article(
            db,
            source_url="https://reuters.com/article2",
            title="Reuters Reports on Major Global Market Developments",
        )
        service = AutomaticAssessmentService()

        result = service.assess_batch(db)
        assert result.assessed_count == 2
        assert result.skipped_count == 0

    def test_batch_skips_already_assessed(self, db: Session) -> None:
        _make_article(db)
        service = AutomaticAssessmentService()

        first = service.assess_batch(db)
        assert first.assessed_count == 1

        second = service.assess_batch(db)
        assert second.assessed_count == 0
        assert second.skipped_count == 1

    def test_batch_marks_unknown_source_as_ineligible(self, db: Session) -> None:
        _make_article(db, source_url="https://unknown.example.com/post")
        service = AutomaticAssessmentService()

        result = service.assess_batch(db)
        assert result.ineligible_count == 1
        assert result.assessed_count == 0

    def test_batch_returns_assessed_article_ids(self, db: Session) -> None:
        article = _make_article(db)
        service = AutomaticAssessmentService()

        result = service.assess_batch(db)
        assert article.id in result.article_ids_assessed

    def test_batch_no_duplicate_assessment_records(self, db: Session) -> None:
        _make_article(db)
        service = AutomaticAssessmentService()

        service.assess_batch(db)
        db.commit()
        service.assess_batch(db)
        db.commit()

        count = len(list(db.scalars(select(CredibilityAssessmentModel)).all()))
        assert count == 1

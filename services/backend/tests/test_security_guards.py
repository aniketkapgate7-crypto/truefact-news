from collections.abc import Generator
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import Base, get_db
from app.main import app
from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.models.social_post import SocialPostModel
from app.schemas.verify import VerificationStatus

# Isolated in-memory SQLite database specifically for security test suite
sec_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SecSessionLocal = sessionmaker(
    bind=sec_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def override_sec_db() -> Generator[Session, None, None]:
    db = SecSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def sec_client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=sec_engine)
    app.dependency_overrides[get_db] = override_sec_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=sec_engine)


def _seed_sample_records() -> tuple[int, int]:
    """Seed sample article, assessment, and social post directly via DB session."""
    db = SecSessionLocal()
    try:
        article = NewsArticleModel(
            title="Seeded Test Article For Guard Checks",
            summary="Pre-seeded article to verify GET and PATCH guard behaviors.",
            source_name="TrueFact Desk",
            source_url=f"https://example.com/sec-test/{uuid4()}",
            category="Technology",
            region="Global",
            published_at=datetime.now(timezone.utc),
            evidence_score=85,
        )
        db.add(article)
        db.commit()
        db.refresh(article)

        assessment = CredibilityAssessmentModel(
            news_article_id=article.id,
            source_reliability_score=80,
            evidence_quality_score=85,
            corroboration_score=75,
            content_quality_score=80,
            credibility_score=80,
            supporting_evidence_count=2,
            contradicting_evidence_count=0,
            independent_source_count=2,
            primary_source_count=1,
            is_evolving=False,
            explanation="Initial evaluation.",
            review_status="automated",
        )
        db.add(assessment)

        post = SocialPostModel(
            news_article_id=article.id,
            platform="x",
            external_post_id=f"ext-{uuid4()}",
            post_url=f"https://x.com/example/status/{uuid4()}",
            view_count=100,
            like_count=10,
            comment_count=2,
            repost_count=1,
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        return article.id, post.id
    finally:
        db.close()


# ── 1. Default Configuration: All Mutation Endpoints Fail Closed (403) ──


def test_default_config_news_create_is_forbidden(sec_client: TestClient) -> None:
    res = sec_client.post(
        "/api/v1/news/",
        json={
            "title": "Unauthorized News Article",
            "summary": "Should be rejected because mutations are disabled by default.",
            "source_name": "TrueFact Desk",
            "source_url": "https://example.com/unauthorized-news",
            "category": "Technology",
            "region": "Global",
            "evidence_score": 80,
        },
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_news_patch_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.patch(
        f"/api/v1/news/{article_id}",
        json={"title": "Unauthorized Title Update"},
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_news_delete_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.delete(f"/api/v1/news/{article_id}")
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_credibility_create_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json={
            "source_reliability_score": 80,
            "evidence_quality_score": 85,
            "corroboration_score": 75,
            "content_quality_score": 80,
            "supporting_evidence_count": 2,
            "contradicting_evidence_count": 0,
            "independent_source_count": 2,
            "primary_source_count": 1,
            "is_evolving": False,
            "explanation": "Should be rejected.",
        },
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_credibility_patch_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.patch(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json={"source_reliability_score": 95},
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_credibility_delete_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.delete(f"/api/v1/news/{article_id}/credibility-assessment")
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_social_post_create_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.post(
        f"/api/v1/news/{article_id}/social-posts",
        json={
            "platform": "x",
            "external_post_id": "ext-unauthorized-1",
            "post_url": "https://x.com/example/status/unauth1",
            "view_count": 50,
            "like_count": 5,
            "comment_count": 0,
            "repost_count": 0,
        },
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_social_post_patch_is_forbidden(sec_client: TestClient) -> None:
    _, post_id = _seed_sample_records()
    res = sec_client.patch(
        f"/api/v1/social-posts/{post_id}",
        json={"like_count": 999},
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_social_post_delete_is_forbidden(sec_client: TestClient) -> None:
    _, post_id = _seed_sample_records()
    res = sec_client.delete(f"/api/v1/social-posts/{post_id}")
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


def test_default_config_editorial_patch_is_forbidden(sec_client: TestClient) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "in_review",
            "reviewer_name": "Unauthorized Attempt",
        },
    )
    assert res.status_code == 403
    assert (
        "Editorial mutations are disabled in this environment" in res.json()["detail"]
    )


# ── 2. Flag Isolation: Admin Flag Enables Admin, Does NOT Enable Editorial ──


def test_admin_flag_allows_news_crud(
    sec_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.core.auth import get_current_user
    from app.models.user import ApplicationUserModel, UserRole

    admin_user = ApplicationUserModel(
        id=uuid4(),
        auth_subject="sec_admin_sub",
        email="admin@truefact.test",
        role=UserRole.ADMIN,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: admin_user
    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    res = sec_client.post(
        "/api/v1/news/",
        json={
            "title": "Authorized Admin Story",
            "summary": "Created with enable_admin_mutations=True.",
            "source_name": "TrueFact Desk",
            "source_url": "https://example.com/authorized-admin-news",
            "category": "Technology",
            "region": "Global",
            "published_at": "2026-08-28T10:00:00Z",
            "evidence_score": 88,
        },
    )
    assert res.status_code == 201
    created_id = res.json()["id"]

    patch_res = sec_client.patch(
        f"/api/v1/news/{created_id}",
        json={"evidence_score": 94},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["evidence_score"] == 94

    del_res = sec_client.delete(f"/api/v1/news/{created_id}")
    assert del_res.status_code == 204


def test_admin_flag_does_not_enable_editorial_mutations(
    sec_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    article_id, _ = _seed_sample_records()
    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    monkeypatch.setattr(settings, "enable_editorial_mutations", False)

    res = sec_client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={"review_status": "in_review", "reviewer_name": "Editor"},
    )
    assert res.status_code == 403
    assert "Editorial mutations are disabled" in res.json()["detail"]


# ── 3. Flag Isolation: Editorial Flag Enables Editorial, Does NOT Enable Admin ──


def test_editorial_flag_allows_review_mutations(
    sec_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.core.auth import get_current_user
    from app.models.user import ApplicationUserModel, UserRole

    reviewer_user = ApplicationUserModel(
        id=uuid4(),
        auth_subject="sec_reviewer_sub",
        email="reviewer@truefact.test",
        role=UserRole.REVIEWER,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: reviewer_user
    article_id, _ = _seed_sample_records()
    monkeypatch.setattr(settings, "enable_editorial_mutations", True)

    res = sec_client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "in_review",
            "reviewer_name": "Authorized Desk Editor",
        },
    )
    assert res.status_code == 200
    assert res.json()["review_status"] == "in_review"
    assert res.json()["reviewer_name"] == "Authorized Desk Editor"


def test_editorial_flag_does_not_enable_admin_mutations(
    sec_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "enable_editorial_mutations", True)
    monkeypatch.setattr(settings, "enable_admin_mutations", False)

    res = sec_client.post(
        "/api/v1/news/",
        json={
            "title": "Attempted News Create Under Editorial Flag",
            "summary": "Should fail because admin mutations are disabled.",
            "source_name": "TrueFact Desk",
            "source_url": "https://example.com/editorial-only-news",
            "category": "Technology",
            "region": "Global",
            "published_at": "2026-08-28T10:00:00Z",
            "evidence_score": 75,
        },
    )
    assert res.status_code == 403
    assert "Administrative data mutations are disabled" in res.json()["detail"]


# ── 4. Header Bypass Resistance ──


@pytest.mark.parametrize(
    "spoofed_headers",
    [
        {"Authorization": "Bearer fake-token-12345"},
        {"X-Admin-Role": "superadmin"},
        {"X-User-Role": "editor"},
        {"X-Forwarded-For": "127.0.0.1"},
        {"X-Real-IP": "127.0.0.1"},
        {"Host": "localhost"},
    ],
)
def test_headers_cannot_bypass_disabled_mutations(
    sec_client: TestClient, spoofed_headers: dict[str, str]
) -> None:
    article_id, _ = _seed_sample_records()
    res = sec_client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={"review_status": "in_review", "reviewer_name": "Spoofed Caller"},
        headers=spoofed_headers,
    )
    assert res.status_code == 403
    assert "Editorial mutations are disabled" in res.json()["detail"]


# ── 5. Public GET Endpoints Remain 200 Accessible When Mutations Are Disabled ──


def test_public_get_endpoints_remain_accessible(sec_client: TestClient) -> None:
    article_id, post_id = _seed_sample_records()

    routes_to_test = [
        "/api/v1/news/",
        f"/api/v1/news/{article_id}",
        f"/api/v1/news/{article_id}/credibility-assessment",
        f"/api/v1/news/{article_id}/social-posts",
        f"/api/v1/news/{article_id}/engagement-summary",
        f"/api/v1/social-posts/{post_id}",
        "/api/v1/fact-checks/published",
        f"/api/v1/fact-checks/editorial/{article_id}",
        "/",
        "/health",
    ]

    for route in routes_to_test:
        res = sec_client.get(route)
        assert res.status_code in (200, 404), (
            f"Route {route} returned unexpected {res.status_code}"
        )
        if route in ("/", "/health", "/api/v1/news/", f"/api/v1/news/{article_id}"):
            assert res.status_code == 200, (
                f"Route {route} failed with {res.status_code}: {res.text}"
            )


# ── 6. Public POST /api/v1/verify Honesty and Accessibility ──


def test_verify_unmatched_claim_is_honest_and_accessible(
    sec_client: TestClient,
) -> None:
    """POST /verify must remain public, accessible when mutations are disabled, and never claim a queue submission."""
    res = sec_client.post(
        "/api/v1/verify",
        json={
            "claim_text": "An obscure unindexed claim about Martian ice caps 2026",
            "supporting_context": "Checking if this exists.",
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == VerificationStatus.INSUFFICIENT_EVIDENCE
    assert "No matching editorial fact check or automated assessment" in data["message"]
    assert "submitted" not in data["message"].lower()
    assert "editorial queue" not in str(data).lower()
    assert data["result"]["verdict"] is None
    assert data["result"]["reviewer"] is None
    assert data["result"]["matched_type"] == "no_match"

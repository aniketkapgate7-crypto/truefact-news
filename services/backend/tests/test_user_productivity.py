import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.auth import get_current_user
from app.db.database import Base, get_db
from app.main import app
from app.models.billing import SubscriptionModel
from app.models.news import NewsArticleModel
from app.models.user import ApplicationUserModel, UserRole
from app.models.user_productivity import UserSavedStoryModel


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db):
    user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="user_test_sub",
        email="testuser@example.com",
        display_name="Test User",
        role=UserRole.READER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_article(db):
    art = NewsArticleModel(
        id=101,
        title="Test Article Title",
        summary="Test Article Summary",
        source_name="Example News",
        source_url="https://news.example.com/world/article-101",
        category="world",
        region="global",
        published_at=datetime.now(timezone.utc),
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


@pytest.fixture
def client_free(db, test_user):
    def _get_db_override():
        yield db

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()


@pytest.fixture
def client_pro(db, test_user):
    sub = SubscriptionModel(
        id=uuid.uuid4(),
        user_id=test_user.id,
        provider="test",
        provider_subscription_id="sub_pro_test",
        provider_plan_id="pro_monthly",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="active",
        provider_status="active",
        current_slot="current",
        access_until=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(sub)
    db.commit()

    def _get_db_override():
        yield db

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()


# =====================================================================
# SAVED STORIES TESTS
# =====================================================================


def test_save_existing_article(client_free, test_article, db, test_user):
    resp = client_free.post(f"/api/v1/users/me/saved-stories/{test_article.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["article_id"] == test_article.id
    assert data["article_title"] == "Test Article Title"
    assert data["source_domain"] == "news.example.com"

    saved_in_db = (
        db.query(UserSavedStoryModel)
        .filter_by(user_id=test_user.id, article_id=test_article.id)
        .first()
    )
    assert saved_in_db is not None


def test_duplicate_save_story_is_idempotent(client_free, test_article):
    resp1 = client_free.post(f"/api/v1/users/me/saved-stories/{test_article.id}")
    assert resp1.status_code == 200

    resp2 = client_free.post(f"/api/v1/users/me/saved-stories/{test_article.id}")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == resp1.json()["id"]


def test_list_and_remove_saved_story(client_free, test_article):
    client_free.post(f"/api/v1/users/me/saved-stories/{test_article.id}")

    list_resp = client_free.get("/api/v1/users/me/saved-stories")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    del_resp = client_free.delete(f"/api/v1/users/me/saved-stories/{test_article.id}")
    assert del_resp.status_code == 200

    list_resp2 = client_free.get("/api/v1/users/me/saved-stories")
    assert list_resp2.json()["total"] == 0


def test_save_non_existent_article_returns_404(client_free):
    resp = client_free.post("/api/v1/users/me/saved-stories/999999")
    assert resp.status_code == 404


def test_cross_user_isolation_for_saved_stories(db, test_article):
    user1 = ApplicationUserModel(
        id=uuid.uuid4(), auth_subject="u1", email="u1@ex.com", display_name="U1"
    )
    user2 = ApplicationUserModel(
        id=uuid.uuid4(), auth_subject="u2", email="u2@ex.com", display_name="U2"
    )
    db.add_all([user1, user2])
    db.commit()

    saved1 = UserSavedStoryModel(user_id=user1.id, article_id=test_article.id)
    db.add(saved1)
    db.commit()

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: user2
    with TestClient(app) as client_user2:
        # User 2 tries to delete User 1's saved story -> returns 404
        del_resp = client_user2.delete(
            f"/api/v1/users/me/saved-stories/{test_article.id}"
        )
        assert del_resp.status_code == 404
    app.dependency_overrides.clear()


# =====================================================================
# SOURCE WATCHLIST TESTS
# =====================================================================


def test_free_user_watchlist_access_denied_403(client_free, test_article):
    resp = client_free.post(
        "/api/v1/users/me/source-watchlists", json={"article_id": test_article.id}
    )
    assert resp.status_code == 403
    assert "requires an active Pro subscription" in resp.json()["detail"]

    get_resp = client_free.get("/api/v1/users/me/source-watchlists")
    assert get_resp.status_code == 403


def test_pro_user_watchlist_create_list_delete(client_pro, test_article, db, test_user):
    resp = client_pro.post(
        "/api/v1/users/me/source-watchlists", json={"article_id": test_article.id}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_domain"] == "news.example.com"
    assert data["source_name_snapshot"] == "Example News"

    list_resp = client_pro.get("/api/v1/users/me/source-watchlists")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    w_id = data["id"]
    del_resp = client_pro.delete(f"/api/v1/users/me/source-watchlists/{w_id}")
    assert del_resp.status_code == 200

    list_resp2 = client_pro.get("/api/v1/users/me/source-watchlists")
    assert list_resp2.json()["total"] == 0


def test_expired_pro_user_watchlist_access_denied(db, test_user, test_article):
    expired_sub = SubscriptionModel(
        id=uuid.uuid4(),
        user_id=test_user.id,
        provider="test",
        provider_subscription_id="sub_expired",
        provider_plan_id="pro_monthly",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="active",
        provider_status="expired",
        current_slot="current",
        access_until=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(expired_sub)
    db.commit()

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as client_expired:
        resp = client_expired.post(
            "/api/v1/users/me/source-watchlists", json={"article_id": test_article.id}
        )
        assert resp.status_code == 403
    app.dependency_overrides.clear()

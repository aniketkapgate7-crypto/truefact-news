import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import app
from app.models import (  # Registers all models
    ApplicationUserModel,
    CredibilityAssessmentModel,
    NewsArticleModel,
    SocialPostModel,
    UserRole,
)

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def override_get_db() -> Generator[Session, None, None]:
    database = TestingSessionLocal()

    try:
        yield database
    finally:
        database.close()


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def admin_mutations_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """Explicitly enable administrative CRUD mutations and supply an authenticated admin user."""
    from app.core.auth import get_current_user
    from app.core.config import settings

    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    admin_user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="test_admin_sub",
        email="admin@truefact.test",
        display_name="Test Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: admin_user


@pytest.fixture()
def editorial_mutations_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """Explicitly enable editorial review mutations."""
    from app.core.auth import get_current_user
    from app.core.config import settings

    monkeypatch.setattr(settings, "enable_editorial_mutations", True)
    if get_current_user not in app.dependency_overrides:
        reviewer_user = ApplicationUserModel(
            id=uuid.uuid4(),
            auth_subject="test_reviewer_sub",
            email="reviewer@truefact.test",
            display_name="Test Reviewer",
            role=UserRole.REVIEWER,
            is_active=True,
        )
        app.dependency_overrides[get_current_user] = lambda: reviewer_user


@pytest.fixture()
def editorial_workspace_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """Explicitly enable editorial workspace route visibility for tests requesting this fixture."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "enable_editorial_workspace", True)

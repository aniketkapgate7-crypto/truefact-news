import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.entitlements import (
    EntitlementTier,
    FeatureKey,
    get_current_entitlements,
    get_current_user_effective_tier,
)
from app.db.database import Base
from app.models.user import ApplicationUserModel, UserRole
from app.services.billing.entitlement import calculate_effective_tier


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


@pytest.mark.parametrize(
    "provider_status,local_status,access_until_delta,expected_tier",
    [
        ("creating", "creating", None, "free"),
        ("creation_failed", "creation_failed", None, "free"),
        ("created", "active", None, "free"),
        ("authenticated", "active", None, "free"),
        ("pending", "active", None, "free"),
        ("paused", "active", 10, "free"),
        ("halted", "active", 10, "free"),
        ("expired", "active", -1, "free"),
        ("active", "active", 10, "pro"),
        ("active", "active", -1, "free"),
        ("active", "active", None, "free"),
        ("cancelled", "active", 10, "pro"),
        ("cancelled", "cancelled", -1, "free"),
        ("completed", "active", 10, "pro"),
        ("unknown_status", "active", 10, "free"),
    ],
)
def test_calculate_effective_tier_matrix(
    provider_status, local_status, access_until_delta, expected_tier
):
    now = datetime.now(timezone.utc)
    access_until = (
        now + timedelta(days=access_until_delta) if access_until_delta else None
    )

    tier = calculate_effective_tier(
        provider_status=provider_status,
        local_status=local_status,
        access_until=access_until,
    )
    assert tier == expected_tier


def test_rbac_roles_do_not_grant_pro_automatically(db):
    # Admin user without a pro subscription
    admin_user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="admin_sub",
        email="admin@example.com",
        display_name="Admin",
        role=UserRole.ADMIN,
    )
    # Reviewer user without a pro subscription
    reviewer_user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="reviewer_sub",
        email="reviewer@example.com",
        display_name="Reviewer",
        role=UserRole.REVIEWER,
    )
    db.add_all([admin_user, reviewer_user])
    db.commit()

    admin_tier = get_current_user_effective_tier(current_user=admin_user, db=db)
    reviewer_tier = get_current_user_effective_tier(current_user=reviewer_user, db=db)

    assert admin_tier == EntitlementTier.FREE
    assert reviewer_tier == EntitlementTier.FREE


def test_get_current_entitlements_structure(db):
    user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="user_sub",
        email="user@example.com",
        display_name="User",
    )
    db.add(user)
    db.commit()

    free_ent = get_current_entitlements(
        current_user=user, effective_tier=EntitlementTier.FREE
    )
    assert free_ent["effective_tier"] == "free"
    assert FeatureKey.SAVED_STORIES.value in free_ent["capabilities"]
    assert FeatureKey.SOURCE_WATCHLISTS.value not in free_ent["capabilities"]

    pro_ent = get_current_entitlements(
        current_user=user, effective_tier=EntitlementTier.PRO
    )
    assert pro_ent["effective_tier"] == "pro"
    assert FeatureKey.SAVED_STORIES.value in pro_ent["capabilities"]
    assert FeatureKey.SOURCE_WATCHLISTS.value in pro_ent["capabilities"]

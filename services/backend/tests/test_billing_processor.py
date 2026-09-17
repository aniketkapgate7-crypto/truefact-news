import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import Base
from app.models.billing import (
    BillingPaymentModel,
    BillingWebhookEventModel,
    SubscriptionModel,
)
from app.models.user import ApplicationUserModel
from app.services.billing.processor import (
    BillingEventProcessor,
)
from app.services.billing.provider import TestBillingProvider


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
def mock_provider():
    return TestBillingProvider()


def test_successful_event_processing(db: Session, mock_provider):
    user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="test_sub_1",
        email="test1@example.com",
        display_name="Test User 1",
    )
    db.add(user)
    db.commit()

    sub_id = uuid.uuid4()
    sub = SubscriptionModel(
        id=sub_id,
        user_id=user.id,
        provider="test",
        provider_subscription_id="sub_test_123",
        provider_plan_id="plan_1",
        plan_slug="pro-monthly",
        amount_subunits=1000,
        currency="USD",
        billing_interval="monthly",
        local_status="creating",
        provider_status="created",
    )
    db.add(sub)
    db.commit()

    event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_123",
        event_type="subscription.charged",
        payload_sha256="fakehash",
        normalized_schema_version=1,
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.charged",
            "provider_created_at": datetime.now(timezone.utc).isoformat(),
            "provider_subscription_id": "sub_test_123",
            "provider_plan_id": "plan_1",
            "provider_status": "active",
            "current_period_start": "2026-08-01T00:00:00+00:00",
            "current_period_end": "2026-09-01T00:00:00+00:00",
        },
        processing_status="pending",
    )
    db.add(event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processed = processor.claim_and_process_pending_events()

    assert processed == 1

    db.refresh(event)
    db.refresh(sub)

    assert event.processing_status == "processed"
    assert event.processing_attempts == 1
    assert event.processed_at is not None

    assert sub.local_status == "active"
    assert sub.provider_status == "active"
    assert sub.access_until == sub.current_period_end


def test_duplicate_delivery_is_idempotent(db: Session, mock_provider):
    event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_processed",
        event_type="subscription.charged",
        payload_sha256="fakehash",
        processing_status="processed",
        processing_attempts=1,
        processed_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processed = processor.claim_and_process_pending_events()
    assert processed == 0


def test_stale_event_rejected(db: Session, mock_provider):
    user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="test_sub_stale",
        email="test_stale@example.com",
        display_name="Test User Stale",
    )
    db.add(user)
    db.commit()

    now = datetime.now(timezone.utc)
    sub = SubscriptionModel(
        id=uuid.uuid4(),
        user_id=user.id,
        provider="test",
        provider_subscription_id="sub_stale",
        provider_plan_id="plan_1",
        plan_slug="pro-monthly",
        amount_subunits=1000,
        currency="USD",
        billing_interval="monthly",
        local_status="active",
        provider_status="active",
        last_provider_event_at=now,
        last_provider_event_id="evt_new",
    )
    db.add(sub)

    older_time = now - timedelta(days=1)
    event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_stale",
        event_type="subscription.charged",
        payload_sha256="fakehash",
        provider_created_at=older_time,
        normalized_schema_version=1,
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.charged",
            "provider_created_at": older_time.isoformat(),
            "provider_subscription_id": "sub_stale",
            "provider_status": "active",
        },
        processing_status="pending",
    )
    db.add(event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processed = processor.claim_and_process_pending_events()
    assert processed == 1

    db.refresh(event)
    assert event.processing_status == "ignored"


def test_retry_exhaustion(db: Session, mock_provider):
    event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_retry",
        event_type="subscription.charged",
        payload_sha256="fakehash",
        processing_status="retryable",
        processing_attempts=4,
        next_retry_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        normalized_schema_version=1,
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.charged",
            "provider_subscription_id": "missing_sub_id",
        },
    )
    db.add(event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processed = processor.claim_and_process_pending_events()
    assert processed == 1

    db.refresh(event)
    assert event.processing_status == "dead_letter"
    assert event.processing_attempts == 5
    assert event.next_retry_at is None


def test_duplicate_payment_event_deduplication(db: Session, mock_provider):
    user = ApplicationUserModel(
        id=uuid.uuid4(),
        auth_subject="test_sub_dup",
        email="test_dup@example.com",
        display_name="Test User Dup",
    )
    db.add(user)
    db.commit()

    sub_id = uuid.uuid4()
    sub = SubscriptionModel(
        id=sub_id,
        user_id=user.id,
        provider="test",
        provider_subscription_id="sub_pay",
        provider_plan_id="plan_1",
        plan_slug="pro-monthly",
        amount_subunits=1000,
        currency="USD",
        billing_interval="monthly",
        local_status="active",
        provider_status="active",
    )
    db.add(sub)

    payment = BillingPaymentModel(
        subscription_id=sub_id,
        provider="test",
        provider_payment_id="pay_123",
        provider_status="captured",
        amount_subunits=1000,
        currency="USD",
    )
    db.add(payment)
    db.commit()

    event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_dup_pay",
        event_type="payment.captured",
        payload_sha256="fakehash",
        normalized_schema_version=1,
        normalized_payload={
            "schema_version": 1,
            "event_type": "payment.captured",
            "provider_payment_id": "pay_123",
            "provider_subscription_id": "sub_pay",
            "provider_status": "captured",
            "amount_subunits": 1000,
            "currency": "USD",
        },
        processing_status="pending",
    )
    db.add(event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processor.claim_and_process_pending_events()

    db.refresh(event)
    assert event.processing_status == "processed"

    payments = (
        db.query(BillingPaymentModel).filter_by(provider_payment_id="pay_123").all()
    )
    assert len(payments) == 1


def test_internal_cron_endpoint(client: TestClient, db: Session, monkeypatch):
    monkeypatch.setattr(settings, "billing_enabled", True)
    monkeypatch.setattr(settings, "app_env", "test")

    class MockSecret:
        def get_secret_value(self):
            return "test_secret_123"

    monkeypatch.setattr(settings, "internal_cron_secret", MockSecret())

    res = client.post(
        "/api/v1/billing/internal/process-webhooks",
        headers={"Authorization": "Bearer test_secret_123"},
    )
    assert res.status_code == 200
    assert "processed_count" in res.json()


def test_internal_cron_endpoint_returns_404_in_non_dev(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "billing_enabled", True)
    monkeypatch.setattr(settings, "billing_provider", "test")
    monkeypatch.setattr(settings, "app_env", "production")

    class MockSecret:
        def get_secret_value(self):
            return "test_secret_123"

    monkeypatch.setattr(settings, "internal_cron_secret", MockSecret())

    res = client.post(
        "/api/v1/billing/internal/process-webhooks",
        headers={"Authorization": "Bearer test_secret_123"},
    )
    assert res.status_code == 404

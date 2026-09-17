import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from alembic.config import Config
from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from alembic import command
from app.core.config import settings
from app.db.database import Base
from app.models.billing import (
    BillingPaymentModel,
    BillingWebhookEventModel,
    SubscriptionModel,
)
from app.models.user import ApplicationUserModel
from app.schemas.billing_adapter import (
    build_normalized_envelope,
)
from app.services.billing.processor import (
    BillingEventProcessor,
    ClaimedEventData,
    StaleLeaseError,
)
from app.services.billing.provider import (
    RazorpayBillingProvider,
    TestBillingProvider,
)
from app.services.billing.worker import run_worker


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


# 1. Strict nested payload extraction & PII exclusion
def test_strict_nested_payload_extraction_and_pii_exclusion():
    raw_razorpay_body = {
        "entity": "event",
        "account_id": "acc_123",
        "event": "subscription.charged",
        "created_at": 1700000000,
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_123",
                    "plan_id": "plan_rzp_pro",
                    "customer_id": "cust_rzp_456",
                    "status": "active",
                    "current_start": 1700000000,
                    "current_end": 1702592000,
                    "notes": {"internal_secret": "do_not_store"},
                }
            },
            "customer": {
                "entity": {
                    "id": "cust_rzp_456",
                    "email": "user@example.com",
                    "contact": "+1234567890",
                    "card": {"number": "4111111111111111", "cvv": "123"},
                }
            },
        },
    }

    envelope = build_normalized_envelope("subscription.charged", raw_razorpay_body)

    assert envelope.event_type == "subscription.charged"
    assert envelope.provider_subscription_id == "sub_rzp_123"
    assert envelope.provider_plan_id == "plan_rzp_pro"
    assert envelope.provider_customer_id == "cust_rzp_456"
    assert envelope.provider_status == "active"
    assert envelope.current_period_start is not None
    assert envelope.current_period_end is not None

    dumped = envelope.model_dump(mode="json")
    # Verify PII fields are completely excluded
    for key in ["email", "contact", "card", "notes", "internal_secret", "raw_payload"]:
        assert key not in dumped


# 2. Historical event with no normalized envelope fails closed
def test_historical_event_no_envelope_fails_closed(db: Session, mock_provider):
    hist_event = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_hist_1",
        event_type="subscription.charged",
        payload_sha256="hash123",
        processing_status="pending",
        normalized_payload=None,
        normalized_schema_version=None,
    )
    db.add(hist_event)
    db.commit()

    processor = BillingEventProcessor(db, mock_provider, worker_id="w1")
    processor.claim_and_process_pending_events()

    db.refresh(hist_event)
    assert hist_event.processing_status == "dead_letter"
    assert hist_event.safe_failure_code == "missing_normalized_envelope"


# 3. Two-worker compare-and-set claim
def test_two_worker_compare_and_set_claim(db: Session, mock_provider):
    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_claim_test",
        event_type="subscription.charged",
        payload_sha256="hash_claim",
        normalized_payload={"schema_version": 1, "event_type": "subscription.charged"},
        processing_status="pending",
    )
    db.add(ev)
    db.commit()

    proc1 = BillingEventProcessor(db, mock_provider, worker_id="worker_1")
    proc2 = BillingEventProcessor(db, mock_provider, worker_id="worker_2")

    claimed1 = proc1.claim_pending_events(limit=10)
    assert len(claimed1) == 1
    assert claimed1[0].claimed_by == "worker_1"

    # Second worker attempts to claim concurrently -> returns empty
    claimed2 = proc2.claim_pending_events(limit=10)
    assert len(claimed2) == 0


# 4. Crash and expired-lease recovery
def test_crash_and_expired_lease_recovery(db: Session, mock_provider):
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_crash",
        event_type="subscription.charged",
        payload_sha256="hash_crash",
        normalized_payload={"schema_version": 1, "event_type": "subscription.charged"},
        processing_status="processing",
        claimed_by="dead_worker",
        claim_token="old_token",
        claimed_at=expired_time,
        lease_expires_at=expired_time,
        processing_attempts=1,
    )
    db.add(ev)
    db.commit()

    proc = BillingEventProcessor(db, mock_provider, worker_id="recovering_worker")
    claimed = proc.claim_pending_events(limit=10)

    assert len(claimed) == 1
    assert claimed[0].claimed_by == "recovering_worker"
    assert claimed[0].claim_token != "old_token"
    assert claimed[0].processing_attempts == 2


# 5. Stale worker rejected by claim_token
def test_stale_worker_rejected_by_claim_token(db: Session, mock_provider):
    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_stale_worker",
        event_type="subscription.charged",
        payload_sha256="hash_stale_w",
        normalized_payload={"schema_version": 1, "event_type": "subscription.charged"},
        processing_status="processing",
        claimed_by="new_worker",
        claim_token="new_valid_token",
        claimed_at=datetime.now(timezone.utc),
        lease_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        processing_attempts=2,
    )
    db.add(ev)
    db.commit()

    stale_item = ClaimedEventData(
        event_id=ev.id,
        claim_token="old_stale_token",  # Mismatched token
        claimed_by="old_worker",  # Mismatched worker
        event_type="subscription.charged",
        provider_event_id="evt_stale_worker",
        provider_created_at=None,
        normalized_payload={},
        normalized_schema_version=1,
        processing_attempts=1,
    )

    proc = BillingEventProcessor(db, mock_provider, worker_id="old_worker")
    with pytest.raises(StaleLeaseError):
        proc._finalize_event(stale_item, final_status="processed")


# 6. Authenticated and updated events do not grant Pro
def test_authenticated_and_updated_events_do_not_grant_pro(db: Session, mock_provider):
    uid = uuid.uuid4()
    sub_id = uuid.uuid4()

    user = ApplicationUserModel(
        id=uid,
        auth_subject=f"sub_{uid}",
        email="auth_test@example.com",
        display_name="Auth Test User",
    )
    sub = SubscriptionModel(
        id=sub_id,
        user_id=uid,
        provider="test",
        provider_subscription_id="sub_auth_123",
        provider_plan_id="plan_1",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="creating",
        provider_status="created",
        entitlement_tier="free",
    )
    db.add_all([user, sub])
    db.commit()

    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_auth_1",
        event_type="subscription.authenticated",
        payload_sha256="hash_auth",
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.authenticated",
            "provider_subscription_id": "sub_auth_123",
            "provider_status": "authenticated",
        },
        processing_status="pending",
    )
    db.add(ev)
    db.commit()

    proc = BillingEventProcessor(db, mock_provider, worker_id="w1")
    proc.claim_and_process_pending_events()

    db.refresh(sub)
    assert sub.provider_status == "authenticated"
    assert sub.local_status == "creating"
    assert sub.entitlement_tier == "free"


# 7. Payment authorized/captured alone does not grant Pro
def test_payment_authorized_or_captured_alone_does_not_grant_pro(
    db: Session, mock_provider
):
    uid = uuid.uuid4()
    sub_id = uuid.uuid4()

    user = ApplicationUserModel(
        id=uid,
        auth_subject=f"sub_{uid}",
        email="pay_test@example.com",
        display_name="Pay Test User",
    )
    sub = SubscriptionModel(
        id=sub_id,
        user_id=uid,
        provider="test",
        provider_subscription_id="sub_pay_456",
        provider_plan_id="pro_monthly",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="creating",
        provider_status="created",
        entitlement_tier="free",
    )
    db.add_all([user, sub])
    db.commit()

    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_pay_auth",
        event_type="payment.authorized",
        payload_sha256="hash_pay_auth",
        normalized_payload={
            "schema_version": 1,
            "event_type": "payment.authorized",
            "provider_payment_id": "pay_auth_999",
            "provider_subscription_id": "sub_pay_456",
            "provider_status": "authorized",
            "amount_subunits": 1000,
            "currency": "INR",
        },
        processing_status="pending",
    )
    db.add(ev)
    db.commit()

    proc = BillingEventProcessor(db, mock_provider, worker_id="w1")
    proc.claim_and_process_pending_events()

    db.refresh(sub)
    assert sub.entitlement_tier == "free"
    pmt = (
        db.query(BillingPaymentModel)
        .filter_by(provider_payment_id="pay_auth_999")
        .first()
    )
    assert pmt is not None
    assert pmt.provider_status == "authorized"


# 8. Payment currency mismatch fails closed (dead_letter)
def test_payment_currency_mismatch_fails_closed(db: Session, mock_provider):
    uid = uuid.uuid4()
    sub_id = uuid.uuid4()

    user = ApplicationUserModel(
        id=uid,
        auth_subject=f"sub_{uid}",
        email="mismatch@example.com",
        display_name="Mismatch User",
    )
    sub = SubscriptionModel(
        id=sub_id,
        user_id=uid,
        provider="test",
        provider_subscription_id="sub_mismatch",
        provider_plan_id="pro_monthly",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="active",
        provider_status="active",
    )
    db.add_all([user, sub])
    db.commit()

    ev = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_mismatch",
        event_type="payment.captured",
        payload_sha256="hash_mm",
        normalized_payload={
            "schema_version": 1,
            "event_type": "payment.captured",
            "provider_payment_id": "pay_bad_curr",
            "provider_subscription_id": "sub_mismatch",
            "provider_status": "captured",
            "amount_subunits": 1000,
            "currency": "USD",  # Mismatch (local plan is INR)
        },
        processing_status="pending",
    )
    db.add(ev)
    db.commit()

    proc = BillingEventProcessor(db, mock_provider, worker_id="w1")
    proc.claim_and_process_pending_events()

    db.refresh(ev)
    assert ev.processing_status == "dead_letter"
    assert "currency mismatch" in ev.safe_failure_code.lower()


# 9. Immediate versus cycle-end cancellation
def test_immediate_versus_cycle_end_cancellation(db: Session, mock_provider):
    uid = uuid.uuid4()
    sub_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    future_end = now + timedelta(days=20)

    user = ApplicationUserModel(
        id=uid,
        auth_subject=f"sub_{uid}",
        email="cancel_test@example.com",
        display_name="Cancel User",
    )
    sub = SubscriptionModel(
        id=sub_id,
        user_id=uid,
        provider="test",
        provider_subscription_id="sub_cancel_test",
        provider_plan_id="pro_monthly",
        plan_slug="pro_monthly",
        amount_subunits=1000,
        currency="INR",
        billing_interval="monthly",
        local_status="active",
        provider_status="active",
        current_period_end=future_end,
        access_until=future_end,
        entitlement_tier="pro",
    )
    db.add_all([user, sub])
    db.commit()

    # Cycle-end cancellation
    ev_cycle = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_cancel_cycle",
        event_type="subscription.cancelled",
        payload_sha256="hash_cc",
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.cancelled",
            "provider_subscription_id": "sub_cancel_test",
            "provider_status": "cancelled",
            "cancel_at_period_end": True,
            "current_period_end": future_end.isoformat(),
        },
        processing_status="pending",
    )
    db.add(ev_cycle)
    db.commit()

    proc = BillingEventProcessor(db, mock_provider, worker_id="w1")
    proc.claim_and_process_pending_events()

    db.refresh(sub)
    assert sub.cancel_at_period_end is True
    assert sub.local_status == "active"
    assert sub.entitlement_tier == "pro"  # Retains pro access until period end

    # Immediate cancellation
    ev_imm = BillingWebhookEventModel(
        provider="test",
        provider_event_id="evt_cancel_imm",
        event_type="subscription.cancelled",
        payload_sha256="hash_ci",
        normalized_payload={
            "schema_version": 1,
            "event_type": "subscription.cancelled",
            "provider_subscription_id": "sub_cancel_test",
            "provider_status": "cancelled",
            "cancel_at_period_end": False,
            "ended_at": now.isoformat(),
        },
        processing_status="pending",
    )
    db.add(ev_imm)
    db.commit()

    proc.claim_and_process_pending_events()

    db.refresh(sub)
    assert sub.local_status == "cancelled"
    assert sub.entitlement_tier == "free"  # Immediate drop to free


# 10. Razorpay adapter performs zero network calls
def test_razorpay_adapter_performs_zero_network_calls(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_key")
    monkeypatch.setattr(settings, "razorpay_key_secret", SecretStr("rzp_test_secret"))

    provider = RazorpayBillingProvider()
    with pytest.raises(NotImplementedError):
        provider.create_subscription("123", "plan_1")

    with pytest.raises(NotImplementedError):
        provider.fetch_subscription("sub_123")

    with pytest.raises(NotImplementedError):
        provider.fetch_payment("pay_123")


# 11. Bounded CLI worker execution
def test_bounded_cli_worker_execution(db: Session, mock_provider, monkeypatch):
    monkeypatch.setattr(settings, "billing_enabled", True)
    monkeypatch.setattr(settings, "billing_provider", "test")

    exit_code = run_worker(batch_size=10, max_batches=1, worker_id="test_worker")
    assert exit_code == 0


# 12. Migration round-trip on temporary SQLite database
def test_migration_roundtrip_on_temp_sqlite_db():
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_path = db_file.name
    db_file.close()

    try:
        cfg = Config("alembic.ini")
        cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

        # Upgrade to head
        command.upgrade(cfg, "head")
        # Downgrade to 410dc7af25ff
        command.downgrade(cfg, "410dc7af25ff")
        # Upgrade back to head
        command.upgrade(cfg, "head")
    finally:
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass

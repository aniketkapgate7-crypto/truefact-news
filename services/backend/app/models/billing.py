import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class BillingCustomerModel(Base):
    __tablename__ = "billing_customers"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("application_users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "provider", name="uq_billing_customer_user_provider"
        ),
        UniqueConstraint(
            "provider", "provider_customer_id", name="uq_billing_customer_provider_id"
        ),
    )


class SubscriptionModel(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("application_users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    billing_customer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("billing_customers.id", ondelete="RESTRICT"),
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_subscription_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    provider_plan_id: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    amount_subunits: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    billing_interval: Mapped[str] = mapped_column(String(50), nullable=False)

    provider_status: Mapped[str] = mapped_column(String(50), nullable=False)
    local_status: Mapped[str] = mapped_column(String(50), nullable=False)
    entitlement_tier: Mapped[str] = mapped_column(
        String(50), default="free", nullable=False
    )

    access_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    current_period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    cancellation_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    last_provider_event_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_provider_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    current_slot: Mapped[str | None] = mapped_column(String(10), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_subscription_id",
            name="uq_subscription_provider_sub_id",
        ),
        UniqueConstraint(
            "user_id", "current_slot", name="uq_subscription_user_current_slot"
        ),
        CheckConstraint("amount_subunits >= 0", name="chk_amount_non_negative"),
        CheckConstraint("current_slot IN ('current')", name="chk_current_slot_value"),
    )


class BillingWebhookEventModel(Base):
    __tablename__ = "billing_webhook_events"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    processing_status: Mapped[str] = mapped_column(String(50), nullable=False)
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="RESTRICT"),
        nullable=True,
    )
    safe_failure_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    processing_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    normalized_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    normalized_schema_version: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    claimed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    claim_token: Mapped[str | None] = mapped_column(String(36), nullable=True)
    claimed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    lease_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_event_id", name="uq_webhook_provider_event_id"
        ),
    )


class BillingPaymentModel(Base):
    __tablename__ = "billing_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_payment_id: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_status: Mapped[str] = mapped_column(String(50), nullable=False)
    amount_subunits: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_payment_id", name="uq_payment_provider_payment_id"
        ),
        CheckConstraint("amount_subunits >= 0", name="chk_payment_amount_non_negative"),
    )

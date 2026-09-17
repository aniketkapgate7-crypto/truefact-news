import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.billing import (
    BillingPaymentModel,
    BillingWebhookEventModel,
    SubscriptionModel,
)
from app.schemas.billing_adapter import NormalizedWebhookEnvelope
from app.services.billing.entitlement import calculate_effective_tier
from app.services.billing.plans import get_plan_by_slug
from app.services.billing.provider import BillingProvider

logger = logging.getLogger(__name__)

MAX_RETRIES = 5
DEFAULT_LEASE_SECONDS = 300


class TerminalProcessingError(Exception):
    """An error that should fail closed without further retry (dead_letter)."""

    pass


class RetryableProcessingError(Exception):
    """An error that should be retried after exponential backoff."""

    pass


class StaleLeaseError(Exception):
    """Raised when a worker attempts to finalize an event whose lease was lost."""

    pass


@dataclass(frozen=True)
class ClaimedEventData:
    event_id: uuid.UUID
    claim_token: str
    claimed_by: str
    event_type: str
    provider_event_id: str
    provider_created_at: datetime | None
    normalized_payload: dict[str, Any] | None
    normalized_schema_version: int | None
    processing_attempts: int


class BillingEventProcessor:
    def __init__(
        self,
        db: Session,
        provider: BillingProvider,
        worker_id: str = "default_worker",
        lease_seconds: int = DEFAULT_LEASE_SECONDS,
    ):
        self.db = db
        self.provider = provider
        self.worker_id = worker_id
        self.lease_seconds = lease_seconds

    def _get_backoff_timedelta(self, attempt: int) -> timedelta:
        # 1m, 5m, 1h, 12h, 24h
        intervals = [
            timedelta(minutes=1),
            timedelta(minutes=5),
            timedelta(hours=1),
            timedelta(hours=12),
            timedelta(hours=24),
        ]
        idx = max(0, min(attempt, len(intervals) - 1))
        return intervals[idx]

    def claim_pending_events(self, limit: int = 50) -> list[ClaimedEventData]:
        """
        Atomically claim eligible events using a compare-and-set query.
        Transaction 1: Claims lease and commits.
        Returns immutable ClaimedEventData list.
        """
        now = datetime.now(timezone.utc)
        lease_expiry = now + timedelta(seconds=self.lease_seconds)

        # 1. Identify eligible event IDs
        eligible_stmt = (
            select(BillingWebhookEventModel.id)
            .where(
                (
                    (BillingWebhookEventModel.processing_status == "pending")
                    | (
                        (BillingWebhookEventModel.processing_status == "retryable")
                        & (BillingWebhookEventModel.next_retry_at <= now)
                    )
                    | (
                        (BillingWebhookEventModel.processing_status == "processing")
                        & (BillingWebhookEventModel.lease_expires_at < now)
                    )
                )
                & (BillingWebhookEventModel.processing_attempts < MAX_RETRIES)
            )
            .order_by(BillingWebhookEventModel.received_at.asc())
            .limit(limit)
        )

        # PostgreSQL supports SKIP LOCKED; SQLite falls back to standard query
        try:
            eligible_stmt = eligible_stmt.with_for_update(skip_locked=True)
        except Exception:
            pass

        eligible_ids = list(self.db.scalars(eligible_stmt).all())
        if not eligible_ids:
            return []

        claimed_records: list[ClaimedEventData] = []

        # 2. Compare-and-Set claim for each eligible ID
        for ev_id in eligible_ids:
            claim_token = str(uuid.uuid4())

            # Fetch current attempts count
            ev = self.db.get(BillingWebhookEventModel, ev_id)
            if not ev:
                continue

            attempts = ev.processing_attempts + 1

            # Atomic compare-and-set update
            update_stmt = (
                update(BillingWebhookEventModel)
                .where(
                    BillingWebhookEventModel.id == ev_id,
                    (
                        (
                            BillingWebhookEventModel.processing_status.in_(
                                ["pending", "retryable"]
                            )
                        )
                        | (
                            (BillingWebhookEventModel.processing_status == "processing")
                            & (BillingWebhookEventModel.lease_expires_at < now)
                        )
                    ),
                )
                .values(
                    processing_status="processing",
                    claimed_by=self.worker_id,
                    claim_token=claim_token,
                    claimed_at=now,
                    lease_expires_at=lease_expiry,
                    processing_attempts=attempts,
                )
            )

            result = self.db.execute(update_stmt)
            if result.rowcount > 0:
                claimed_records.append(
                    ClaimedEventData(
                        event_id=ev.id,
                        claim_token=claim_token,
                        claimed_by=self.worker_id,
                        event_type=ev.event_type,
                        provider_event_id=ev.provider_event_id,
                        provider_created_at=ev.provider_created_at,
                        normalized_payload=ev.normalized_payload,
                        normalized_schema_version=ev.normalized_schema_version,
                        processing_attempts=attempts,
                    )
                )

        self.db.commit()
        return claimed_records

    def claim_and_process_pending_events(self, limit: int = 50) -> int:
        """Convenience method to claim and process a batch of events."""
        claimed = self.claim_pending_events(limit=limit)
        processed_count = 0

        for item in claimed:
            try:
                self.process_single_claimed_event(item)
                processed_count += 1
            except Exception as e:
                logger.error(f"Error executing claimed event {item.event_id}: {e}")

        return processed_count

    def process_single_claimed_event(self, item: ClaimedEventData) -> None:
        """
        Process a claimed event outside the claim transaction and finalize it safely in Transaction 2.
        """
        now = datetime.now(timezone.utc)

        # Fail closed on historical rows without normalized envelope
        if not item.normalized_payload:
            self._finalize_event(
                item=item,
                final_status="dead_letter",
                safe_failure_code="missing_normalized_envelope",
            )
            return

        try:
            envelope = NormalizedWebhookEnvelope.model_validate(item.normalized_payload)

            # Execute business logic in isolated savepoint/sub-transaction
            with self.db.begin_nested():
                final_status = self._handle_envelope_logic(item, envelope)

            # Finalize in short atomic transaction
            self._finalize_event(item=item, final_status=final_status)

        except TerminalProcessingError as e:
            logger.error(f"Terminal error for event {item.event_id}: {e}")
            self._finalize_event(
                item=item,
                final_status="dead_letter",
                safe_failure_code=str(e)[:100],
            )
        except RetryableProcessingError as e:
            logger.warning(f"Retryable error for event {item.event_id}: {e}")
            next_retry = (
                None
                if item.processing_attempts >= MAX_RETRIES
                else now + self._get_backoff_timedelta(item.processing_attempts - 1)
            )
            final_status = (
                "dead_letter"
                if item.processing_attempts >= MAX_RETRIES
                else "retryable"
            )
            self._finalize_event(
                item=item,
                final_status=final_status,
                safe_failure_code=str(e)[:100],
                next_retry_at=next_retry,
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error during event {item.event_id}: {e}")
            raise
        except Exception as e:
            logger.exception(f"Unhandled exception during event {item.event_id}: {e}")
            next_retry = (
                None
                if item.processing_attempts >= MAX_RETRIES
                else now + self._get_backoff_timedelta(item.processing_attempts - 1)
            )
            final_status = (
                "dead_letter"
                if item.processing_attempts >= MAX_RETRIES
                else "retryable"
            )
            self._finalize_event(
                item=item,
                final_status=final_status,
                safe_failure_code="unhandled_exception",
                next_retry_at=next_retry,
            )

    def _finalize_event(
        self,
        item: ClaimedEventData,
        final_status: str,
        safe_failure_code: str | None = None,
        next_retry_at: datetime | None = None,
    ) -> None:
        """
        Finalization Transaction 2: Ensures lease token and claimed_by still match.
        Stale worker fails to finalize if lease was lost.
        """
        now = datetime.now(timezone.utc)

        update_stmt = (
            update(BillingWebhookEventModel)
            .where(
                BillingWebhookEventModel.id == item.event_id,
                BillingWebhookEventModel.processing_status == "processing",
                BillingWebhookEventModel.claimed_by == item.claimed_by,
                BillingWebhookEventModel.claim_token == item.claim_token,
            )
            .values(
                processing_status=final_status,
                safe_failure_code=safe_failure_code[:100]
                if safe_failure_code
                else None,
                next_retry_at=next_retry_at,
                processed_at=now if final_status in ("processed", "ignored") else None,
                claimed_by=None,
                claim_token=None,
                claimed_at=None,
                lease_expires_at=None,
            )
        )

        res = self.db.execute(update_stmt)
        if res.rowcount == 0:
            self.db.rollback()
            raise StaleLeaseError(
                f"Worker {item.claimed_by} lost lease for event {item.event_id}"
            )

        self.db.commit()

    def _handle_envelope_logic(
        self, item: ClaimedEventData, envelope: NormalizedWebhookEnvelope
    ) -> str:
        """
        Applies domain semantics to billing models. Returns final processing status ('processed' or 'ignored').
        """
        event_type = envelope.event_type

        if event_type in (
            "subscription.authenticated",
            "subscription.activated",
            "subscription.charged",
            "subscription.updated",
            "subscription.resumed",
            "subscription.cancelled",
            "subscription.halted",
            "subscription.paused",
            "subscription.completed",
        ):
            return self._apply_subscription_event(item, envelope)
        elif event_type in ("payment.authorized", "payment.captured", "payment.failed"):
            return self._apply_payment_event(item, envelope)
        else:
            logger.info(f"Ignoring supported-but-unused event type: {event_type}")
            return "ignored"

    def _apply_subscription_event(
        self, item: ClaimedEventData, envelope: NormalizedWebhookEnvelope
    ) -> str:
        sub_id = envelope.provider_subscription_id
        if not sub_id:
            raise TerminalProcessingError(
                "Missing provider_subscription_id in envelope"
            )

        subscription = (
            self.db.query(SubscriptionModel)
            .filter_by(
                provider=self.provider.provider_name, provider_subscription_id=sub_id
            )
            .first()
        )

        if not subscription:
            # Subscription not found locally -> retryable orphan event
            raise RetryableProcessingError(f"Subscription {sub_id} not found locally")

        # Stale event check
        event_time = envelope.provider_created_at or datetime.now(timezone.utc)
        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)

        last_event_at = subscription.last_provider_event_at
        if last_event_at and last_event_at.tzinfo is None:
            last_event_at = last_event_at.replace(tzinfo=timezone.utc)

        if last_event_at and event_time < last_event_at:
            logger.info(
                f"Stale event {item.event_id} ignored for subscription {subscription.id}"
            )
            return "ignored"

        event_type = envelope.event_type
        now = datetime.now(timezone.utc)

        # Plan verification if provider_plan_id supplied
        if envelope.provider_plan_id and subscription.provider_plan_id:
            if envelope.provider_plan_id != subscription.provider_plan_id:
                raise TerminalProcessingError("Provider plan ID mismatch")

        # Update provider_status if provided
        if envelope.provider_status:
            subscription.provider_status = envelope.provider_status

        # Absolute period dates update
        if envelope.current_period_start:
            subscription.current_period_start = envelope.current_period_start
        if envelope.current_period_end:
            subscription.current_period_end = envelope.current_period_end

        # Handle specific event semantics
        if event_type == "subscription.authenticated":
            # State updated to authenticated, but tier stays free
            pass
        elif event_type in (
            "subscription.activated",
            "subscription.charged",
            "subscription.resumed",
        ):
            if (
                subscription.provider_status == "active"
                and subscription.current_period_end
            ):
                subscription.access_until = subscription.current_period_end
                if subscription.local_status == "creating":
                    subscription.local_status = "active"
        elif event_type == "subscription.updated":
            # Update dates if active, but does not grant Pro by itself
            if (
                subscription.provider_status == "active"
                and subscription.current_period_end
            ):
                subscription.access_until = subscription.current_period_end
        elif event_type == "subscription.cancelled":
            if envelope.cancel_at_period_end:
                subscription.cancel_at_period_end = True
                subscription.cancellation_requested_at = now
            else:
                subscription.cancel_at_period_end = False
                subscription.local_status = "cancelled"
                subscription.cancelled_at = envelope.ended_at or now
                subscription.access_until = now
        elif event_type in ("subscription.halted", "subscription.paused"):
            subscription.access_until = now

        # Update metadata timestamp
        subscription.last_provider_event_at = event_time
        subscription.last_provider_event_id = item.provider_event_id

        # Synchronize effective entitlement tier
        subscription.entitlement_tier = calculate_effective_tier(
            provider_status=subscription.provider_status,
            local_status=subscription.local_status,
            access_until=subscription.access_until,
        )

        return "processed"

    def _apply_payment_event(
        self, item: ClaimedEventData, envelope: NormalizedWebhookEnvelope
    ) -> str:
        payment_id = envelope.provider_payment_id
        if not payment_id:
            raise TerminalProcessingError("Missing provider_payment_id in envelope")

        sub_id = envelope.provider_subscription_id
        subscription = None

        if sub_id:
            subscription = (
                self.db.query(SubscriptionModel)
                .filter_by(
                    provider=self.provider.provider_name,
                    provider_subscription_id=sub_id,
                )
                .first()
            )
            if not subscription:
                raise RetryableProcessingError(
                    f"Subscription {sub_id} not found locally"
                )

        # Idempotent payment upsert
        existing_payment = (
            self.db.query(BillingPaymentModel)
            .filter_by(
                provider=self.provider.provider_name,
                provider_payment_id=payment_id,
            )
            .first()
        )

        if existing_payment:
            existing_payment.provider_status = (
                envelope.provider_status or existing_payment.provider_status
            )
        else:
            if not subscription:
                raise TerminalProcessingError(
                    "Cannot record payment without subscription relationship"
                )

            # Verify currency if supplied against subscription / plan currency
            target_currency = subscription.currency
            if not target_currency:
                plan = get_plan_by_slug(subscription.plan_slug)
                if plan:
                    target_currency = plan.currency

            if (
                envelope.currency
                and target_currency
                and envelope.currency.upper() != target_currency.upper()
            ):
                raise TerminalProcessingError("Payment currency mismatch")

            new_payment = BillingPaymentModel(
                subscription_id=subscription.id,
                provider=self.provider.provider_name,
                provider_payment_id=payment_id,
                provider_status=envelope.provider_status or "captured",
                amount_subunits=envelope.amount_subunits
                or subscription.amount_subunits,
                currency=envelope.currency or subscription.currency,
                paid_at=envelope.provider_created_at or datetime.now(timezone.utc),
            )
            self.db.add(new_payment)

        # Payment events update payment audit logs but NEVER grant Pro by themselves
        return "processed"

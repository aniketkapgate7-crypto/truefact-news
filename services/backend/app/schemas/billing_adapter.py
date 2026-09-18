from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NormalizedWebhookEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: int = 1
    event_type: str
    provider_created_at: datetime | None = None

    provider_subscription_id: str | None = None
    provider_payment_id: str | None = None
    provider_customer_id: str | None = None
    provider_plan_id: str | None = None
    provider_status: str | None = None

    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool | None = None
    ended_at: datetime | None = None

    amount_subunits: int | None = None
    currency: str | None = None


# Razorpay-specific nested payload schemas for strict ingestion parsing
class RazorpaySubscriptionEntity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str | None = None
    plan_id: str | None = None
    customer_id: str | None = None
    status: str | None = None
    current_start: int | None = None
    current_end: int | None = None
    ended_at: int | None = None
    ended_by: str | None = None


class RazorpayPaymentEntity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str | None = None
    subscription_id: str | None = None
    status: str | None = None
    amount: int | None = None
    currency: str | None = None
    created_at: int | None = None


class RazorpayWebhookPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    entity: str | None = None
    account_id: str | None = None
    event: str | None = None
    created_at: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


def _ts_to_utc_dt(ts: int | None) -> datetime | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc)


def build_normalized_envelope(
    event_type: str,
    body_json: dict[str, Any],
) -> NormalizedWebhookEnvelope:
    """Extract allowlisted fields from raw JSON into a safe NormalizedWebhookEnvelope."""
    parsed_webhook = RazorpayWebhookPayload.model_validate(body_json)

    event_created_at = _ts_to_utc_dt(parsed_webhook.created_at)
    payload_dict = parsed_webhook.payload or {}

    sub_id: str | None = None
    pay_id: str | None = None
    cust_id: str | None = None
    plan_id: str | None = None
    provider_status: str | None = None
    period_start: datetime | None = None
    period_end: datetime | None = None
    cancel_at_end: bool | None = None
    ended_at: datetime | None = None
    amount: int | None = None
    currency: str | None = None

    # Handle subscription payload if present
    sub_raw = payload_dict.get("subscription", {}).get("entity")
    if sub_raw:
        sub_entity = RazorpaySubscriptionEntity.model_validate(sub_raw)
        sub_id = sub_entity.id
        plan_id = sub_entity.plan_id
        cust_id = sub_entity.customer_id
        provider_status = sub_entity.status
        period_start = _ts_to_utc_dt(sub_entity.current_start)
        period_end = _ts_to_utc_dt(sub_entity.current_end)
        ended_at = _ts_to_utc_dt(sub_entity.ended_at)

        if event_type in (
            "subscription.cancelled",
            "subscription.halted",
            "subscription.paused",
        ):
            cancel_at_end = sub_entity.ended_by != "user_immediate"

    # Handle payment payload if present
    pay_raw = payload_dict.get("payment", {}).get("entity")
    if pay_raw:
        pay_entity = RazorpayPaymentEntity.model_validate(pay_raw)
        pay_id = pay_entity.id
        if not sub_id:
            sub_id = pay_entity.subscription_id
        if not provider_status:
            provider_status = pay_entity.status
        amount = pay_entity.amount
        currency = pay_entity.currency

    return NormalizedWebhookEnvelope(
        schema_version=1,
        event_type=event_type,
        provider_created_at=event_created_at,
        provider_subscription_id=sub_id,
        provider_payment_id=pay_id,
        provider_customer_id=cust_id,
        provider_plan_id=plan_id,
        provider_status=provider_status,
        current_period_start=period_start,
        current_period_end=period_end,
        cancel_at_period_end=cancel_at_end,
        ended_at=ended_at,
        amount_subunits=amount,
        currency=currency,
    )

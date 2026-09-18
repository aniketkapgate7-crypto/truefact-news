import hashlib
import hmac
import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.billing import (
    BillingCustomerModel,
    BillingWebhookEventModel,
    SubscriptionModel,
)
from app.models.user import ApplicationUserModel
from app.schemas.billing import (
    BillingPlanSchema,
    CustomerResponse,
    SubscriptionCancelResponse,
    SubscriptionCreateRequest,
    SubscriptionResponse,
)
from app.services.billing.plans import get_available_plans, get_plan_by_slug
from app.services.billing.processor import BillingEventProcessor
from app.services.billing.provider import BillingProvider, get_billing_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/billing", tags=["Billing"])


def require_billing_enabled():
    if not settings.billing_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Billing is not enabled.",
        )


@router.get("/plans", response_model=list[BillingPlanSchema])
def list_plans():
    return get_available_plans()


@router.get("/me", response_model=CustomerResponse)
def get_my_billing(
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.billing_enabled:
        return CustomerResponse(
            effective_tier="free",
            subscriptions=[],
            capabilities=["saved_stories"],
        )

    subs = (
        db.query(SubscriptionModel)
        .filter(SubscriptionModel.user_id == current_user.id)
        .order_by(SubscriptionModel.created_at.desc())
        .all()
    )

    effective_tier = "free"
    sub_responses = []

    from app.services.billing.entitlement import calculate_effective_tier

    for sub in subs:
        sub_tier = calculate_effective_tier(
            provider_status=sub.provider_status,
            local_status=sub.local_status,
            access_until=sub.access_until,
        )
        if sub.current_slot == "current" and sub_tier == "pro":
            effective_tier = "pro"

        caps = ["saved_stories"]
        if sub_tier == "pro":
            caps.append("source_watchlists")

        sub_responses.append(
            SubscriptionResponse(
                internal_subscription_id=sub.id,
                plan_slug=sub.plan_slug,
                local_status=sub.local_status,
                provider_status=sub.provider_status,
                effective_tier=sub_tier,
                current_period_start=sub.current_period_start,
                current_period_end=sub.current_period_end,
                access_until=sub.access_until,
                cancel_at_period_end=sub.cancel_at_period_end,
                created_at=sub.created_at,
                updated_at=sub.updated_at,
                capabilities=caps,
            )
        )

    user_caps = ["saved_stories"]
    if effective_tier == "pro":
        user_caps.append("source_watchlists")

    return CustomerResponse(
        effective_tier=effective_tier,
        subscriptions=sub_responses,
        capabilities=user_caps,
    )


@router.post(
    "/subscriptions",
    response_model=SubscriptionResponse,
    dependencies=[Depends(require_billing_enabled)],
)
def create_subscription(
    req: SubscriptionCreateRequest,
    current_user: ApplicationUserModel = Depends(get_current_user),
    provider: BillingProvider = Depends(get_billing_provider),
    db: Session = Depends(get_db),
):
    plan = get_plan_by_slug(req.plan_slug)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan slug.")

    if not plan.provider_plan_id:
        raise HTTPException(
            status_code=409, detail="Plan is not currently available for subscription."
        )

    existing_sub = (
        db.query(SubscriptionModel)
        .filter(
            SubscriptionModel.user_id == current_user.id,
            SubscriptionModel.current_slot == "current",
        )
        .first()
    )

    if existing_sub:
        raise HTTPException(
            status_code=400, detail="User already has a current subscription."
        )

    customer = (
        db.query(BillingCustomerModel)
        .filter(BillingCustomerModel.user_id == current_user.id)
        .first()
    )
    if not customer:
        customer = BillingCustomerModel(
            user_id=current_user.id,
            provider=provider.provider_name,
        )
        db.add(customer)
        try:
            db.commit()
            db.refresh(customer)
        except IntegrityError:
            db.rollback()
            customer = (
                db.query(BillingCustomerModel)
                .filter(BillingCustomerModel.user_id == current_user.id)
                .first()
            )
            if not customer:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to retrieve or create billing customer.",
                )

    new_sub_id = uuid4()
    subscription = SubscriptionModel(
        id=new_sub_id,
        user_id=current_user.id,
        billing_customer_id=customer.id,
        provider=provider.provider_name,
        provider_plan_id=plan.provider_plan_id,
        plan_slug=plan.slug,
        amount_subunits=plan.amount_subunits,
        currency=plan.currency,
        billing_interval=plan.interval,
        provider_status="creating",
        local_status="creating",
        current_slot="current",
    )
    db.add(subscription)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="User already has a current subscription."
        )
    db.refresh(subscription)

    try:
        provider_response = provider.create_subscription(
            internal_subscription_id=str(subscription.id),
            provider_plan_id=plan.provider_plan_id,
            customer_email=None,
        )
        subscription.provider_subscription_id = provider_response.get("id")
        subscription.provider_status = provider_response.get("status")
        subscription.local_status = "active"
        db.commit()
        db.refresh(subscription)

    except Exception as e:
        logger.error(f"Failed to create subscription with provider: {e}")
        subscription.local_status = "creation_failed"
        subscription.current_slot = None
        db.commit()
        raise HTTPException(
            status_code=500, detail="Failed to create subscription with provider."
        )

    from app.services.billing.entitlement import calculate_effective_tier

    sub_tier = calculate_effective_tier(
        provider_status=subscription.provider_status,
        local_status=subscription.local_status,
        access_until=subscription.access_until,
    )
    caps = ["saved_stories"]
    if sub_tier == "pro":
        caps.append("source_watchlists")

    return SubscriptionResponse(
        internal_subscription_id=subscription.id,
        plan_slug=subscription.plan_slug,
        local_status=subscription.local_status,
        provider_status=subscription.provider_status,
        effective_tier=sub_tier,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        access_until=subscription.access_until,
        cancel_at_period_end=subscription.cancel_at_period_end,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
        capabilities=caps,
    )


@router.post(
    "/subscriptions/{subscription_id}/cancel",
    response_model=SubscriptionCancelResponse,
    dependencies=[Depends(require_billing_enabled)],
)
def cancel_subscription(
    subscription_id: str,
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscription = (
        db.query(SubscriptionModel)
        .filter(
            SubscriptionModel.id == subscription_id,
            SubscriptionModel.user_id == current_user.id,
        )
        .first()
    )

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if not subscription.provider_subscription_id:
        raise HTTPException(
            status_code=400, detail="No provider subscription ID to cancel."
        )

    try:
        provider = get_billing_provider()
        provider_resp = provider.request_end_of_cycle_cancellation(
            subscription.provider_subscription_id
        )
        subscription.cancel_at_period_end = provider_resp.get(
            "cancel_at_period_end", True
        )
        db.commit()
        return SubscriptionCancelResponse(
            success=True, message="Subscription cancellation requested."
        )
    except Exception as e:
        logger.error(f"Failed to cancel subscription with provider: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to request cancellation from provider."
        )


@router.post(
    "/webhooks/razorpay",
    dependencies=[Depends(require_billing_enabled)],
)
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Secure webhook endpoint for Razorpay.
    """
    if not settings.razorpay_webhook_secret:
        logger.error("Razorpay webhook secret not configured.")
        raise HTTPException(status_code=500, detail="Webhook configuration error.")

    signature = request.headers.get("x-razorpay-signature")
    if not signature:
        logger.warning("Missing x-razorpay-signature header.")
        raise HTTPException(status_code=400, detail="Missing signature.")

    body_bytes = bytearray()
    async for chunk in request.stream():
        body_bytes.extend(chunk)
        if len(body_bytes) > settings.billing_max_webhook_bytes:
            raise HTTPException(status_code=413, detail="Payload too large")

    body = bytes(body_bytes)

    secret = settings.razorpay_webhook_secret.get_secret_value().encode("utf-8")
    expected_sig = hmac.new(secret, body, digestmod="sha256").hexdigest()

    is_valid = hmac.compare_digest(expected_sig, signature)

    if not is_valid and settings.razorpay_previous_webhook_secret:
        prev_secret = (
            settings.razorpay_previous_webhook_secret.get_secret_value().encode("utf-8")
        )
        expected_sig_prev = hmac.new(prev_secret, body, digestmod="sha256").hexdigest()
        is_valid = hmac.compare_digest(expected_sig_prev, signature)

    if not is_valid:
        logger.warning("Invalid webhook signature.")
        raise HTTPException(status_code=400, detail="Invalid signature.")

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    event_id = (
        request.headers.get("x-razorpay-event-id")
        or payload.get("event_id")
        or payload.get("id")
    )
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event ID")

    event_type = payload.get("event")
    if not event_type:
        raise HTTPException(status_code=400, detail="Missing event type")

    payload_sha256 = hashlib.sha256(body).hexdigest()

    existing = (
        db.query(BillingWebhookEventModel)
        .filter_by(provider="razorpay", provider_event_id=event_id)
        .first()
    )
    if existing:
        if existing.payload_sha256 == payload_sha256:
            # Duplicate delivery with same hash: return 200 without changing status or attempts.
            # Never automatically requeue dead_letter events from a duplicate webhook.
            return {"status": "ok", "message": "already_received"}
        else:
            raise HTTPException(
                status_code=409, detail="Event ID conflict with different payload"
            )

    # Build allowlisted normalized envelope server-side (excludes PII, raw payload, secrets)
    from app.schemas.billing_adapter import build_normalized_envelope

    envelope = build_normalized_envelope(event_type, payload)

    new_event = BillingWebhookEventModel(
        provider="razorpay",
        provider_event_id=event_id,
        event_type=event_type,
        payload_sha256=payload_sha256,
        provider_created_at=envelope.provider_created_at,
        normalized_payload=envelope.model_dump(mode="json"),
        normalized_schema_version=1,
        processing_status="pending",
    )
    db.add(new_event)
    db.commit()

    return {"status": "ok"}


@router.post(
    "/internal/process-webhooks",
    dependencies=[Depends(require_billing_enabled)],
)
def process_webhooks(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
    provider: BillingProvider = Depends(get_billing_provider),
):
    """
    Internal test/dev endpoint to trigger background webhook processing.
    Returns 404 in non-development environments.
    """
    if settings.app_env not in {"development", "test"}:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if not settings.internal_cron_secret:
        raise HTTPException(
            status_code=500, detail="INTERNAL_CRON_SECRET not configured"
        )

    expected_token = f"Bearer {settings.internal_cron_secret.get_secret_value()}"
    if authorization != expected_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    processor = BillingEventProcessor(db, provider)
    processed_count = processor.claim_and_process_pending_events(limit=50)

    return {"status": "ok", "processed_count": processed_count}

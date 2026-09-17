from dataclasses import dataclass

from app.core.config import settings


@dataclass
class BillingPlan:
    slug: str
    display_name: str
    amount_subunits: int
    currency: str
    interval: str
    entitlement_tier: str
    provider_plan_id: str | None
    features: list[str]
    subscription_available: bool = False


def get_available_plans() -> list[BillingPlan]:
    """
    Return list of approved plans with server-computed subscription_available boolean.
    Only markets implemented features: saved_stories, source_watchlists.
    """
    pro_monthly_id = (
        settings.razorpay_plan_id_pro_monthly.get_secret_value()
        if settings.razorpay_plan_id_pro_monthly
        else None
    )
    pro_annual_id = (
        settings.razorpay_plan_id_pro_annual.get_secret_value()
        if settings.razorpay_plan_id_pro_annual
        else None
    )

    # Implemented features in Phase 2C
    implemented_features = ["saved_stories", "source_watchlists"]

    # In development/test mode with test provider, subscription_available is True if billing enabled & provider plan ID configured
    monthly_available = bool(
        settings.billing_enabled
        and pro_monthly_id
        and settings.app_env in {"development", "test"}
    )
    annual_available = bool(
        settings.billing_enabled
        and pro_annual_id
        and settings.app_env in {"development", "test"}
    )

    return [
        BillingPlan(
            slug="pro_monthly",
            display_name="TrueFact Pro (Monthly)",
            amount_subunits=0,
            currency="INR",
            interval="monthly",
            entitlement_tier="pro",
            provider_plan_id=pro_monthly_id,
            features=implemented_features,
            subscription_available=monthly_available,
        ),
        BillingPlan(
            slug="pro_annual",
            display_name="TrueFact Pro (Annual)",
            amount_subunits=0,
            currency="INR",
            interval="annual",
            entitlement_tier="pro",
            provider_plan_id=pro_annual_id,
            features=implemented_features,
            subscription_available=annual_available,
        ),
    ]


def get_plan_by_slug(slug: str) -> BillingPlan | None:
    for plan in get_available_plans():
        if plan.slug == slug:
            return plan
    return None

from enum import Enum
from typing import Any

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.billing import SubscriptionModel
from app.models.user import ApplicationUserModel
from app.services.billing.entitlement import calculate_effective_tier


class EntitlementTier(str, Enum):
    FREE = "free"
    PRO = "pro"


class FeatureKey(str, Enum):
    SAVED_STORIES = "saved_stories"
    SOURCE_WATCHLISTS = "source_watchlists"


# Capability mapping per tier
TIER_CAPABILITIES: dict[EntitlementTier, list[FeatureKey]] = {
    EntitlementTier.FREE: [FeatureKey.SAVED_STORIES],
    EntitlementTier.PRO: [FeatureKey.SAVED_STORIES, FeatureKey.SOURCE_WATCHLISTS],
}


def get_current_user_effective_tier(
    current_user: ApplicationUserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EntitlementTier:
    """
    Authoritative server-side resolution of the current user's effective entitlement tier.
    Calculated on every request from current DB subscription state.
    Does NOT derive Pro tier from user RBAC roles (admin, reviewer, reader).
    """
    subscription = (
        db.query(SubscriptionModel)
        .filter(
            SubscriptionModel.user_id == current_user.id,
            SubscriptionModel.current_slot == "current",
        )
        .first()
    )

    if not subscription:
        return EntitlementTier.FREE

    raw_tier = calculate_effective_tier(
        provider_status=subscription.provider_status,
        local_status=subscription.local_status,
        access_until=subscription.access_until,
    )

    return EntitlementTier.PRO if raw_tier == "pro" else EntitlementTier.FREE


def get_current_entitlements(
    current_user: ApplicationUserModel = Depends(get_current_user),
    effective_tier: EntitlementTier = Depends(get_current_user_effective_tier),
) -> dict[str, Any]:
    """
    Returns safe entitlement summary dictionary for the authenticated user.
    """
    capabilities = TIER_CAPABILITIES.get(effective_tier, [FeatureKey.SAVED_STORIES])
    return {
        "user_id": str(current_user.id),
        "effective_tier": effective_tier.value,
        "capabilities": [cap.value for cap in capabilities],
    }


def require_feature(feature_key: FeatureKey):
    """
    FastAPI dependency factory enforcing that the authenticated user possesses the specified feature permission.
    Fails closed with 403 Forbidden.
    """

    def _dependency(
        effective_tier: EntitlementTier = Depends(get_current_user_effective_tier),
    ):
        allowed_features = TIER_CAPABILITIES.get(effective_tier, [])
        if feature_key not in allowed_features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_key.value}' requires an active Pro subscription.",
            )
        return feature_key

    return _dependency

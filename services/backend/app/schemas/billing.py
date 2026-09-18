import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BillingPlanSchema(BaseModel):
    slug: str
    display_name: str
    amount_subunits: int
    currency: str
    interval: str
    entitlement_tier: str
    features: list[str]
    subscription_available: bool = False


class SubscriptionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    plan_slug: str


class SubscriptionResponse(BaseModel):
    internal_subscription_id: uuid.UUID = Field(..., alias="id")
    plan_slug: str
    local_status: str
    provider_status: str | None = None
    effective_tier: str = "free"
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    access_until: datetime | None = None
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: datetime
    capabilities: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CustomerResponse(BaseModel):
    effective_tier: str = "free"
    subscriptions: list[SubscriptionResponse] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SubscriptionCancelResponse(BaseModel):
    success: bool
    message: str

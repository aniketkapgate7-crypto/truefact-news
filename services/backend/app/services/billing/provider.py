import logging
from abc import ABC, abstractmethod
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class BillingProviderUnavailable(Exception):
    pass


class BillingProviderRejected(Exception):
    pass


class BillingConfigurationError(Exception):
    pass


class BillingProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the canonical provider identifier (e.g., 'razorpay' or 'test')."""
        pass

    @abstractmethod
    def create_subscription(
        self,
        internal_subscription_id: str,
        provider_plan_id: str,
        customer_email: str | None = None,
    ) -> dict[str, Any]:
        """Create a subscription with the provider."""
        pass

    @abstractmethod
    def request_end_of_cycle_cancellation(
        self, provider_subscription_id: str
    ) -> dict[str, Any]:
        """Request cancellation at the end of the current billing cycle."""
        pass

    @abstractmethod
    def fetch_subscription(self, provider_subscription_id: str) -> dict[str, Any]:
        """Fetch the current subscription state from the provider."""
        pass

    @abstractmethod
    def fetch_payment(self, provider_payment_id: str) -> dict[str, Any]:
        """Fetch the current payment state from the provider."""
        pass


class TestBillingProvider(BillingProvider):
    @property
    def provider_name(self) -> str:
        return "test"

    def create_subscription(
        self,
        internal_subscription_id: str,
        provider_plan_id: str,
        customer_email: str | None = None,
    ) -> dict[str, Any]:
        return {
            "id": f"sub_test_{internal_subscription_id[:8]}",
            "status": "created",
        }

    def request_end_of_cycle_cancellation(
        self, provider_subscription_id: str
    ) -> dict[str, Any]:
        return {
            "id": provider_subscription_id,
            "cancel_at_period_end": True,
            "status": "active",
        }

    def fetch_subscription(self, provider_subscription_id: str) -> dict[str, Any]:
        return {
            "id": provider_subscription_id,
            "status": "active",
        }

    def fetch_payment(self, provider_payment_id: str) -> dict[str, Any]:
        return {
            "id": provider_payment_id,
            "status": "captured",
        }


class RazorpayBillingProvider(BillingProvider):
    @property
    def provider_name(self) -> str:
        return "razorpay"

    def _check_credentials(self) -> None:
        if not settings.razorpay_key_id or not settings.razorpay_key_secret:
            raise BillingConfigurationError("Razorpay credentials not configured")

    def create_subscription(
        self,
        internal_subscription_id: str,
        provider_plan_id: str,
        customer_email: str | None = None,
    ) -> dict[str, Any]:
        self._check_credentials()
        raise NotImplementedError("Razorpay network calls are disabled in Phase 2B")

    def request_end_of_cycle_cancellation(
        self, provider_subscription_id: str
    ) -> dict[str, Any]:
        self._check_credentials()
        raise NotImplementedError("Razorpay network calls are disabled in Phase 2B")

    def fetch_subscription(self, provider_subscription_id: str) -> dict[str, Any]:
        self._check_credentials()
        raise NotImplementedError("Razorpay network calls are disabled in Phase 2B")

    def fetch_payment(self, provider_payment_id: str) -> dict[str, Any]:
        self._check_credentials()
        raise NotImplementedError("Razorpay network calls are disabled in Phase 2B")


def get_billing_provider() -> BillingProvider:
    if settings.billing_provider == "test":
        return TestBillingProvider()

    if settings.billing_provider == "razorpay":
        if settings.app_env not in {"development", "test"}:
            raise BillingConfigurationError(
                "Razorpay provider not yet enabled for non-dev runtimes in Phase 2B."
            )
        return RazorpayBillingProvider()

    raise BillingConfigurationError(
        f"Unsupported or disallowed billing provider: {settings.billing_provider}"
    )

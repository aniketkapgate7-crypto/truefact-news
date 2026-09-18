from functools import lru_cache
from typing import Self
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TrueFact News API"
    app_env: str = "development"
    debug: bool = True
    docs_enabled: bool = True
    enable_editorial_workspace: bool = False
    enable_editorial_mutations: bool = False
    enable_admin_mutations: bool = False

    # Billing Settings
    billing_enabled: bool = False
    billing_provider: str = "razorpay"
    billing_max_webhook_bytes: int = 262144
    razorpay_key_id: SecretStr | None = None
    razorpay_key_secret: SecretStr | None = None
    razorpay_webhook_secret: SecretStr | None = None
    razorpay_previous_webhook_secret: SecretStr | None = None
    internal_cron_secret: SecretStr | None = None
    razorpay_plan_id_pro_monthly: str | None = None
    razorpay_plan_id_pro_annual: str | None = None

    # Authentication Settings (Clerk OIDC)
    auth_enabled: bool = False
    clerk_issuer: str | None = None
    clerk_jwks_url: str | None = None
    clerk_audience: str | None = None
    clerk_authorized_parties: str = ""
    clerk_jwks_timeout_seconds: float = Field(default=5.0, gt=0, le=30)
    clerk_jwks_cache_ttl_seconds: int = Field(default=3600, gt=0)

    cors_origins: str = (
        "http://localhost:3000,http://localhost:8081,http://127.0.0.1:3000"
    )
    allowed_hosts: str = "localhost,127.0.0.1,testserver"

    database_url: str = "sqlite:///./truefact_news.db"

    google_fact_check_api_key: SecretStr | None = None
    google_fact_check_base_url: str = (
        "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    )
    google_fact_check_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=30,
    )
    google_fact_check_language_code: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if isinstance(value, str) and value.startswith("postgresql://"):
            return value.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return self._split_csv(self.cors_origins)

    @property
    def allowed_host_list(self) -> list[str]:
        return self._split_csv(self.allowed_hosts)

    @property
    def clerk_authorized_party_list(self) -> list[str]:
        return self._split_csv(self.clerk_authorized_parties)

    @model_validator(mode="after")
    def validate_production_settings(self) -> Self:
        normalized_env = self.app_env.strip().lower()

        # Reject mutation or workspace flags in production, staging, preview, or other non-development runtimes
        if normalized_env not in {"development", "test"}:
            if self.enable_admin_mutations:
                raise ValueError(
                    "ENABLE_ADMIN_MUTATIONS cannot be enabled in non-development runtimes without authentication"
                )
            if self.enable_editorial_mutations:
                raise ValueError(
                    "ENABLE_EDITORIAL_MUTATIONS cannot be enabled in non-development runtimes without authentication"
                )
            if self.enable_editorial_workspace:
                raise ValueError(
                    "ENABLE_EDITORIAL_WORKSPACE cannot be enabled in non-development runtimes without authentication"
                )

        # Reject billing enabled in non-development/test runtimes during Phase 2A
        if self.billing_enabled:
            if normalized_env not in {"development", "test"}:
                raise ValueError(
                    "BILLING_ENABLED cannot be True in staging, preview, or production runtimes during Phase 2A"
                )
            if self.billing_provider == "razorpay" and not self.razorpay_webhook_secret:
                raise ValueError(
                    "RAZORPAY_WEBHOOK_SECRET must be configured when BILLING_ENABLED is true for razorpay provider"
                )

        # Validate mandatory authentication settings when AUTH_ENABLED is True in non-test runtimes
        if self.auth_enabled and normalized_env != "test":
            if not self.clerk_issuer or not self.clerk_issuer.strip():
                raise ValueError(
                    "CLERK_ISSUER must be configured when AUTH_ENABLED is true"
                )
            if not self.clerk_jwks_url or not self.clerk_jwks_url.strip():
                raise ValueError(
                    "CLERK_JWKS_URL must be configured when AUTH_ENABLED is true"
                )

            azp_list = self.clerk_authorized_party_list
            if not azp_list:
                raise ValueError(
                    "CLERK_AUTHORIZED_PARTIES must be configured when AUTH_ENABLED is true"
                )

            import urllib.parse

            for azp in azp_list:
                if not azp.strip():
                    raise ValueError(
                        "Empty origins are not allowed in CLERK_AUTHORIZED_PARTIES"
                    )
                if "*" in azp:
                    raise ValueError(
                        f"Wildcard origins are not allowed in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )

                parsed = urllib.parse.urlparse(azp)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError(
                        f"Invalid origin format in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )
                if parsed.path not in ("", "/"):
                    raise ValueError(
                        f"Paths are not allowed in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )
                if parsed.query or parsed.fragment:
                    raise ValueError(
                        f"Queries and fragments are not allowed in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )
                if parsed.username or parsed.password or "@" in parsed.netloc:
                    raise ValueError(
                        f"Credentials are not allowed in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )

                is_localhost = parsed.hostname in ("localhost", "127.0.0.1")
                if parsed.scheme == "http":
                    if not is_localhost:
                        raise ValueError(
                            f"HTTP is not allowed for non-localhost origins in CLERK_AUTHORIZED_PARTIES: {azp}"
                        )
                    if normalized_env != "development":
                        raise ValueError(
                            f"Localhost HTTP origins in CLERK_AUTHORIZED_PARTIES are only allowed in development: {azp}"
                        )
                elif parsed.scheme != "https":
                    raise ValueError(
                        f"Invalid scheme in CLERK_AUTHORIZED_PARTIES: {azp}"
                    )

        if normalized_env != "production":
            return self

        if self.debug:
            raise ValueError("DEBUG must be false in production")

        if self.docs_enabled:
            raise ValueError("DOCS_ENABLED must be false in production")

        allowed_hosts = self.allowed_host_list
        if not allowed_hosts:
            raise ValueError(
                "ALLOWED_HOSTS must contain at least one host in production"
            )
        if any("*" in host for host in allowed_hosts):
            raise ValueError("Wildcard hosts are not allowed in production")

        cors_origins = self.cors_origin_list
        if not cors_origins or any(
            not self._is_explicit_https_origin(origin) for origin in cors_origins
        ):
            raise ValueError(
                "CORS_ORIGINS must contain only explicit HTTPS URLs in production"
            )

        return self

    @staticmethod
    def _split_csv(value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @staticmethod
    def _is_explicit_https_origin(origin: str) -> bool:
        if "*" in origin:
            return False

        try:
            parsed = urlsplit(origin)
            return (
                parsed.scheme == "https"
                and parsed.hostname is not None
                and parsed.username is None
                and parsed.password is None
                and parsed.path == ""
                and parsed.query == ""
                and parsed.fragment == ""
            )
        except ValueError:
            return False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

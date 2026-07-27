from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TrueFact News API"
    app_env: Literal["development", "test", "production"] = "development"
    debug: bool = False
    docs_enabled: bool = True

    database_url: str = "sqlite:///./truefact_news.db"

    cors_origins: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:8081,"
        "http://localhost:19006"
    )
    allowed_hosts: str = "localhost,127.0.0.1"

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

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def allowed_host_list(self) -> list[str]:
        return [
            host.strip()
            for host in self.allowed_hosts.split(",")
            if host.strip()
        ]

    @model_validator(mode="after")
    def validate_production_settings(self) -> Self:
        if self.app_env != "production":
            return self

        if self.debug:
            raise ValueError("DEBUG must be false in production.")

        if self.docs_enabled:
            raise ValueError("DOCS_ENABLED must be false in production.")

        if "*" in self.allowed_host_list:
            raise ValueError("Wildcard hosts are not allowed in production.")

        if not self.cors_origin_list or any(
            origin == "*" or not origin.startswith("https://")
            for origin in self.cors_origin_list
        ):
            raise ValueError(
                "Production CORS origins must use explicit HTTPS URLs."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

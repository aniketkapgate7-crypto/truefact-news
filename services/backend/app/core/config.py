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

    @model_validator(mode="after")
    def validate_production_settings(self) -> Self:
        if self.app_env.strip().lower() != "production":
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


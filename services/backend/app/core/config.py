from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TrueFact News API"
    app_env: str = "development"
    debug: bool = True

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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

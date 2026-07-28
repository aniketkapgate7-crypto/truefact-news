import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _production_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "app_env": "production",
        "debug": False,
        "docs_enabled": False,
        "cors_origins": "https://app.truefact.example",
        "allowed_hosts": "api.truefact.example",
        "_env_file": None,
    }
    values.update(overrides)
    return Settings(**values)


def test_development_security_lists_are_parsed() -> None:
    settings = Settings(
        app_env="development",
        debug=False,
        docs_enabled=True,
        cors_origins="http://localhost:3000, http://localhost:8081",
        allowed_hosts="localhost, 127.0.0.1",
        _env_file=None,
    )

    assert settings.cors_origin_list == [
        "http://localhost:3000",
        "http://localhost:8081",
    ]
    assert settings.allowed_host_list == ["localhost", "127.0.0.1"]


def test_valid_production_settings_are_accepted() -> None:
    settings = _production_settings()

    assert settings.app_env == "production"
    assert settings.docs_enabled is False
    assert settings.cors_origin_list == ["https://app.truefact.example"]


def test_production_rejects_debug_mode() -> None:
    with pytest.raises(ValidationError, match="DEBUG must be false"):
        _production_settings(debug=True)


def test_production_rejects_enabled_docs() -> None:
    with pytest.raises(ValidationError, match="DOCS_ENABLED must be false"):
        _production_settings(docs_enabled=True)


def test_production_rejects_wildcard_hosts() -> None:
    with pytest.raises(ValidationError, match="Wildcard hosts"):
        _production_settings(allowed_hosts="*")


@pytest.mark.parametrize(
    "cors_origins",
    ["http://app.truefact.example", "*"],
)
def test_production_rejects_unsafe_cors(cors_origins: str) -> None:
    with pytest.raises(ValidationError, match="explicit HTTPS URLs"):
        _production_settings(cors_origins=cors_origins)

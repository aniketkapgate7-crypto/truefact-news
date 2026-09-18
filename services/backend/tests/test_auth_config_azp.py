import pytest

from app.core.config import Settings


def test_auth_enabled_requires_authorized_parties(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("CLERK_ISSUER", "https://clerk.issuer")
    monkeypatch.setenv("CLERK_JWKS_URL", "https://clerk.issuer/.well-known/jwks.json")
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "")

    with pytest.raises(ValueError, match="CLERK_AUTHORIZED_PARTIES must be configured"):
        Settings()


def test_development_auth_requires_explicit_local_authorized_party(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("CLERK_ISSUER", "https://clerk.issuer")
    monkeypatch.setenv("CLERK_JWKS_URL", "https://clerk.issuer/.well-known/jwks.json")
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "http://localhost:3000")

    s = Settings()
    assert s.clerk_authorized_party_list == ["http://localhost:3000"]


def test_non_development_rejects_http_authorized_party(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("CLERK_ISSUER", "https://clerk.issuer")
    monkeypatch.setenv("CLERK_JWKS_URL", "https://clerk.issuer/.well-known/jwks.json")
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "http://localhost:3000")

    with pytest.raises(
        ValueError,
        match="Localhost HTTP origins in CLERK_AUTHORIZED_PARTIES are only allowed in development",
    ):
        Settings()

    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "http://example.com")
    with pytest.raises(
        ValueError, match="HTTP is not allowed for non-localhost origins"
    ):
        Settings()


def test_wildcard_authorized_party_is_rejected(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("CLERK_ISSUER", "https://clerk.issuer")
    monkeypatch.setenv("CLERK_JWKS_URL", "https://clerk.issuer/.well-known/jwks.json")
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", "https://*.example.com")

    with pytest.raises(ValueError, match="Wildcard origins are not allowed"):
        Settings()

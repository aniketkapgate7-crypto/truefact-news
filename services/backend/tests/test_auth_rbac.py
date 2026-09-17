import json
import logging
import time
import uuid
from typing import Any
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from jwt.algorithms import RSAAlgorithm

import app.core.auth as auth_module
from app.core.config import Settings, settings
from app.models.user import ApplicationUserModel, UserRole


# Helper to create RSA key pair for local JWT mock testing
def _generate_rsa_key_pair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    jwk_dict = json.loads(RSAAlgorithm.to_jwk(public_key))
    jwk_dict["kid"] = "test-key-id-1"
    jwk_dict["use"] = "sig"
    jwk_dict["alg"] = "RS256"
    return private_key, public_key, jwk_dict


_PRIVATE_KEY, _PUBLIC_KEY, _JWK_DICT = _generate_rsa_key_pair()
_MOCK_JWKS = {"keys": [_JWK_DICT]}


def _create_mock_jwt(
    claims: dict[str, Any] | None = None,
    headers: dict[str, Any] | None = None,
    private_key=_PRIVATE_KEY,
    algorithm: str = "RS256",
) -> str:
    now = int(time.time())
    default_claims = {
        "sub": "user_clerk_test_123",
        "iss": "https://clerk.truefact.test",
        "exp": now + 3600,
        "nbf": now - 10,
        "iat": now - 10,
        "email": "reader@truefact.test",
        "name": "Test Reader",
        "azp": "http://localhost:3000",
    }
    if claims:
        default_claims.update(claims)

    remove_azp = claims.pop("remove_azp", False) if claims else False
    if remove_azp and "azp" in default_claims:
        del default_claims["azp"]

    default_headers = {"kid": "test-key-id-1", "alg": algorithm}
    if headers:
        default_headers.update(headers)

    if algorithm == "none":
        return jwt.encode(
            default_claims, key="", algorithm="none", headers=default_headers
        )

    return jwt.encode(
        default_claims, key=private_key, algorithm=algorithm, headers=default_headers
    )


# ---------------------------------------------------------------------------
# 1. Configuration Tests
# ---------------------------------------------------------------------------


def test_auth_disabled_by_default():
    s = Settings()
    assert s.auth_enabled is False
    assert s.clerk_issuer is None
    assert s.clerk_jwks_url is None
    assert s.clerk_audience is None
    assert s.clerk_authorized_parties == ""


def test_production_auth_configuration_fails_closed_when_incomplete():
    # In production with auth_enabled=True, missing issuer or jwks url must raise ValueError
    with pytest.raises(ValueError, match="CLERK_ISSUER must be configured"):
        Settings(
            app_env="production",
            debug=False,
            docs_enabled=False,
            allowed_hosts="api.truefact.test",
            cors_origins="https://truefact.test",
            auth_enabled=True,
            clerk_issuer="",
            clerk_jwks_url="https://clerk.truefact.test/.well-known/jwks.json",
            clerk_authorized_parties="https://truefact.test",
        )

    with pytest.raises(ValueError, match="CLERK_JWKS_URL must be configured"):
        Settings(
            app_env="production",
            debug=False,
            docs_enabled=False,
            allowed_hosts="api.truefact.test",
            cors_origins="https://truefact.test",
            auth_enabled=True,
            clerk_issuer="https://clerk.truefact.test",
            clerk_jwks_url="",
            clerk_authorized_parties="https://truefact.test",
        )


def test_development_mode_alone_does_not_bypass_authentication_or_roles(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "auth_enabled", False)
    monkeypatch.setattr(settings, "enable_editorial_mutations", True)

    # When auth_enabled is False, protected endpoints reject unauthenticated calls with 401
    resp = client.patch(
        "/api/v1/editorial/review/1",
        json={"review_status": "in_review"},
    )
    assert resp.status_code == 401
    assert (
        "disabled" in resp.json()["detail"].lower()
        or "credentials" in resp.json()["detail"].lower()
    )


# ---------------------------------------------------------------------------
# 2. JWT Verification Tests
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _setup_mock_auth_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "auth_enabled", True)
    monkeypatch.setattr(settings, "clerk_issuer", "https://clerk.truefact.test")
    monkeypatch.setattr(
        settings, "clerk_jwks_url", "https://clerk.truefact.test/.well-known/jwks.json"
    )
    monkeypatch.setattr(settings, "clerk_audience", None)
    monkeypatch.setattr(settings, "clerk_authorized_parties", "http://localhost:3000")
    monkeypatch.setattr(auth_module, "_jwks_cache", _MOCK_JWKS)
    monkeypatch.setattr(auth_module, "_jwks_cache_expires_at", time.time() + 3600)


def test_missing_bearer_token_returns_401(client: TestClient):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401
    assert "credentials were not provided" in resp.json()["detail"]


def test_malformed_token_returns_401(client: TestClient):
    resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer not-a-valid-jwt-structure"},
    )
    assert resp.status_code == 401


def test_wrong_algorithm_returns_401(client: TestClient):
    # None algorithm
    token_none = _create_mock_jwt(algorithm="none")
    resp = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_none}"}
    )
    assert resp.status_code == 401
    assert "RS256" in resp.json()["detail"]


def test_invalid_signature_returns_401(client: TestClient):
    other_key, _, _ = _generate_rsa_key_pair()
    token = _create_mock_jwt(private_key=other_key)
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "Invalid authentication token" in resp.json()["detail"]


def test_expired_token_returns_401(client: TestClient):
    token = _create_mock_jwt(claims={"exp": int(time.time()) - 100})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_not_yet_valid_token_returns_401(client: TestClient):
    token = _create_mock_jwt(claims={"nbf": int(time.time()) + 1000})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "not yet valid" in resp.json()["detail"].lower()


def test_wrong_issuer_returns_401(client: TestClient):
    token = _create_mock_jwt(claims={"iss": "https://untrusted-issuer.com"})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "issuer" in resp.json()["detail"].lower()


def test_wrong_configured_audience_returns_401(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "clerk_audience", "truefact-api-audience")
    token = _create_mock_jwt(claims={"aud": "wrong-audience"})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "audience" in resp.json()["detail"].lower()


def test_unauthorized_azp_origin_returns_401(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(
        settings,
        "clerk_authorized_parties",
        "http://localhost:3000,https://truefact.news",
    )
    token = _create_mock_jwt(claims={"azp": "http://evil-site.com"})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "authorized party" in resp.json()["detail"].lower()


def test_missing_or_empty_subject_returns_401(client: TestClient):
    token = _create_mock_jwt(claims={"sub": "   "})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "subject" in resp.json()["detail"].lower()


def test_jwks_timeout_or_network_failure_fails_closed(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(auth_module, "_jwks_cache", {})
    monkeypatch.setattr(auth_module, "_jwks_cache_expires_at", 0.0)

    with patch.object(
        auth_module,
        "_fetch_jwks_from_network",
        side_effect=Exception("Connection timed out"),
    ):
        token = _create_mock_jwt()
        resp = client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 401
        assert "signature" in resp.json()["detail"].lower()


def test_key_rotation_refreshes_cached_jwks_safely(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    # Old cache has key 1
    new_priv, _, new_jwk = _generate_rsa_key_pair()
    new_jwk["kid"] = "rotated-key-id-2"

    rotated_jwks = {"keys": [_JWK_DICT, new_jwk]}

    # Mock fetch to return updated JWKS when cache is invalidated
    with patch.object(auth_module, "_fetch_jwks", return_value=rotated_jwks):
        token = _create_mock_jwt(
            headers={"kid": "rotated-key-id-2"},
            private_key=new_priv,
        )
        resp = client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert "id" in resp.json()


def test_token_value_is_absent_from_logs(
    client: TestClient, caplog: pytest.LogCaptureFixture
):
    secret_token_val = "SECRET_TOKEN_XYZ_12345"
    with caplog.at_level(logging.DEBUG):
        resp = client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {secret_token_val}"}
        )
        assert resp.status_code == 401

    for record in caplog.records:
        assert secret_token_val not in record.message


# ---------------------------------------------------------------------------
# 3. User Provisioning & RBAC Tests
# ---------------------------------------------------------------------------


def test_first_authenticated_request_creates_reader_jit(client: TestClient):
    new_sub = f"user_new_{uuid.uuid4()}"
    token = _create_mock_jwt(
        claims={"sub": new_sub, "email": "newuser@truefact.test", "name": "New User"}
    )

    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["role"] == "reader"
    assert data["email"] == "newuser@truefact.test"
    assert data["display_name"] == "New User"
    assert data["is_active"] is True


def test_client_cannot_set_auth_subject_role_or_active_status(client: TestClient):
    # Spoofed claims attempting role escalation in JWT
    sub = f"user_spoof_{uuid.uuid4()}"
    token = _create_mock_jwt(
        claims={
            "sub": sub,
            "role": "admin",
            "publicMetadata": {"role": "admin"},
            "privateMetadata": {"role": "admin"},
            "admin": True,
            "is_active": True,
        }
    )

    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    # Backend database must assign reader regardless of JWT metadata
    assert data["role"] == "reader"


def test_disabled_user_returns_403(client: TestClient):
    from datetime import datetime, timezone

    from tests.conftest import TestingSessionLocal

    sub = f"user_disabled_{uuid.uuid4()}"
    # Create user directly as disabled
    with TestingSessionLocal() as db:
        disabled_user = ApplicationUserModel(
            auth_subject=sub,
            email="disabled@truefact.test",
            role=UserRole.READER,
            is_active=False,
            disabled_at=datetime.now(timezone.utc),
        )
        db.add(disabled_user)
        db.commit()

    token = _create_mock_jwt(claims={"sub": sub})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    assert "deactivated" in resp.json()["detail"].lower()


def test_users_me_cannot_access_another_user(client: TestClient):
    token = _create_mock_jwt(claims={"sub": "user_a"})
    # Attempting to pass query param user_id=user_b must be ignored; /users/me only returns authenticated subject
    resp = client.get(
        "/api/v1/users/me?user_id=user_b", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert "id" in resp.json()


def test_email_is_not_used_as_identity(client: TestClient):
    shared_email = "shared@truefact.test"
    token1 = _create_mock_jwt(claims={"sub": "sub_account_1", "email": shared_email})
    token2 = _create_mock_jwt(claims={"sub": "sub_account_2", "email": shared_email})

    resp1 = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token1}"}
    )
    resp2 = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token2}"}
    )

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp1.json()["id"] != resp2.json()["id"]
    assert "id" in resp1.json()
    assert "id" in resp2.json()


# ---------------------------------------------------------------------------
# 4. Dual-Gate Authorization Tests
# ---------------------------------------------------------------------------


def _setup_user_with_role(sub: str, role: UserRole):
    from tests.conftest import TestingSessionLocal

    with TestingSessionLocal() as db:
        user = ApplicationUserModel(
            auth_subject=sub,
            email=f"{role.value}@truefact.test",
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()


def test_reader_cannot_mutate_editorial_records(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "enable_editorial_mutations", True)
    reader_sub = f"reader_{uuid.uuid4()}"
    _setup_user_with_role(reader_sub, UserRole.READER)

    token = _create_mock_jwt(claims={"sub": reader_sub})
    resp = client.patch(
        "/api/v1/editorial/review/1",
        json={"review_status": "in_review"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert "authorized role" in resp.json()["detail"].lower()


def test_reviewer_can_mutate_editorial_review_only_when_kill_switch_enabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    from datetime import datetime, timezone

    from app.models.credibility import CredibilityAssessmentModel
    from app.models.news import NewsArticleModel
    from tests.conftest import TestingSessionLocal

    reviewer_sub = f"reviewer_{uuid.uuid4()}"
    _setup_user_with_role(reviewer_sub, UserRole.REVIEWER)
    token = _create_mock_jwt(claims={"sub": reviewer_sub})

    # Create an article and credibility assessment to update
    with TestingSessionLocal() as db:
        article = NewsArticleModel(
            title="Reviewer Test Story",
            summary="Story for reviewer mutation testing",
            source_name="Test Desk",
            source_url=f"https://truefact.test/stories/{uuid.uuid4()}",
            category="world",
            region="global",
            published_at=datetime.now(timezone.utc),
        )
        db.add(article)
        db.commit()
        db.refresh(article)
        article_id = article.id

        assessment = CredibilityAssessmentModel(
            news_article_id=article_id,
            source_reliability_score=80,
            evidence_quality_score=80,
            corroboration_score=80,
            content_quality_score=80,
            credibility_score=80,
            explanation="Explanation for test assessment",
            method_version="credibility_v2",
        )
        db.add(assessment)
        db.commit()

    # 1. When killswitch is FALSE -> 403 (Gate 1 blocks before auth/lookup)
    monkeypatch.setattr(settings, "enable_editorial_mutations", False)
    resp = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={"review_status": "in_review", "reviewer_name": "Test Reviewer"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert "editorial mutations are disabled" in resp.json()["detail"].lower()

    # 2. When killswitch is TRUE -> 200 OK
    monkeypatch.setattr(settings, "enable_editorial_mutations", True)
    resp = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={"review_status": "in_review", "reviewer_name": "Test Reviewer"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "in_review"


def test_reviewer_cannot_perform_admin_mutations(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    reviewer_sub = f"reviewer_{uuid.uuid4()}"
    _setup_user_with_role(reviewer_sub, UserRole.REVIEWER)
    token = _create_mock_jwt(claims={"sub": reviewer_sub})

    resp = client.post(
        "/api/v1/news/",
        json={
            "title": "Unauthorized Article",
            "summary": "Reviewer cannot create news",
            "source_name": "Test Source",
            "source_url": "https://test.com/unauth",
            "category": "world",
            "region": "global",
            "published_at": "2026-08-28T00:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()


def test_admin_can_perform_admin_mutation_only_when_kill_switch_enabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    admin_sub = f"admin_{uuid.uuid4()}"
    _setup_user_with_role(admin_sub, UserRole.ADMIN)
    token = _create_mock_jwt(claims={"sub": admin_sub})

    article_payload = {
        "title": "Admin Story",
        "summary": "Created by admin",
        "source_name": "Admin Source",
        "source_url": f"https://test.com/story-{uuid.uuid4()}",
        "category": "world",
        "region": "global",
        "published_at": "2026-08-28T00:00:00Z",
    }

    # 1. Killswitch False -> 403
    monkeypatch.setattr(settings, "enable_admin_mutations", False)
    resp = client.post(
        "/api/v1/news/",
        json=article_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    assert "disabled in this environment" in resp.json()["detail"].lower()

    # 2. Killswitch True -> 201 Created
    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    resp = client.post(
        "/api/v1/news/",
        json=article_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["title"] == "Admin Story"


def test_kill_switch_disabled_blocks_every_role_including_admin(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "enable_admin_mutations", False)
    admin_sub = f"admin_{uuid.uuid4()}"
    _setup_user_with_role(admin_sub, UserRole.ADMIN)
    token = _create_mock_jwt(claims={"sub": admin_sub})

    resp = client.delete(
        "/api/v1/news/9999", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 403
    assert "disabled" in resp.json()["detail"].lower()


def test_nonexistent_resource_still_returns_authorization_denial_before_lookup(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    # Killswitch disabled: 403 happens before 404
    monkeypatch.setattr(settings, "enable_admin_mutations", False)
    resp = client.delete("/api/v1/news/999999")
    assert resp.status_code == 403

    # Wrong role: 403 happens before 404
    monkeypatch.setattr(settings, "enable_admin_mutations", True)
    reader_sub = f"reader_{uuid.uuid4()}"
    _setup_user_with_role(reader_sub, UserRole.READER)
    token = _create_mock_jwt(claims={"sub": reader_sub})

    resp = client.delete(
        "/api/v1/news/999999", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 403


def test_missing_azp_is_rejected(client: TestClient):
    token = _create_mock_jwt(claims={"sub": "user_no_azp", "remove_azp": True})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "authorized party (azp)" in resp.text


def test_users_me_does_not_expose_auth_subject(client: TestClient):
    token = _create_mock_jwt(claims={"sub": f"user_{uuid.uuid4()}"})
    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "auth_subject" not in resp.json()


def test_concurrent_jit_provisioning_creates_one_user(tmp_path: pytest.TempPathFactory):
    import concurrent.futures
    import threading

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.db.database import Base, get_db
    from app.main import app

    unique_sub = f"concurrent_test_{uuid.uuid4()}"
    token = _create_mock_jwt(
        claims={"sub": unique_sub, "email": "concurrent@test.com", "name": "Con Cur"}
    )

    db_path = tmp_path / "jit-concurrency.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
    )

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    barrier = threading.Barrier(5)

    def make_request():
        barrier.wait()
        with TestClient(app) as local_client:
            return local_client.get(
                "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
            )

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [f.result() for f in concurrent.futures.as_completed(futures)]

        assert len(responses) == 5
        assert all(r.status_code == 200 for r in responses)

        user_ids = {r.json()["id"] for r in responses}
        assert len(user_ids) == 1

        with TestingSessionLocal() as db:
            users = db.query(ApplicationUserModel).all()
            assert len(users) == 1
            created_user = users[0]
            assert created_user.auth_subject == unique_sub
            assert created_user.role == UserRole.READER

        for r in responses:
            assert "auth_subject" not in r.json()
            assert r.json()["role"] == "reader"

    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()

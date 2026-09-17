import logging
import time
from typing import Annotated, Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.user import ApplicationUserModel, UserRole

logger = logging.getLogger(__name__)

# Reusable HTTPBearer security scheme (auto_error=False to allow clean 401 handling)
bearer_scheme = HTTPBearer(auto_error=False)

# Module-level JWKS cache
_jwks_cache: dict[str, Any] = {}
_jwks_cache_expires_at: float = 0.0


def _fetch_jwks_from_network() -> dict[str, Any]:
    with httpx.Client(timeout=settings.clerk_jwks_timeout_seconds) as client:
        resp = client.get(settings.clerk_jwks_url)
        resp.raise_for_status()
        return resp.json()


def _fetch_jwks() -> dict[str, Any]:
    """Fetch JWKS keys with caching and timeout."""
    global _jwks_cache, _jwks_cache_expires_at

    now = time.time()
    if _jwks_cache and now < _jwks_cache_expires_at:
        return _jwks_cache

    if not settings.clerk_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWKS URL is not configured",
        )

    try:
        jwks_data = _fetch_jwks_from_network()
        _jwks_cache = jwks_data
        _jwks_cache_expires_at = now + settings.clerk_jwks_cache_ttl_seconds
        return _jwks_cache
    except Exception as exc:
        logger.error(
            "Failed to retrieve JWKS from %s: %s",
            settings.clerk_jwks_url,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to verify authentication token signature",
        ) from exc


def verify_jwt_token(token: str) -> dict[str, Any]:
    """Verify OIDC RS256 token against Clerk JWKS keys with full standard claim validation."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
        )

    # 1. Inspect token header
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token header",
        ) from exc

    alg = unverified_header.get("alg")
    if alg != "RS256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported token algorithm '{alg}'; only RS256 is permitted",
        )

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token header missing key identifier (kid)",
        )

    # 2. Get signing key from JWKS
    jwks = _fetch_jwks()
    keys = jwks.get("keys", [])
    matching_key = next((k for k in keys if k.get("kid") == kid), None)

    # If key not found, refresh JWKS once to support key rotation
    if not matching_key:
        global _jwks_cache_expires_at
        _jwks_cache_expires_at = 0.0  # Force cache invalidation
        jwks = _fetch_jwks()
        keys = jwks.get("keys", [])
        matching_key = next((k for k in keys if k.get("kid") == kid), None)

    if not matching_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown signing key identifier",
        )

    try:
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(matching_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWK public key format",
        ) from exc

    # 3. Decode & verify claims
    decode_kwargs: dict[str, Any] = {
        "algorithms": ["RS256"],
        "options": {"verify_signature": True, "verify_exp": True, "verify_nbf": True},
    }

    if settings.clerk_issuer:
        decode_kwargs["issuer"] = settings.clerk_issuer
    else:
        decode_kwargs["options"]["verify_iss"] = False

    if settings.clerk_audience:
        decode_kwargs["audience"] = settings.clerk_audience
    else:
        decode_kwargs["options"]["verify_aud"] = False

    try:
        claims = jwt.decode(token, public_key, **decode_kwargs)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
        ) from exc
    except jwt.ImmatureSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is not yet valid (nbf)",
        ) from exc
    except jwt.InvalidIssuerError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token issuer",
        ) from exc
    except jwt.InvalidAudienceError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token audience",
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

    # 4. Verify authorized party (azp)
    azp = claims.get("azp")
    if not azp or azp not in settings.clerk_authorized_party_list:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized token authorized party (azp)",
        )

    # 5. Verify non-empty subject
    sub = claims.get("sub")
    if not sub or not isinstance(sub, str) or not sub.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing valid subject identifier",
        )

    return claims


def get_current_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    """FastAPI dependency to extract and verify JWT bearer token."""
    if not settings.auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is disabled in this environment",
        )

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )

    return verify_jwt_token(credentials.credentials)


def get_current_user(
    token_payload: Annotated[dict[str, Any], Depends(get_current_token_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> ApplicationUserModel:
    """FastAPI dependency resolving the authenticated ApplicationUserModel via concurrency-safe JIT sync.

    PostgreSQL remains the authoritative source of application role and active status.
    Every new user is initialized with role=reader.
    """
    sub = str(token_payload["sub"]).strip()

    statement = select(ApplicationUserModel).where(
        ApplicationUserModel.auth_subject == sub
    )
    user = db.scalar(statement)

    if user is None:
        # Just-in-time provisioning with default role=reader
        email = token_payload.get("email") or token_payload.get("email_address")
        if isinstance(email, str):
            email = email.strip().lower()
        else:
            email = None

        display_name = token_payload.get("name") or token_payload.get("display_name")
        if not isinstance(display_name, str):
            display_name = None

        new_user = ApplicationUserModel(
            auth_subject=sub,
            email=email,
            display_name=display_name,
            role=UserRole.READER,
            is_active=True,
        )
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        except IntegrityError:
            # Handle race condition in concurrent first requests
            db.rollback()
            user = db.scalar(statement)
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to resolve authenticated user profile",
                )

    if not user.is_active or user.disabled_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user

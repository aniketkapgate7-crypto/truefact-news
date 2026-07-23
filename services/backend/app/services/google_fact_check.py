from collections.abc import Mapping
from datetime import date, datetime
from urllib.parse import urlsplit

import httpx

from app.services.fact_check import FactCheckMatch

GOOGLE_FACT_CHECK_SEARCH_URL = (
    "https://factchecktools.googleapis.com/v1alpha1/claims:search"
)


class FactCheckProviderError(RuntimeError):
    """Base error raised when a fact-check provider cannot return results."""


class FactCheckProviderTimeoutError(FactCheckProviderError):
    """Raised when a fact-check provider takes too long to respond."""


class FactCheckProviderResponseError(FactCheckProviderError):
    """Raised when a fact-check provider returns an unusable response."""


def _optional_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    normalized = " ".join(value.split())
    return normalized or None


def _optional_date(value: object) -> date | None:
    text = _optional_text(value)

    if text is None:
        return None

    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _safe_http_url(value: object) -> str | None:
    text = _optional_text(value)

    if text is None:
        return None

    parsed = urlsplit(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None

    return text


def _mapping(value: object) -> Mapping[str, object] | None:
    if isinstance(value, Mapping):
        return value

    return None


class GoogleFactCheckProvider:
    """Google Fact Check Claim Search API adapter."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = GOOGLE_FACT_CHECK_SEARCH_URL,
        timeout_seconds: float = 10.0,
        language_code: str | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        normalized_api_key = api_key.strip()
        normalized_base_url = base_url.strip()

        if not normalized_api_key:
            raise ValueError("Google Fact Check API key cannot be empty")

        if not normalized_base_url:
            raise ValueError("Google Fact Check base URL cannot be empty")

        if timeout_seconds <= 0:
            raise ValueError("Fact-check timeout must be greater than zero")

        self._api_key = normalized_api_key
        self._base_url = normalized_base_url
        self._timeout_seconds = timeout_seconds
        self._language_code = _optional_text(language_code)
        self._http_client = http_client

    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]:
        normalized_query = " ".join(query.split())

        if len(normalized_query) < 3:
            raise ValueError("Fact-check query must contain at least 3 characters")

        if not 1 <= limit <= 20:
            raise ValueError("Fact-check limit must be between 1 and 20")

        params: dict[str, str | int] = {
            "query": normalized_query,
            "pageSize": limit,
            "key": self._api_key,
        }

        if self._language_code is not None:
            params["languageCode"] = self._language_code

        try:
            response = await self._send_request(params)
            response.raise_for_status()
        except httpx.TimeoutException as error:
            raise FactCheckProviderTimeoutError(
                "The fact-check provider timed out"
            ) from error
        except httpx.HTTPStatusError as error:
            raise FactCheckProviderError(
                "The fact-check provider rejected the request"
            ) from error
        except httpx.RequestError as error:
            raise FactCheckProviderError(
                "The fact-check provider is unavailable"
            ) from error

        try:
            payload = response.json()
        except ValueError as error:
            raise FactCheckProviderResponseError(
                "The fact-check provider returned invalid JSON"
            ) from error

        return self._normalize_matches(payload, limit=limit)

    async def _send_request(
        self,
        params: Mapping[str, str | int],
    ) -> httpx.Response:
        if self._http_client is not None:
            return await self._http_client.get(
                self._base_url,
                params=params,
                headers={"Accept": "application/json"},
            )

        async with httpx.AsyncClient(
            timeout=self._timeout_seconds,
            follow_redirects=False,
        ) as client:
            return await client.get(
                self._base_url,
                params=params,
                headers={"Accept": "application/json"},
            )

    def _normalize_matches(
        self,
        payload: object,
        *,
        limit: int,
    ) -> tuple[FactCheckMatch, ...]:
        payload_mapping = _mapping(payload)

        if payload_mapping is None:
            raise FactCheckProviderResponseError(
                "The fact-check provider returned an invalid response"
            )

        raw_claims = payload_mapping.get("claims", [])
        if raw_claims is None:
            return ()

        if not isinstance(raw_claims, list):
            raise FactCheckProviderResponseError(
                "The fact-check provider returned invalid claims"
            )

        matches: list[FactCheckMatch] = []
        seen_review_urls: set[str] = set()

        for raw_claim in raw_claims:
            claim = _mapping(raw_claim)
            if claim is None:
                continue

            claim_text = _optional_text(claim.get("text"))
            if claim_text is None:
                continue

            raw_reviews = claim.get("claimReview", [])
            if not isinstance(raw_reviews, list):
                continue

            for raw_review in raw_reviews:
                review = _mapping(raw_review)
                if review is None:
                    continue

                review_url = _safe_http_url(review.get("url"))
                verdict = _optional_text(review.get("textualRating"))
                publisher = _mapping(review.get("publisher"))

                if review_url is None or verdict is None or publisher is None:
                    continue

                publisher_name = _optional_text(publisher.get("name"))
                if publisher_name is None or review_url in seen_review_urls:
                    continue

                matches.append(
                    FactCheckMatch(
                        claim_text=claim_text,
                        claimant=_optional_text(claim.get("claimant")),
                        verdict=verdict,
                        publisher=publisher_name,
                        review_url=review_url,
                        review_date=_optional_date(review.get("reviewDate")),
                    )
                )
                seen_review_urls.add(review_url)

                if len(matches) == limit:
                    return tuple(matches)

        return tuple(matches)

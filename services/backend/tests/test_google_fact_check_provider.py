import asyncio
from datetime import date

import httpx
import pytest

from app.services.fact_check import FactCheckMatch
from app.services.google_fact_check import (
    FactCheckProviderError,
    FactCheckProviderResponseError,
    FactCheckProviderTimeoutError,
    GoogleFactCheckProvider,
)


def test_google_provider_maps_claim_reviews_and_request_parameters() -> None:
    async def run_test() -> tuple[FactCheckMatch, ...]:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.params["query"] == "sample verified claim"
            assert request.url.params["pageSize"] == "2"
            assert request.url.params["languageCode"] == "en"
            assert request.url.params["key"] == "test-api-key"
            assert request.headers["Accept"] == "application/json"

            return httpx.Response(
                status_code=200,
                json={
                    "claims": [
                        {
                            "text": "A sample claim",
                            "claimant": "Example claimant",
                            "claimDate": "2026-07-20T10:00:00Z",
                            "claimReview": [
                                {
                                    "publisher": {
                                        "name": "Example Fact Check",
                                        "site": "example.com",
                                    },
                                    "url": "https://example.com/review/1",
                                    "title": "Review of a sample claim",
                                    "reviewDate": "2026-07-23T09:30:00Z",
                                    "textualRating": "Misleading",
                                    "languageCode": "en",
                                }
                            ],
                        }
                    ]
                },
                request=request,
            )

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            provider = GoogleFactCheckProvider(
                api_key="test-api-key",
                language_code="en",
                http_client=client,
            )
            return await provider.search_claims(
                "  sample   verified claim  ",
                limit=2,
            )

    matches = asyncio.run(run_test())

    assert matches == (
        FactCheckMatch(
            claim_text="A sample claim",
            claimant="Example claimant",
            verdict="Misleading",
            publisher="Example Fact Check",
            review_url="https://example.com/review/1",
            review_date=date(2026, 7, 23),
        ),
    )


def test_google_provider_returns_empty_tuple_when_no_claims_match() -> None:
    async def run_test() -> tuple[FactCheckMatch, ...]:
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                status_code=200,
                json={},
                request=request,
            )
        )

        async with httpx.AsyncClient(transport=transport) as client:
            provider = GoogleFactCheckProvider(
                api_key="test-api-key",
                http_client=client,
            )
            return await provider.search_claims("unmatched claim")

    assert asyncio.run(run_test()) == ()


def test_google_provider_skips_malformed_and_duplicate_reviews() -> None:
    async def run_test() -> tuple[FactCheckMatch, ...]:
        payload = {
            "claims": [
                {
                    "text": "Reviewed claim",
                    "claimReview": [
                        {
                            "publisher": {"name": "Publisher"},
                            "url": "javascript:alert(1)",
                            "textualRating": "False",
                        },
                        {
                            "publisher": {"name": "Publisher"},
                            "url": "https://example.com/review",
                            "textualRating": "False",
                        },
                        {
                            "publisher": {"name": "Publisher"},
                            "url": "https://example.com/review",
                            "textualRating": "False",
                        },
                    ],
                }
            ]
        }
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                status_code=200,
                json=payload,
                request=request,
            )
        )

        async with httpx.AsyncClient(transport=transport) as client:
            provider = GoogleFactCheckProvider(
                api_key="test-api-key",
                http_client=client,
            )
            return await provider.search_claims("reviewed claim")

    matches = asyncio.run(run_test())

    assert len(matches) == 1
    assert matches[0].review_url == "https://example.com/review"


@pytest.mark.parametrize(
    ("query", "limit", "message"),
    [
        ("  ", 5, "at least 3 characters"),
        ("valid query", 0, "between 1 and 20"),
        ("valid query", 21, "between 1 and 20"),
    ],
)
def test_google_provider_validates_search_input(
    query: str,
    limit: int,
    message: str,
) -> None:
    provider = GoogleFactCheckProvider(api_key="test-api-key")

    with pytest.raises(ValueError, match=message):
        asyncio.run(provider.search_claims(query, limit=limit))


def test_google_provider_maps_timeout_without_exposing_secret() -> None:
    async def run_test() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("request timed out", request=request)

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            provider = GoogleFactCheckProvider(
                api_key="super-secret-key",
                http_client=client,
            )

            with pytest.raises(FactCheckProviderTimeoutError) as error:
                await provider.search_claims("sample claim")

            assert "super-secret-key" not in str(error.value)

    asyncio.run(run_test())


def test_google_provider_maps_upstream_http_error() -> None:
    async def run_test() -> None:
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                status_code=403,
                json={"error": {"message": "forbidden"}},
                request=request,
            )
        )

        async with httpx.AsyncClient(transport=transport) as client:
            provider = GoogleFactCheckProvider(
                api_key="test-api-key",
                http_client=client,
            )

            with pytest.raises(FactCheckProviderError):
                await provider.search_claims("sample claim")

    asyncio.run(run_test())


def test_google_provider_rejects_invalid_payload_shape() -> None:
    async def run_test() -> None:
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                status_code=200,
                json={"claims": "not-a-list"},
                request=request,
            )
        )

        async with httpx.AsyncClient(transport=transport) as client:
            provider = GoogleFactCheckProvider(
                api_key="test-api-key",
                http_client=client,
            )

            with pytest.raises(FactCheckProviderResponseError):
                await provider.search_claims("sample claim")

    asyncio.run(run_test())

from dataclasses import dataclass, field
from datetime import date
from uuid import uuid4

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from app.routers.fact_checks import get_fact_check_provider
from app.services.fact_check import FactCheckMatch
from app.services.google_fact_check import (
    FactCheckProviderError,
    FactCheckProviderTimeoutError,
)

EXPECTED_DISCLAIMER = (
    "Matches are previously published fact checks. No match does not prove "
    "or disprove a claim."
)

MATCH = FactCheckMatch(
    claim_text="A reviewed sample claim",
    claimant="Example claimant",
    verdict="Misleading",
    publisher="Example Fact Check",
    review_url="https://example.com/fact-check",
    review_date=date(2026, 7, 23),
)


@dataclass
class StubFactCheckProvider:
    matches: tuple[FactCheckMatch, ...] = (MATCH,)
    calls: list[tuple[str, int]] = field(default_factory=list)

    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]:
        self.calls.append((query, limit))
        return self.matches[:limit]


class FailingFactCheckProvider:
    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]:
        raise FactCheckProviderError("upstream failed")


class TimeoutFactCheckProvider:
    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]:
        raise FactCheckProviderTimeoutError("upstream timed out")


def _override_provider(provider: object) -> None:
    app.dependency_overrides[get_fact_check_provider] = lambda: provider


def _create_news_article(client: TestClient) -> tuple[int, str]:
    title = "A sample claim that may have published fact checks"
    response = client.post(
        "/api/v1/news/",
        json={
            "title": title,
            "summary": "A detailed article used for fact-check matching tests.",
            "source_name": "TrueFact Test Source",
            "source_url": f"https://example.com/news/{uuid4()}",
            "category": "technology",
            "region": "India",
            "published_at": "2026-07-23T00:00:00Z",
            "evidence_score": 70,
            "comment_count": 0,
            "repost_count": 0,
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    return response.json()["id"], title


def test_search_fact_checks_returns_normalized_matches(
    client: TestClient,
) -> None:
    provider = StubFactCheckProvider()
    _override_provider(provider)

    response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "  reviewed   sample claim  ", "limit": 3},
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["provider"] == "google_fact_check"
    assert data["query"] == "reviewed sample claim"
    assert data["match_count"] == 1
    assert data["disclaimer"] == EXPECTED_DISCLAIMER
    assert data["matches"][0] == {
        "claim_text": "A reviewed sample claim",
        "claimant": "Example claimant",
        "verdict": "Misleading",
        "publisher": "Example Fact Check",
        "review_url": "https://example.com/fact-check",
        "review_date": "2026-07-23",
    }
    assert provider.calls == [("reviewed sample claim", 3)]


def test_search_fact_checks_explains_empty_results(
    client: TestClient,
) -> None:
    provider = StubFactCheckProvider(matches=())
    _override_provider(provider)

    response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "claim without a match"},
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["match_count"] == 0
    assert data["matches"] == []
    assert data["disclaimer"] == EXPECTED_DISCLAIMER


def test_article_fact_checks_searches_using_article_title(
    client: TestClient,
) -> None:
    provider = StubFactCheckProvider()
    _override_provider(provider)
    article_id, title = _create_news_article(client)

    response = client.get(
        f"/api/v1/news/{article_id}/fact-checks",
        params={"limit": 4},
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["article_id"] == article_id
    assert data["query"] == title
    assert data["match_count"] == 1
    assert provider.calls == [(title, 4)]


def test_article_fact_checks_rejects_missing_article(
    client: TestClient,
) -> None:
    _override_provider(StubFactCheckProvider())

    response = client.get("/api/v1/news/999999/fact-checks")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "News article not found"


def test_fact_check_search_validates_query_and_limit(
    client: TestClient,
) -> None:
    _override_provider(StubFactCheckProvider())

    short_query_response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "  "},
    )
    invalid_limit_response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "valid query", "limit": 21},
    )

    assert short_query_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert invalid_limit_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_fact_check_search_maps_provider_failure(
    client: TestClient,
) -> None:
    _override_provider(FailingFactCheckProvider())

    response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "sample claim"},
    )

    assert response.status_code == status.HTTP_502_BAD_GATEWAY
    assert response.json()["detail"] == ("Fact-check provider is currently unavailable")


def test_fact_check_search_maps_provider_timeout(
    client: TestClient,
) -> None:
    _override_provider(TimeoutFactCheckProvider())

    response = client.get(
        "/api/v1/fact-checks/search",
        params={"query": "sample claim"},
    )

    assert response.status_code == status.HTTP_504_GATEWAY_TIMEOUT
    assert response.json()["detail"] == "Fact-check provider timed out"

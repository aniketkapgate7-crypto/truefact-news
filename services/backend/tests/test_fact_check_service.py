from datetime import date

from app.services.fact_check import FactCheckMatch, FactCheckProvider


def test_fact_check_match_stores_normalized_provider_data() -> None:
    match = FactCheckMatch(
        claim_text="A sample claim reviewed by a fact-checker.",
        claimant="Example claimant",
        verdict="Misleading",
        publisher="Example Fact Check",
        review_url="https://example.com/fact-check",
        review_date=date(2026, 7, 23),
    )

    assert match.claim_text == "A sample claim reviewed by a fact-checker."
    assert match.claimant == "Example claimant"
    assert match.verdict == "Misleading"
    assert match.publisher == "Example Fact Check"
    assert match.review_url == "https://example.com/fact-check"
    assert match.review_date == date(2026, 7, 23)


class StubFactCheckProvider:
    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]:
        return ()


def test_fact_check_provider_accepts_structural_implementation() -> None:
    provider = StubFactCheckProvider()

    assert isinstance(provider, FactCheckProvider)

from dataclasses import dataclass
from datetime import date
from typing import Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class FactCheckMatch:
    claim_text: str
    claimant: str | None
    verdict: str
    publisher: str
    review_url: str
    review_date: date | None


@runtime_checkable
class FactCheckProvider(Protocol):
    async def search_claims(
        self,
        query: str,
        *,
        limit: int = 5,
    ) -> tuple[FactCheckMatch, ...]: ...

"""Manual news ingestion CLI.

Run from the project root with:

    python -m app.scripts.ingest_news

The command ingests every configured feed, prints a concise per-source
result table, and exits with a non-zero code only when *every* source
fails.
"""

from __future__ import annotations

import asyncio
import sys

from app.db.database import SessionLocal
from app.services.news_ingestion import (
    DEFAULT_NEWS_FEEDS,
    LiveNewsIngestionService,
    NewsIngestionResult,
)


def _print_result(result: NewsIngestionResult) -> None:
    status = "ERROR" if result.error else "OK"
    print(
        f"[{status}] {result.source_name}: "
        f"fetched={result.fetched_count} "
        f"created={result.created_count} "
        f"skipped={result.skipped_count} "
        f"invalid={result.invalid_count}"
        + (f" — {result.error}" if result.error else "")
    )


async def _run() -> tuple[NewsIngestionResult, ...]:
    service = LiveNewsIngestionService(sources=DEFAULT_NEWS_FEEDS)

    db = SessionLocal()
    try:
        return await service.ingest_all(db)
    finally:
        db.close()


def main() -> None:
    print("TrueFact News — live ingestion starting …")

    results = asyncio.run(_run())

    for result in results:
        _print_result(result)

    all_failed = all(result.error is not None for result in results)

    if all_failed:
        print("All sources failed. Exiting with code 1.", file=sys.stderr)
        sys.exit(1)

    print("Ingestion complete.")


if __name__ == "__main__":
    main()

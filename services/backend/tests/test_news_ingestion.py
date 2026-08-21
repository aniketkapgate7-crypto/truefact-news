"""Comprehensive tests for the live-news ingestion service.

All network requests are mocked.  No test contacts NASA or any live
internet service.
"""

from __future__ import annotations

import asyncio
import textwrap
from collections.abc import Generator
from datetime import datetime, timezone
from unittest.mock import patch

import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.models import NewsArticleModel  # registers the ORM model
from app.services.news_ingestion import (
    DEFAULT_NEWS_FEEDS,
    DEFAULT_USER_AGENT,
    LiveNewsIngestionService,
    NewsFeedFetchError,
    NewsFeedResponseError,
    NewsFeedSource,
    NewsIngestionResult,
    _host_is_allowed,
    _normalized_http_url,
    _plain_text,
    _published_at,
    _truncate,
)

# ---------------------------------------------------------------------------
# Helpers – minimal NASA RSS payload
# ---------------------------------------------------------------------------

_NASA_PUB_DATE = "Mon, 18 Aug 2026 12:00:00 +0000"

NASA_FEED_SOURCE = NewsFeedSource(
    name="NASA",
    feed_url="https://www.nasa.gov/news-release/feed/",
    category="Science",
    region="Global",
    allowed_article_hosts=("nasa.gov",),
)

SECOND_FEED_SOURCE = NewsFeedSource(
    name="TestSource",
    feed_url="https://example.com/feed/",
    category="Tech",
    region="Global",
    allowed_article_hosts=("example.com",),
)


def _make_rss(
    entries: list[dict[str, str]],
    source_name: str = "NASA News",
) -> bytes:
    """Build a minimal RSS 2.0 document from a list of entry dicts."""
    items_xml = ""
    for entry in entries:
        title = entry.get("title", "Test Title")
        link = entry.get("link", "https://www.nasa.gov/test")
        summary = entry.get("summary", "Test summary text here.")
        pub_date = entry.get("pubDate", _NASA_PUB_DATE)
        items_xml += textwrap.dedent(
            f"""\
            <item>
              <title>{title}</title>
              <link>{link}</link>
              <description>{summary}</description>
              <pubDate>{pub_date}</pubDate>
            </item>
            """
        )

    feed = textwrap.dedent(
        f"""\
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>{source_name}</title>
            <link>https://www.nasa.gov/</link>
            <description>NASA News Feed</description>
            {items_xml}
          </channel>
        </rss>
        """
    )
    return feed.encode()


def _mock_http_success(content: bytes) -> httpx.AsyncClient:
    """Return an AsyncClient whose GET always responds 200 with *content*."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, content=content, request=request)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


# ---------------------------------------------------------------------------
# In-memory SQLite DB fixture (isolated per test)
# ---------------------------------------------------------------------------


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    _SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = _SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Unit tests – pure helper functions
# ---------------------------------------------------------------------------


class TestPlainText:
    def test_strips_html_tags(self) -> None:
        assert _plain_text("<p>Hello <b>World</b></p>") == "Hello World"

    def test_decodes_html_entities(self) -> None:
        result = _plain_text("SpaceX &amp; NASA")
        assert result == "SpaceX & NASA"

    def test_collapses_whitespace(self) -> None:
        assert _plain_text("  lots   of   spaces  ") == "lots of spaces"

    def test_returns_none_for_empty_string(self) -> None:
        assert _plain_text("") is None

    def test_returns_none_for_non_string(self) -> None:
        assert _plain_text(None) is None
        assert _plain_text(42) is None

    def test_removes_nested_tags(self) -> None:
        result = _plain_text("<div><p>Nested <em>content</em></p></div>")
        assert result == "Nested content"


class TestNormalizedHttpUrl:
    def test_accepts_https_url(self) -> None:
        result = _normalized_http_url("https://www.nasa.gov/article")
        assert result == "https://www.nasa.gov/article"

    def test_accepts_http_url(self) -> None:
        result = _normalized_http_url("http://www.nasa.gov/article")
        assert result == "http://www.nasa.gov/article"

    def test_strips_fragment(self) -> None:
        result = _normalized_http_url("https://nasa.gov/article#section")
        assert result is not None
        assert "#" not in result

    def test_rejects_javascript_scheme(self) -> None:
        assert _normalized_http_url("javascript:alert(1)") is None

    def test_rejects_ftp_scheme(self) -> None:
        assert _normalized_http_url("ftp://nasa.gov/file") is None

    def test_rejects_url_with_credentials(self) -> None:
        assert _normalized_http_url("https://user:pass@nasa.gov/") is None

    def test_rejects_url_too_long(self) -> None:
        long_url = "https://nasa.gov/" + "a" * 2048
        assert _normalized_http_url(long_url) is None

    def test_rejects_non_string(self) -> None:
        assert _normalized_http_url(None) is None
        assert _normalized_http_url(123) is None

    def test_lowercases_hostname(self) -> None:
        result = _normalized_http_url("https://WWW.NASA.GOV/article")
        assert result is not None
        assert "NASA" not in result


class TestHostIsAllowed:
    def test_exact_match(self) -> None:
        assert _host_is_allowed("https://nasa.gov/article", ("nasa.gov",))

    def test_subdomain_match(self) -> None:
        assert _host_is_allowed("https://www.nasa.gov/article", ("nasa.gov",))

    def test_rejects_different_domain(self) -> None:
        assert not _host_is_allowed("https://evil.com/article", ("nasa.gov",))

    def test_rejects_partial_domain_spoof(self) -> None:
        # "fakenasa.gov" must not match "nasa.gov"
        assert not _host_is_allowed("https://fakenasa.gov/article", ("nasa.gov",))

    def test_matches_any_in_list(self) -> None:
        assert _host_is_allowed(
            "https://example.com/article", ("nasa.gov", "example.com")
        )


class TestPublishedAt:
    def test_parses_rfc_2822_date(self) -> None:
        entry = {"published": "Mon, 18 Aug 2026 12:00:00 +0000"}
        result = _published_at(entry)
        assert result is not None
        assert result.tzinfo == timezone.utc
        assert result.year == 2026
        assert result.month == 8
        assert result.day == 18

    def test_parses_time_tuple(self) -> None:
        # feedparser provides published_parsed as a time.struct_time-like 9-tuple
        import time

        ts = time.gmtime(1755518400)  # 2025-08-18 12:00:00 UTC
        entry = {"published_parsed": ts}
        result = _published_at(entry)
        assert result is not None
        assert result.tzinfo == timezone.utc

    def test_falls_back_to_updated(self) -> None:
        entry = {"updated": "Mon, 18 Aug 2026 12:00:00 +0000"}
        result = _published_at(entry)
        assert result is not None

    def test_returns_none_when_no_date(self) -> None:
        assert _published_at({}) is None

    def test_converts_to_utc(self) -> None:
        entry = {"published": "Mon, 18 Aug 2026 14:00:00 +0200"}
        result = _published_at(entry)
        assert result is not None
        assert result.hour == 12


class TestTruncate:
    def test_returns_unchanged_when_short_enough(self) -> None:
        assert _truncate("Hello", 10) == "Hello"

    def test_truncates_and_appends_ellipsis(self) -> None:
        result = _truncate("A" * 300, 250)
        assert len(result) == 250
        assert result.endswith("…")

    def test_exact_boundary(self) -> None:
        text = "A" * 250
        assert _truncate(text, 250) == text


# ---------------------------------------------------------------------------
# Integration tests – LiveNewsIngestionService
# ---------------------------------------------------------------------------


class TestLiveNewsIngestionServiceInit:
    def test_accepts_valid_configuration(self) -> None:
        service = LiveNewsIngestionService(sources=[NASA_FEED_SOURCE])
        assert service is not None

    def test_rejects_empty_source_list(self) -> None:
        with pytest.raises(ValueError, match="At least one"):
            LiveNewsIngestionService(sources=[])

    def test_rejects_invalid_timeout(self) -> None:
        with pytest.raises(ValueError, match="timeout"):
            LiveNewsIngestionService(sources=[NASA_FEED_SOURCE], timeout_seconds=0)

    def test_rejects_invalid_max_articles(self) -> None:
        with pytest.raises(ValueError, match="Article limit"):
            LiveNewsIngestionService(
                sources=[NASA_FEED_SOURCE], max_articles_per_source=0
            )

    def test_rejects_invalid_feed_url(self) -> None:
        bad_source = NewsFeedSource(
            name="Bad",
            feed_url="javascript:alert(1)",
            category="X",
            region="Y",
            allowed_article_hosts=("bad.com",),
        )
        with pytest.raises(ValueError, match="Invalid feed URL"):
            LiveNewsIngestionService(sources=[bad_source])

    def test_rejects_empty_allowed_hosts(self) -> None:
        bad_source = NewsFeedSource(
            name="Bad",
            feed_url="https://example.com/feed/",
            category="X",
            region="Y",
            allowed_article_hosts=(),
        )
        with pytest.raises(ValueError, match="Allowed article hosts"):
            LiveNewsIngestionService(sources=[bad_source])


class TestValidNasaFeedIngestion:
    """Tests that parse and store a valid NASA RSS feed."""

    def _valid_feed(
        self, num_entries: int = 1, title: str = "NASA Launches New Mission"
    ) -> bytes:
        entries = [
            {
                "title": title,
                "link": f"https://www.nasa.gov/article-{i}",
                "summary": "NASA announces a new mission to explore the solar system.",
                "pubDate": _NASA_PUB_DATE,
            }
            for i in range(num_entries)
        ]
        return _make_rss(entries)

    def test_stores_valid_article(self, db: Session) -> None:
        async def run() -> NewsIngestionResult:
            feed = self._valid_feed()
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.source_name == "NASA"
        assert result.created_count == 1
        assert result.invalid_count == 0
        assert result.error is None

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert stored.source_name == "NASA"

    def test_title_normalization(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "<b>  Artemis  Mission  Update  </b>",
                    "link": "https://www.nasa.gov/artemis-update",
                    "summary": "A long enough summary for the article here.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        # HTML stripped, whitespace normalized
        assert stored.title == "Artemis Mission Update"

    def test_summary_html_removal(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "NASA Science News Story",
                    "link": "https://www.nasa.gov/science-story",
                    "summary": (
                        "<p>NASA scientists <em>discovered</em> water "
                        "on <b>Mars</b>.</p>"
                    ),
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        # All HTML tags must be removed
        assert "<" not in stored.summary
        assert ">" not in stored.summary
        # Key words must be present (exact spacing may vary by feedparser)
        assert "NASA scientists" in stored.summary
        assert "water" in stored.summary
        assert "Mars" in stored.summary

    def test_url_normalization_strips_fragment(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "Fragment URL Test Article",
                    "link": "https://www.nasa.gov/article#section",
                    "summary": "Testing URL fragment removal for deduplication.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert "#" not in stored.source_url

    def test_published_at_is_utc(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "UTC Publication Date Test",
                    "link": "https://www.nasa.gov/utc-test",
                    "summary": "Testing that published dates are stored in UTC.",
                    "pubDate": "Mon, 18 Aug 2026 14:00:00 +0200",
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        # SQLite returns naive datetimes; check only the converted hour value
        # (14:00 +0200 normalises to 12:00 UTC)
        assert stored.published_at.hour == 12

    def test_credibility_and_engagement_default_to_zero(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "Engagement Defaults Test Article",
                    "link": "https://www.nasa.gov/defaults-test",
                    "summary": "Testing credibility and engagement defaults.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert stored.evidence_score == 0
        assert stored.comment_count == 0
        assert stored.repost_count == 0

    def test_category_and_region_stored_correctly(self, db: Session) -> None:
        async def run() -> None:
            feed = _make_rss(
                [
                    {
                        "title": "Category Region Storage Test",
                        "link": "https://www.nasa.gov/cat-region-test",
                        "summary": "Checking category and region assignment.",
                        "pubDate": _NASA_PUB_DATE,
                    }
                ]
            )
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert stored.category == "Science"
        assert stored.region == "Global"


# ---------------------------------------------------------------------------
# Deduplication tests
# ---------------------------------------------------------------------------


class TestDeduplication:
    def test_duplicate_url_in_same_feed_is_skipped(self, db: Session) -> None:
        """Only one article is created when the same URL appears twice."""
        feed = _make_rss(
            [
                {
                    "title": "Duplicate Article One",
                    "link": "https://www.nasa.gov/duplicate",
                    "summary": "This article appears twice in the feed.",
                    "pubDate": _NASA_PUB_DATE,
                },
                {
                    "title": "Duplicate Article Two",
                    "link": "https://www.nasa.gov/duplicate",
                    "summary": "Same link as the first article in the feed.",
                    "pubDate": _NASA_PUB_DATE,
                },
            ]
        )

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.created_count == 1
        assert result.skipped_count == 1
        assert db.query(NewsArticleModel).count() == 1

    def test_duplicate_url_already_in_database_is_skipped(self, db: Session) -> None:
        """Subsequent ingestion of the same URL is skipped."""
        feed = _make_rss(
            [
                {
                    "title": "Pre-existing NASA Article",
                    "link": "https://www.nasa.gov/already-stored",
                    "summary": "This article is already in the database.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> tuple[NewsIngestionResult, NewsIngestionResult]:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                first = await service.ingest_source(NASA_FEED_SOURCE, db)

            # Re-use the same feed for the second ingestion
            async with _mock_http_success(feed) as client2:
                service2 = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client2
                )
                second = await service2.ingest_source(NASA_FEED_SOURCE, db)

            return first, second

        first, second = asyncio.run(run())

        assert first.created_count == 1
        assert second.created_count == 0
        assert second.skipped_count == 1
        assert db.query(NewsArticleModel).count() == 1

    def test_fragment_deduplicated_against_existing_url(self, db: Session) -> None:
        """URL#fragment must match the same bare URL already in the DB."""
        bare_url = "https://www.nasa.gov/fragment-dedup"
        fragment_url = bare_url + "#details"

        # Insert an article with the bare URL directly
        existing = NewsArticleModel(
            title="Pre-existing fragment test",
            summary="Already stored without fragment.",
            source_name="NASA",
            source_url=bare_url,
            category="Science",
            region="Global",
            published_at=datetime(2026, 8, 18, 12, 0, 0, tzinfo=timezone.utc),
            evidence_score=0,
            comment_count=0,
            repost_count=0,
        )
        db.add(existing)
        db.commit()

        feed = _make_rss(
            [
                {
                    "title": "Fragment URL Dedup Test",
                    "link": fragment_url,
                    "summary": "Same content but with a URL fragment.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.created_count == 0
        assert result.skipped_count == 1
        assert db.query(NewsArticleModel).count() == 1


# ---------------------------------------------------------------------------
# Rejection / validation tests
# ---------------------------------------------------------------------------


class TestEntryValidation:
    def test_rejects_entry_with_invalid_domain(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "External Article Not From NASA",
                    "link": "https://evil.com/fake-nasa-story",
                    "summary": "A rogue article that does not belong to NASA.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.invalid_count == 1
        assert result.created_count == 0

    def test_rejects_entry_with_missing_title(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "",
                    "link": "https://www.nasa.gov/no-title",
                    "summary": "This entry lacks a proper title.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.invalid_count == 1
        assert result.created_count == 0

    def test_rejects_entry_with_missing_link(self, db: Session) -> None:
        # Build feed by hand since helper always adds a link
        feed_bytes = textwrap.dedent(
            """\
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
              <channel>
                <title>NASA News</title>
                <link>https://www.nasa.gov/</link>
                <description>NASA News Feed</description>
                <item>
                  <title>Article Without Link</title>
                  <description>An article that has no valid link element.</description>
                  <pubDate>Mon, 18 Aug 2026 12:00:00 +0000</pubDate>
                </item>
              </channel>
            </rss>
            """
        ).encode()

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed_bytes) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.invalid_count == 1
        assert result.created_count == 0

    def test_rejects_entry_with_missing_pub_date(self, db: Session) -> None:
        feed_bytes = textwrap.dedent(
            """\
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
              <channel>
                <title>NASA News</title>
                <link>https://www.nasa.gov/</link>
                <description>NASA News Feed</description>
                <item>
                  <title>Article Without Publication Date</title>
                  <link>https://www.nasa.gov/no-date</link>
                  <description>An article without a publication date.</description>
                </item>
              </channel>
            </rss>
            """
        ).encode()

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed_bytes) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.invalid_count == 1
        assert result.created_count == 0

    def test_title_too_short_is_rejected(self, db: Session) -> None:
        feed = _make_rss(
            [
                {
                    "title": "Hi",  # < 5 chars
                    "link": "https://www.nasa.gov/short-title",
                    "summary": "An article with an extremely short title.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> NewsIngestionResult:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                return await service.ingest_source(NASA_FEED_SOURCE, db)

        result = asyncio.run(run())

        assert result.invalid_count == 1

    def test_long_title_is_truncated(self, db: Session) -> None:
        long_title = "NASA " + "A" * 300  # definitely > 250 chars
        feed = _make_rss(
            [
                {
                    "title": long_title,
                    "link": "https://www.nasa.gov/long-title",
                    "summary": "A valid summary for the truncated title test.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        async def run() -> None:
            async with _mock_http_success(feed) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert len(stored.title) <= 250

    def test_missing_summary_uses_fallback(self, db: Session) -> None:
        """An entry without a summary receives an auto-generated fallback."""
        feed_bytes = textwrap.dedent(
            """\
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
              <channel>
                <title>NASA News</title>
                <link>https://www.nasa.gov/</link>
                <description>NASA News Feed</description>
                <item>
                  <title>Article With No Summary Field</title>
                  <link>https://www.nasa.gov/no-summary</link>
                  <pubDate>Mon, 18 Aug 2026 12:00:00 +0000</pubDate>
                </item>
              </channel>
            </rss>
            """
        ).encode()

        async def run() -> None:
            async with _mock_http_success(feed_bytes) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        stored = db.query(NewsArticleModel).first()
        assert stored is not None
        assert "NASA" in stored.summary
        assert len(stored.summary) >= 10


# ---------------------------------------------------------------------------
# Network / transport error tests
# ---------------------------------------------------------------------------


class TestNetworkErrors:
    def test_http_error_raises_fetch_error(self, db: Session) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code=500, content=b"", request=request)

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        with pytest.raises(NewsFeedFetchError):
            asyncio.run(run())

    def test_timeout_raises_fetch_error(self, db: Session) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("timed out", request=request)

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        with pytest.raises(NewsFeedFetchError):
            asyncio.run(run())

    def test_connection_error_raises_fetch_error(self, db: Session) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("connection refused", request=request)

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        with pytest.raises(NewsFeedFetchError):
            asyncio.run(run())

    def test_oversized_feed_raises_response_error(self, db: Session) -> None:
        # Generate a feed that exceeds the 2 MB limit
        big_content = b"A" * (2_000_001)

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code=200, content=big_content, request=request)

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        with pytest.raises(NewsFeedResponseError):
            asyncio.run(run())

    def test_malformed_feed_with_no_entries_raises_response_error(
        self, db: Session
    ) -> None:
        garbage = b"This is not XML at all!!!"

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code=200, content=garbage, request=request)

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        with pytest.raises(NewsFeedResponseError):
            asyncio.run(run())


# ---------------------------------------------------------------------------
# Multi-source / ingest_all tests
# ---------------------------------------------------------------------------


class TestIngestAll:
    def test_one_source_failure_does_not_stop_other_sources(self, db: Session) -> None:
        """When NASA fails, the second source should still succeed."""
        good_feed = _make_rss(
            [
                {
                    "title": "Good Source Valid Article",
                    "link": "https://example.com/good-article",
                    "summary": "The second source ingested successfully.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        call_count = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal call_count
            call_count += 1
            if "nasa.gov" in str(request.url):
                return httpx.Response(status_code=503, content=b"", request=request)
            return httpx.Response(status_code=200, content=good_feed, request=request)

        async def run() -> tuple[NewsIngestionResult, ...]:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE, SECOND_FEED_SOURCE],
                    http_client=client,
                )
                return await service.ingest_all(db)

        results = asyncio.run(run())

        assert len(results) == 2
        nasa_result = next(r for r in results if r.source_name == "NASA")
        good_result = next(r for r in results if r.source_name == "TestSource")

        assert nasa_result.error is not None
        assert good_result.created_count == 1
        assert good_result.error is None

    def test_ingest_all_returns_result_for_every_source(self, db: Session) -> None:
        nasa_feed = _make_rss(
            [
                {
                    "title": "NASA Multi Source Article",
                    "link": "https://www.nasa.gov/multi-source",
                    "summary": "Testing multi-source ingestion result count.",
                    "pubDate": _NASA_PUB_DATE,
                }
            ]
        )

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code=200, content=nasa_feed, request=request)

        async def run() -> tuple[NewsIngestionResult, ...]:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=list(DEFAULT_NEWS_FEEDS), http_client=client
                )
                return await service.ingest_all(db)

        results = asyncio.run(run())

        assert len(results) == len(DEFAULT_NEWS_FEEDS)

    def test_all_sources_failing_produces_error_in_every_result(
        self, db: Session
    ) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code=500, content=b"", request=request)

        async def run() -> tuple[NewsIngestionResult, ...]:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE, SECOND_FEED_SOURCE],
                    http_client=client,
                )
                return await service.ingest_all(db)

        results = asyncio.run(run())

        assert all(r.error is not None for r in results)


# ---------------------------------------------------------------------------
# Request behaviour tests
# ---------------------------------------------------------------------------


class TestRequestBehaviour:
    def test_sends_identifiable_user_agent(self, db: Session) -> None:
        received_ua: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            received_ua.append(request.headers.get("User-Agent", ""))
            return httpx.Response(
                status_code=200,
                content=_make_rss([]),
                request=request,
            )

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        assert received_ua, "No request was made"
        assert "TrueFactNews" in received_ua[0]
        assert received_ua[0] == DEFAULT_USER_AGENT

    def test_injected_http_client_is_used(self, db: Session) -> None:
        """The injected client, not an internal one, must be used."""
        requests_seen: list[httpx.Request] = []

        def handler(request: httpx.Request) -> httpx.Response:
            requests_seen.append(request)
            return httpx.Response(
                status_code=200,
                content=_make_rss([]),
                request=request,
            )

        async def run() -> None:
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                service = LiveNewsIngestionService(
                    sources=[NASA_FEED_SOURCE], http_client=client
                )
                await service.ingest_source(NASA_FEED_SOURCE, db)

        asyncio.run(run())

        assert len(requests_seen) == 1
        assert "nasa.gov" in str(requests_seen[0].url)


# ---------------------------------------------------------------------------
# CLI / orchestration behaviour
# ---------------------------------------------------------------------------


class TestCLIBehaviour:
    def test_main_prints_result_and_exits_zero_on_success(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """main() should print a summary and exit 0 when at least one source
        succeeds."""

        success_result = NewsIngestionResult(
            source_name="NASA",
            fetched_count=5,
            created_count=3,
            skipped_count=2,
            invalid_count=0,
        )

        async def mock_ingest_all(db: Session) -> tuple[NewsIngestionResult, ...]:  # noqa: ARG001
            return (success_result,)

        import app.scripts.ingest_news as cli_module

        with (
            patch.object(
                LiveNewsIngestionService,
                "ingest_all",
                side_effect=mock_ingest_all,
            ),
            patch("app.scripts.ingest_news.SessionLocal"),
        ):
            cli_module.main()

        captured = capsys.readouterr()
        assert "NASA" in captured.out
        assert "created=3" in captured.out

    def test_main_exits_nonzero_when_all_sources_fail(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """main() must call sys.exit(1) when every source reports an error."""

        failed_result = NewsIngestionResult(
            source_name="NASA",
            fetched_count=0,
            created_count=0,
            skipped_count=0,
            invalid_count=0,
            error="Feed unavailable",
        )

        async def mock_ingest_all(db: Session) -> tuple[NewsIngestionResult, ...]:  # noqa: ARG001
            return (failed_result,)

        import app.scripts.ingest_news as cli_module

        with (
            patch.object(
                LiveNewsIngestionService,
                "ingest_all",
                side_effect=mock_ingest_all,
            ),
            patch("app.scripts.ingest_news.SessionLocal"),
            pytest.raises(SystemExit) as exc_info,
        ):
            cli_module.main()

        assert exc_info.value.code == 1

    def test_main_exits_zero_when_at_least_one_source_succeeds(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """main() must NOT exit 1 when at least one source succeeds."""

        results = (
            NewsIngestionResult(
                source_name="NASA",
                fetched_count=5,
                created_count=3,
                skipped_count=2,
                invalid_count=0,
            ),
            NewsIngestionResult(
                source_name="OtherSource",
                fetched_count=0,
                created_count=0,
                skipped_count=0,
                invalid_count=0,
                error="Unavailable",
            ),
        )

        async def mock_ingest_all(db: Session) -> tuple[NewsIngestionResult, ...]:  # noqa: ARG001
            return results

        import app.scripts.ingest_news as cli_module

        with (
            patch.object(
                LiveNewsIngestionService,
                "ingest_all",
                side_effect=mock_ingest_all,
            ),
            patch("app.scripts.ingest_news.SessionLocal"),
        ):
            # Should not raise SystemExit
            cli_module.main()

        captured = capsys.readouterr()
        assert "Ingestion complete" in captured.out

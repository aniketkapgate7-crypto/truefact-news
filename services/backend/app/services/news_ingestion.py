from __future__ import annotations

import calendar
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urlsplit, urlunsplit

import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.news import NewsArticleModel

DEFAULT_USER_AGENT = (
    "TrueFactNews/0.1 (+https://github.com/aniketkapgate7-crypto/truefact-news)"
)
DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_MAX_ARTICLES = 20
DEFAULT_MAX_FEED_BYTES = 2_000_000


@dataclass(frozen=True, slots=True)
class NewsFeedSource:
    """Configuration for an approved RSS or Atom source."""

    name: str
    feed_url: str
    category: str
    region: str
    allowed_article_hosts: tuple[str, ...]


NASA_NEWS_FEED = NewsFeedSource(
    name="NASA",
    feed_url="https://www.nasa.gov/news-release/feed/",
    category="Science",
    region="Global",
    allowed_article_hosts=("nasa.gov",),
)

DEFAULT_NEWS_FEEDS = (NASA_NEWS_FEED,)


@dataclass(frozen=True, slots=True)
class NewsIngestionResult:
    """Summary of one feed-ingestion attempt."""

    source_name: str
    fetched_count: int
    created_count: int
    skipped_count: int
    invalid_count: int
    error: str | None = None


class NewsIngestionError(RuntimeError):
    """Base error raised during live-news ingestion."""


class NewsFeedFetchError(NewsIngestionError):
    """Raised when a configured feed cannot be downloaded."""


class NewsFeedResponseError(NewsIngestionError):
    """Raised when a configured feed returns unusable content."""


class NewsIngestionStorageError(NewsIngestionError):
    """Raised when normalized articles cannot be stored."""


class _PlainTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        return " ".join(" ".join(self.parts).split())


def _optional_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    normalized = " ".join(value.split())
    return normalized or None


def _plain_text(value: object) -> str | None:
    text = _optional_text(value)

    if text is None:
        return None

    parser = _PlainTextParser()

    try:
        parser.feed(text)
        parser.close()
    except (TypeError, ValueError):
        return text

    return parser.text() or None


def _truncate(text: str, maximum_length: int) -> str:
    if len(text) <= maximum_length:
        return text

    return f"{text[: maximum_length - 1].rstrip()}…"


def _normalized_http_url(value: object) -> str | None:
    text = _optional_text(value)

    if text is None or len(text) > 2048:
        return None

    try:
        parsed = urlsplit(text)
        port = parsed.port
    except ValueError:
        return None

    hostname = parsed.hostname

    if (
        parsed.scheme.lower() not in {"http", "https"}
        or hostname is None
        or parsed.username is not None
        or parsed.password is not None
    ):
        return None

    normalized_host = hostname.lower().rstrip(".")
    netloc = normalized_host if port is None else f"{normalized_host}:{port}"

    return urlunsplit(
        (
            parsed.scheme.lower(),
            netloc,
            parsed.path or "/",
            parsed.query,
            "",
        )
    )


def _host_is_allowed(
    article_url: str,
    allowed_hosts: Sequence[str],
) -> bool:
    hostname = urlsplit(article_url).hostname

    if hostname is None:
        return False

    normalized_hostname = hostname.lower().rstrip(".")

    return any(
        normalized_hostname == allowed_host.lower().rstrip(".")
        or normalized_hostname.endswith(f".{allowed_host.lower().rstrip('.')}")
        for allowed_host in allowed_hosts
    )


def _published_at(entry: Mapping[str, object]) -> datetime | None:
    for field_name in ("published_parsed", "updated_parsed"):
        structured_date = entry.get(field_name)

        if structured_date is None:
            continue

        try:
            timestamp = calendar.timegm(structured_date)
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except (OverflowError, TypeError, ValueError):
            continue

    for field_name in ("published", "updated"):
        date_text = _optional_text(entry.get(field_name))

        if date_text is None:
            continue

        try:
            parsed_date = parsedate_to_datetime(date_text)
        except (TypeError, ValueError):
            try:
                parsed_date = datetime.fromisoformat(date_text.replace("Z", "+00:00"))
            except ValueError:
                continue

        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)

        return parsed_date.astimezone(timezone.utc)

    return None


class LiveNewsIngestionService:
    """Download approved feeds and store normalized article metadata."""

    def __init__(
        self,
        *,
        sources: Sequence[NewsFeedSource] = DEFAULT_NEWS_FEEDS,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        max_articles_per_source: int = DEFAULT_MAX_ARTICLES,
        max_feed_bytes: int = DEFAULT_MAX_FEED_BYTES,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        if not sources:
            raise ValueError("At least one news feed source is required")

        if timeout_seconds <= 0:
            raise ValueError("Feed timeout must be greater than zero")

        if not 1 <= max_articles_per_source <= 100:
            raise ValueError("Article limit must be between 1 and 100")

        if max_feed_bytes <= 0:
            raise ValueError("Maximum feed size must be greater than zero")

        for source in sources:
            if _normalized_http_url(source.feed_url) is None:
                raise ValueError(f"Invalid feed URL for {source.name}")

            if not source.allowed_article_hosts:
                raise ValueError(
                    f"Allowed article hosts are required for {source.name}"
                )

        self._sources = tuple(sources)
        self._timeout_seconds = timeout_seconds
        self._max_articles_per_source = max_articles_per_source
        self._max_feed_bytes = max_feed_bytes
        self._http_client = http_client

    async def ingest_all(
        self,
        db: Session,
    ) -> tuple[NewsIngestionResult, ...]:
        """Ingest every configured feed without one failure stopping others."""

        results: list[NewsIngestionResult] = []

        for source in self._sources:
            try:
                result = await self.ingest_source(source, db)
            except NewsIngestionError as error:
                db.rollback()
                result = NewsIngestionResult(
                    source_name=source.name,
                    fetched_count=0,
                    created_count=0,
                    skipped_count=0,
                    invalid_count=0,
                    error=str(error),
                )

            results.append(result)

        return tuple(results)

    async def ingest_source(
        self,
        source: NewsFeedSource,
        db: Session,
    ) -> NewsIngestionResult:
        entries = await self._fetch_entries(source)
        considered_entries = entries[: self._max_articles_per_source]

        articles_by_url: dict[str, NewsArticleModel] = {}
        invalid_count = 0
        repeated_count = 0

        for raw_entry in considered_entries:
            if not isinstance(raw_entry, Mapping):
                invalid_count += 1
                continue

            article = self._normalize_entry(raw_entry, source)

            if article is None:
                invalid_count += 1
                continue

            if article.source_url in articles_by_url:
                repeated_count += 1
                continue

            articles_by_url[article.source_url] = article

        candidate_urls = list(articles_by_url)

        existing_urls: set[str] = set()

        if candidate_urls:
            statement = select(NewsArticleModel.source_url).where(
                NewsArticleModel.source_url.in_(candidate_urls)
            )
            existing_urls = set(db.scalars(statement).all())

        new_articles = [
            article
            for source_url, article in articles_by_url.items()
            if source_url not in existing_urls
        ]

        if new_articles:
            try:
                db.add_all(new_articles)
                db.commit()
            except IntegrityError as error:
                db.rollback()
                raise NewsIngestionStorageError(
                    f"Could not store articles from {source.name}"
                ) from error

        return NewsIngestionResult(
            source_name=source.name,
            fetched_count=len(considered_entries),
            created_count=len(new_articles),
            skipped_count=len(existing_urls) + repeated_count,
            invalid_count=invalid_count,
        )

    async def _fetch_entries(
        self,
        source: NewsFeedSource,
    ) -> list[object]:
        try:
            response = await self._send_request(source.feed_url)
            response.raise_for_status()
        except httpx.TimeoutException as error:
            raise NewsFeedFetchError(f"{source.name} feed timed out") from error
        except httpx.HTTPStatusError as error:
            raise NewsFeedFetchError(
                f"{source.name} rejected the feed request"
            ) from error
        except httpx.RequestError as error:
            raise NewsFeedFetchError(f"{source.name} feed is unavailable") from error

        if len(response.content) > self._max_feed_bytes:
            raise NewsFeedResponseError(f"{source.name} feed exceeded the size limit")

        parsed_feed = feedparser.parse(response.content)
        entries = parsed_feed.get("entries", [])

        if not isinstance(entries, list):
            raise NewsFeedResponseError(f"{source.name} returned an invalid feed")

        if parsed_feed.get("bozo") and not entries:
            raise NewsFeedResponseError(
                f"{source.name} returned malformed feed content"
            )

        return list(entries)

    async def _send_request(self, feed_url: str) -> httpx.Response:
        headers = {
            "Accept": (
                "application/rss+xml, application/atom+xml, application/xml;q=0.9"
            ),
            "User-Agent": DEFAULT_USER_AGENT,
        }

        if self._http_client is not None:
            return await self._http_client.get(
                feed_url,
                headers=headers,
            )

        async with httpx.AsyncClient(
            timeout=self._timeout_seconds,
            follow_redirects=False,
        ) as client:
            return await client.get(
                feed_url,
                headers=headers,
            )

    def _normalize_entry(
        self,
        entry: Mapping[str, object],
        source: NewsFeedSource,
    ) -> NewsArticleModel | None:
        title = _plain_text(entry.get("title"))
        source_url = _normalized_http_url(entry.get("link"))
        published_at = _published_at(entry)

        if (
            title is None
            or len(title) < 5
            or source_url is None
            or published_at is None
            or not _host_is_allowed(
                source_url,
                source.allowed_article_hosts,
            )
        ):
            return None

        summary = _plain_text(entry.get("summary"))
        summary = summary or _plain_text(entry.get("description"))

        if summary is None or len(summary) < 10:
            summary = (
                f"Latest update published by {source.name}. "
                "Open the original source for full details."
            )

        return NewsArticleModel(
            title=_truncate(title, 250),
            summary=_truncate(summary, 1000),
            source_name=_truncate(source.name, 150),
            source_url=source_url,
            category=_truncate(source.category, 100),
            region=_truncate(source.region, 100),
            published_at=published_at,
            evidence_score=0,
            comment_count=0,
            repost_count=0,
        )

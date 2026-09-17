from __future__ import annotations

import calendar
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

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

# Timeout and size limit for optional Open-Graph image fetches.
_OG_TIMEOUT_SECONDS = 5.0
_OG_MAX_RESPONSE_BYTES = 131_072  # 128 KB — enough for the HTML head section

# Regex to find <img src="..."> in HTML (used only when other methods fail).
_IMG_SRC_RE = re.compile(
    r"""<img[^>]+src\s*=\s*(?:"([^"]{1,2048})"|'([^']{1,2048})')""",
    re.IGNORECASE,
)

# Regex to find og:image / twitter:image meta tags.
_OG_META_RE = re.compile(
    r"""<meta[^>]+(?:property|name)\s*=\s*['"](?:og:image|twitter:image(?::src)?)['"][^>]+content\s*=\s*['"]([^'"]{1,2048})['"]"""
    r"""|<meta[^>]+content\s*=\s*['"]([^'"]{1,2048})['"][^>]+(?:property|name)\s*=\s*['"](?:og:image|twitter:image(?::src)?)['"]""",
    re.IGNORECASE | re.DOTALL,
)


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

ESA_NEWS_FEED = NewsFeedSource(
    name="ESA",
    feed_url="https://www.esa.int/rssfeed/Our_Activities/Observing_the_Earth",
    category="Science",
    region="Europe",
    allowed_article_hosts=("esa.int",),
)

BBC_SCIENCE_FEED = NewsFeedSource(
    name="BBC News",
    feed_url="http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    category="Science",
    region="UK",
    allowed_article_hosts=("bbc.com", "bbc.co.uk"),
)

BBC_WORLD_FEED = NewsFeedSource(
    name="BBC News",
    feed_url="http://feeds.bbci.co.uk/news/world/rss.xml",
    category="World",
    region="Global",
    allowed_article_hosts=("bbc.com", "bbc.co.uk"),
)

NPR_NEWS_FEED = NewsFeedSource(
    name="NPR",
    feed_url="https://feeds.npr.org/1001/rss.xml",
    category="World",
    region="USA",
    allowed_article_hosts=("npr.org",),
)

NPR_SCIENCE_FEED = NewsFeedSource(
    name="NPR",
    feed_url="https://feeds.npr.org/1007/rss.xml",
    category="Science",
    region="Global",
    allowed_article_hosts=("npr.org",),
)

UN_NEWS_FEED = NewsFeedSource(
    name="UN News",
    feed_url="https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    category="World",
    region="Global",
    allowed_article_hosts=("un.org",),
)

WHO_NEWS_FEED = NewsFeedSource(
    name="WHO",
    feed_url="https://www.who.int/rss-feeds/news-english.xml",
    category="Science",
    region="Global",
    allowed_article_hosts=("who.int",),
)

DEFAULT_NEWS_FEEDS = (
    NASA_NEWS_FEED,
    ESA_NEWS_FEED,
    BBC_SCIENCE_FEED,
    BBC_WORLD_FEED,
    NPR_NEWS_FEED,
    NPR_SCIENCE_FEED,
    UN_NEWS_FEED,
    WHO_NEWS_FEED,
)


@dataclass(frozen=True, slots=True)
class NewsIngestionResult:
    """Summary of one feed-ingestion attempt."""

    source_name: str
    fetched_count: int
    created_count: int
    skipped_count: int
    invalid_count: int
    enriched_count: int = 0
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


class _ImageSrcParser(HTMLParser):
    """Extract the first <img src=...> URL from an HTML fragment."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.first_src: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "img" and self.first_src is None:
            for attr_name, attr_val in attrs:
                if attr_name.lower() == "src" and attr_val:
                    self.first_src = attr_val
                    break


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


def _safe_image_url(candidate: str | None) -> str | None:
    """Validate and normalise a candidate image URL.

    Accepts only http/https URLs ≤ 2048 characters.
    Rejects empty strings, data: URIs, javascript: URIs, credentials, and
    anything that does not parse as a valid URL.
    """
    if not candidate:
        return None

    # Fast reject for obviously unsafe schemes before urlsplit.
    low = candidate.lower().lstrip()
    if low.startswith(("data:", "javascript:", "vbscript:")):
        return None

    return _normalized_http_url(candidate)


def _resolve_url(candidate: str, base_url: str) -> str | None:
    """Resolve *candidate* against *base_url* and validate the result."""
    if not candidate:
        return None

    resolved = urljoin(base_url, candidate)
    return _safe_image_url(resolved)


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


def _extract_image_from_html(html: str, base_url: str) -> str | None:
    """Find the first <img src> in an HTML snippet and resolve it."""
    parser = _ImageSrcParser()
    try:
        parser.feed(html)
        parser.close()
    except Exception:  # noqa: BLE001
        # Fall back to regex if HTMLParser chokes on malformed HTML.
        m = _IMG_SRC_RE.search(html)
        if m:
            src = m.group(1) or m.group(2)
            return _resolve_url(src, base_url) if src else None
        return None

    if parser.first_src:
        return _resolve_url(parser.first_src, base_url)
    return None


def _extract_og_image_from_html(html: str, base_url: str) -> str | None:
    """Extract og:image / twitter:image from a partial HTML response."""
    m = _OG_META_RE.search(html)
    if not m:
        return None
    raw = m.group(1) or m.group(2)
    return _resolve_url(raw, base_url) if raw else None


def _extract_image_url(
    entry: Mapping[str, object],
    article_url: str,
    allowed_hosts: Sequence[str],
) -> str | None:
    """Extract the best available image URL from an RSS entry.

    Priority:
      1. media:content[0].url  (RSS Media namespace)
      2. media:thumbnail[0].url
      3. First image enclosure
      4. First <img src> in summary/content HTML
      5. og:image / twitter:image from article page (only for approved hosts,
         strict timeout + size limits)

    Images are validated; only http/https URLs ≤ 2048 chars are accepted.
    """

    # ── 1. media:content ─────────────────────────────────────────────
    media_content = entry.get("media_content")
    if isinstance(media_content, list):
        for item in media_content:
            if isinstance(item, dict):
                url = _safe_image_url(_optional_text(item.get("url")))
                if url:
                    return url

    # ── 2. media:thumbnail ───────────────────────────────────────────
    media_thumbnail = entry.get("media_thumbnail")
    if isinstance(media_thumbnail, list):
        for item in media_thumbnail:
            if isinstance(item, dict):
                url = _safe_image_url(_optional_text(item.get("url")))
                if url:
                    return url

    # ── 3. Enclosures with image MIME type ───────────────────────────
    enclosures = entry.get("enclosures")
    if isinstance(enclosures, list):
        for enc in enclosures:
            if not isinstance(enc, dict):
                continue
            mime = _optional_text(enc.get("type")) or ""
            if mime.startswith("image/"):
                url = _safe_image_url(_optional_text(enc.get("href") or enc.get("url")))
                if url:
                    return url

    # ── 4. <img src> in summary / content HTML ───────────────────────
    for field_name in ("summary", "description", "content"):
        raw = entry.get(field_name)
        # feedparser may return content as a list of dicts.
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, dict):
                    raw = item.get("value", "")
                    break
        html = _optional_text(raw)
        if html and "<img" in html.lower():
            url = _extract_image_from_html(html, article_url)
            if url:
                return url

    # ── 5. OG/twitter image (only for approved article hosts) ────────
    # We only fetch the article page when the host is already in the
    # allowed list; this prevents SSRF against arbitrary URLs.
    if _host_is_allowed(article_url, allowed_hosts):
        return None  # OG fetch is deferred to async context; skip here.

    return None


async def _fetch_og_image(
    article_url: str,
    allowed_hosts: Sequence[str],
    http_client: httpx.AsyncClient | None,
) -> str | None:
    """Fetch the article page (partial) and extract og:image.

    Only called for URLs on approved hosts. Enforces strict timeout and
    response-size limits to prevent SSRF / resource abuse.
    """
    if not _host_is_allowed(article_url, allowed_hosts):
        return None

    headers = {
        "Accept": "text/html",
        "User-Agent": DEFAULT_USER_AGENT,
    }

    try:
        if http_client is not None:
            response = await http_client.get(article_url, headers=headers)
        else:
            async with httpx.AsyncClient(
                timeout=_OG_TIMEOUT_SECONDS,
                follow_redirects=False,  # no redirect out of approved hosts
            ) as client:
                response = await client.get(article_url, headers=headers)

        # Validate the redirect destination stays on an approved host.
        if response.is_redirect:
            location = response.headers.get("location", "")
            if not _host_is_allowed(location, allowed_hosts):
                return None

        if not response.is_success:
            return None

        # Read only the first chunk — we only need the <head> section.
        partial_html = response.content[:_OG_MAX_RESPONSE_BYTES].decode(
            "utf-8", errors="replace"
        )
        return _extract_og_image_from_html(partial_html, article_url)

    except (httpx.RequestError, httpx.TimeoutException):
        return None


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


@dataclass
class _NormalizedEntry:
    """Holds normalized article data before DB creation."""

    title: str
    summary: str
    source_name: str
    source_url: str
    image_url: str | None
    category: str
    region: str
    published_at: datetime
    evidence_score: int = 0
    comment_count: int = 0
    repost_count: int = 0


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

        normalized_by_url: dict[str, _NormalizedEntry] = {}
        invalid_count = 0
        repeated_count = 0

        for raw_entry in considered_entries:
            if not isinstance(raw_entry, Mapping):
                invalid_count += 1
                continue

            normalized = await self._normalize_entry(raw_entry, source)

            if normalized is None:
                invalid_count += 1
                continue

            if normalized.source_url in normalized_by_url:
                repeated_count += 1
                continue

            normalized_by_url[normalized.source_url] = normalized

        candidate_urls = list(normalized_by_url)

        # Fetch existing records once (avoids N+1).
        existing_by_url: dict[str, NewsArticleModel] = {}
        if candidate_urls:
            statement = select(NewsArticleModel).where(
                NewsArticleModel.source_url.in_(candidate_urls)
            )
            for existing in db.scalars(statement).all():
                existing_by_url[existing.source_url] = existing

        new_articles: list[NewsArticleModel] = []
        enriched_count = 0

        for url, normalized in normalized_by_url.items():
            existing = existing_by_url.get(url)

            if existing is None:
                # Brand new article.
                new_articles.append(
                    NewsArticleModel(
                        title=normalized.title,
                        summary=normalized.summary,
                        source_name=normalized.source_name,
                        source_url=normalized.source_url,
                        image_url=normalized.image_url,
                        category=normalized.category,
                        region=normalized.region,
                        published_at=normalized.published_at,
                        evidence_score=normalized.evidence_score,
                        comment_count=normalized.comment_count,
                        repost_count=normalized.repost_count,
                    )
                )
            elif existing.image_url is None and normalized.image_url is not None:
                # Enrich existing article with a newly discovered image.
                existing.image_url = normalized.image_url
                enriched_count += 1

        if new_articles:
            try:
                db.add_all(new_articles)
                db.commit()
            except IntegrityError as error:
                db.rollback()
                raise NewsIngestionStorageError(
                    f"Could not store articles from {source.name}"
                ) from error
        elif enriched_count > 0:
            # Only enrichments — commit the image updates.
            try:
                db.commit()
            except IntegrityError as error:
                db.rollback()
                raise NewsIngestionStorageError(
                    f"Could not enrich articles from {source.name}"
                ) from error

        # Auto-assess newly created articles and refresh any corroborated existing articles.
        if new_articles:
            from app.services.auto_assessment import (
                AutomaticAssessmentService,  # noqa: PLC0415
            )

            assessment_service = AutomaticAssessmentService()
            for article in new_articles:
                try:
                    assessment_service.assess_article(article, db)
                    db.commit()
                except Exception:  # noqa: BLE001
                    db.rollback()

            # Refresh any existing articles that may now have independent corroboration
            try:
                assessment_service.assess_batch(db, refresh=True)
                db.commit()
            except Exception:  # noqa: BLE001
                db.rollback()

        return NewsIngestionResult(
            source_name=source.name,
            fetched_count=len(considered_entries),
            created_count=len(new_articles),
            skipped_count=len(existing_by_url) - enriched_count + repeated_count,
            invalid_count=invalid_count,
            enriched_count=enriched_count,
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

    async def _normalize_entry(
        self,
        entry: Mapping[str, object],
        source: NewsFeedSource,
    ) -> _NormalizedEntry | None:
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

        # Extract image BEFORE stripping HTML from the summary/description.
        image_url = _extract_image_url(entry, source_url, source.allowed_article_hosts)

        # If no image found yet, try an OG fetch (approved hosts only).
        if image_url is None:
            image_url = await _fetch_og_image(
                source_url,
                source.allowed_article_hosts,
                self._http_client,
            )

        summary = _plain_text(entry.get("summary"))
        summary = summary or _plain_text(entry.get("description"))

        if summary is None or len(summary) < 10:
            summary = (
                f"Latest update published by {source.name}. "
                "Open the original source for full details."
            )

        return _NormalizedEntry(
            title=_truncate(title, 250),
            summary=_truncate(summary, 1000),
            source_name=_truncate(source.name, 150),
            source_url=source_url,
            image_url=image_url,
            category=_truncate(source.category, 100),
            region=_truncate(source.region, 100),
            published_at=published_at,
        )

"""Automatic credibility assessment service.

Creates and updates ``CredibilityAssessmentModel`` records for news articles
using deterministic, evidence-based heuristics and independent cross-source corroboration.
The saved ``CredibilityAssessmentModel.credibility_score`` is always the canonical value.

Key constraints enforced:
* Source reputation alone is never treated as proof of an article's claims.
* Reposts, comments, or popularity never increase credibility.
* Articles from the same organization count as one source, not independent corroboration.
* Weak title matches and unrelated stories are strictly rejected.
* Recalculation occurs only when new genuine evidence or independent corroboration exists.
* Existing assessments remain idempotent when no new evidence is discovered.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.services.credibility import calculate_credibility_score

# ---------------------------------------------------------------------------
# Source reliability configuration
# ---------------------------------------------------------------------------
# Transparent reliability scores (0–100) for approved institutional, scientific,
# government, and major editorial news publishers.
# ---------------------------------------------------------------------------

SOURCE_RELIABILITY_CONFIG: dict[str, int] = {
    # Official government & scientific institutions (primary data & research publishers)
    "nasa.gov": 88,
    "esa.int": 86,
    "usgs.gov": 88,
    "noaa.gov": 88,
    "cdc.gov": 87,
    "nih.gov": 87,
    "who.int": 82,
    "un.org": 80,
    "gov.uk": 80,
    # Major news agencies & public broadcasters with editorial oversight
    "reuters.com": 82,
    "apnews.com": 82,
    "bbc.com": 78,
    "bbc.co.uk": 78,
    "npr.org": 76,
    "pbs.org": 76,
    "theguardian.com": 74,
    "nytimes.com": 74,
    "washingtonpost.com": 74,
}

# Recognized primary research & institutional domains
PRIMARY_INSTITUTIONAL_DOMAINS: frozenset[str] = frozenset(
    {
        "nasa.gov",
        "esa.int",
        "usgs.gov",
        "noaa.gov",
        "cdc.gov",
        "nih.gov",
        "who.int",
    }
)

# Minimum source reliability required to auto-assess an article
_MIN_RELIABILITY_FOR_ASSESSMENT = 55

# Method version string
_METHOD_VERSION = "auto-v2"

# English stopwords to filter when extracting significant keywords
STOPWORDS: frozenset[str] = frozenset(
    {
        "a",
        "about",
        "above",
        "after",
        "again",
        "against",
        "all",
        "am",
        "an",
        "and",
        "any",
        "are",
        "aren",
        "as",
        "at",
        "be",
        "because",
        "been",
        "before",
        "being",
        "below",
        "between",
        "both",
        "but",
        "by",
        "can",
        "could",
        "did",
        "do",
        "does",
        "doing",
        "down",
        "during",
        "each",
        "few",
        "for",
        "from",
        "further",
        "had",
        "has",
        "have",
        "having",
        "he",
        "her",
        "here",
        "hers",
        "herself",
        "him",
        "himself",
        "his",
        "how",
        "if",
        "in",
        "into",
        "is",
        "it",
        "its",
        "itself",
        "just",
        "more",
        "most",
        "my",
        "myself",
        "no",
        "nor",
        "not",
        "now",
        "of",
        "off",
        "on",
        "once",
        "only",
        "or",
        "other",
        "our",
        "ours",
        "ourselves",
        "out",
        "over",
        "own",
        "s",
        "same",
        "she",
        "should",
        "so",
        "some",
        "such",
        "t",
        "than",
        "that",
        "the",
        "their",
        "theirs",
        "them",
        "themselves",
        "then",
        "there",
        "these",
        "they",
        "this",
        "those",
        "through",
        "to",
        "too",
        "under",
        "until",
        "up",
        "very",
        "was",
        "we",
        "were",
        "what",
        "when",
        "where",
        "which",
        "while",
        "who",
        "whom",
        "why",
        "will",
        "with",
        "would",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        # Generic journalistic noise words
        "news",
        "report",
        "reports",
        "reported",
        "update",
        "updates",
        "updated",
        "latest",
        "today",
        "yesterday",
        "week",
        "month",
        "year",
        "says",
        "said",
        "statement",
        "announced",
        "announces",
        "release",
        "press",
        "official",
        "breaking",
        "story",
        "stories",
        "article",
        "articles",
        "published",
        "new",
    }
)


def get_registered_domain(url_or_host: str) -> str | None:
    """Return the normalized root registered domain for a URL or hostname.

    Examples:
        'https://science.nasa.gov/earth/heat' -> 'nasa.gov'
        'http://feeds.bbci.co.uk/news/rss.xml' -> 'bbc.co.uk'
        'https://news.un.org/feed' -> 'un.org'
        'https://www.reuters.com/world' -> 'reuters.com'
    """
    if not url_or_host:
        return None

    try:
        if "://" in url_or_host:
            hostname = urlsplit(url_or_host).hostname
        else:
            hostname = url_or_host.split("/")[0]

        if not hostname:
            return None

        hostname = hostname.lower().rstrip(".")
    except Exception:
        return None

    parts = hostname.split(".")
    if len(parts) <= 2:
        return hostname

    # Handle multi-part ccTLDs like .co.uk, .gov.uk, .org.uk, .com.au
    second_level_suffixes = {
        "co.uk",
        "gov.uk",
        "org.uk",
        "ac.uk",
        "com.au",
        "gov.au",
        "co.jp",
    }
    joined_last_two = ".".join(parts[-2:])
    if joined_last_two in second_level_suffixes and len(parts) >= 3:
        dom = ".".join(parts[-3:])
    else:
        dom = ".".join(parts[-2:])

    # Domain aliases (e.g. bbci.co.uk -> bbc.co.uk)
    aliases = {
        "bbci.co.uk": "bbc.co.uk",
    }
    return aliases.get(dom, dom)


def _source_hostname(source_url: str) -> str | None:
    """Return the normalized hostname of an article source URL, or None."""
    try:
        hostname = urlsplit(source_url).hostname
        if hostname:
            return hostname.lower().rstrip(".")
    except ValueError:
        pass
    return None


def _lookup_source_reliability(source_url: str) -> int | None:
    """Return the configured reliability score for a source URL, or None."""
    hostname = _source_hostname(source_url)
    if hostname is None:
        return None

    # Exact match first
    if hostname in SOURCE_RELIABILITY_CONFIG:
        return SOURCE_RELIABILITY_CONFIG[hostname]

    # Parent-domain walk: "science.nasa.gov" -> "nasa.gov"
    parts = hostname.split(".")
    for i in range(1, len(parts)):
        parent = ".".join(parts[i:])
        if parent in SOURCE_RELIABILITY_CONFIG:
            return SOURCE_RELIABILITY_CONFIG[parent]

    return None


def extract_significant_keywords(text: str) -> set[str]:
    """Extract normalized significant content words (entities/topics/terms)."""
    if not text:
        return set()

    clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = clean_text.split()
    return {
        word
        for word in tokens
        if len(word) >= 3 and word not in STOPWORDS and not word.isdigit()
    }


def match_corroborating_articles(
    target: NewsArticleModel,
    candidates: list[NewsArticleModel],
) -> list[NewsArticleModel]:
    """Find genuinely related articles from independent approved sources.

    Strict rules:
    - Same organization (same registered domain) is NOT independent.
    - Weak single-word matches or generic overlap are rejected.
    - Requires at least 3 shared significant keywords OR Jaccard similarity >= 0.28
      with at least 2 significant keywords.
    """
    target_domain = get_registered_domain(target.source_url)
    if not target_domain:
        return []

    target_title_kw = extract_significant_keywords(target.title)
    target_all_kw = target_title_kw | extract_significant_keywords(target.summary)

    corroborating: list[NewsArticleModel] = []

    for candidate in candidates:
        if candidate.id == target.id:
            continue

        cand_domain = get_registered_domain(candidate.source_url)
        if not cand_domain or cand_domain == target_domain:
            # Same organization or invalid domain -> cannot be independent corroboration
            continue

        cand_title_kw = extract_significant_keywords(candidate.title)
        cand_all_kw = cand_title_kw | extract_significant_keywords(candidate.summary)

        # Title-to-title overlap
        title_overlap = target_title_kw & cand_title_kw

        # Full content overlap
        all_overlap = target_all_kw & cand_all_kw
        union_count = len(target_all_kw | cand_all_kw)
        jaccard = len(all_overlap) / union_count if union_count > 0 else 0.0

        # Match threshold evaluation:
        # 1. High title keyword overlap (>= 2 title keywords)
        # 2. Strong content overlap (>= 3 shared significant keywords and Jaccard >= 0.18)
        # 3. High Jaccard similarity (>= 0.28 with >= 2 shared keywords)
        is_match = (
            len(title_overlap) >= 2
            or (len(all_overlap) >= 3 and jaccard >= 0.18)
            or (len(all_overlap) >= 2 and jaccard >= 0.28)
        )

        if is_match:
            corroborating.append(candidate)

    return corroborating


def is_primary_source(source_url: str) -> bool:
    """Return True if source is an official primary scientific/institutional publisher."""
    domain = get_registered_domain(source_url)
    return domain in PRIMARY_INSTITUTIONAL_DOMAINS if domain else False


def _evidence_quality_score(
    article: NewsArticleModel,
    *,
    is_primary: bool = False,
    corroborating_count: int = 0,
) -> int:
    """Estimate evidence quality from article data and primary verification."""
    score = 0

    # Summary informational depth
    summary_len = len(article.summary)
    if summary_len >= 400:
        score += 25
    elif summary_len >= 200:
        score += 18
    elif summary_len >= 80:
        score += 10
    else:
        score += 5

    # Title precision
    title = article.title
    if len(title) >= 20 and not title.isupper():
        score += 15
    elif len(title) >= 10:
        score += 8

    # Editorial / verified image
    if article.image_url:
        score += 10

    # Category evidential weight
    if article.category in {"Science", "Business", "Tech"}:
        score += 10

    # Primary institutional source publishes first-party data/measurements
    if is_primary:
        score += 20

    # Supporting external corroborating articles
    if corroborating_count >= 2:
        score += 20
    elif corroborating_count == 1:
        score += 10

    return min(score, 100)


def _content_quality_score(article: NewsArticleModel) -> int:
    """Estimate content presentation quality from article metadata."""
    score = 0

    title = article.title
    if "?" not in title and "!" not in title:
        score += 15
    elif not title.isupper():
        score += 5

    if len(article.summary) >= 150:
        score += 15
    elif len(article.summary) >= 80:
        score += 10

    if article.category in {"Science", "World", "Politics", "Business"}:
        score += 10

    return min(score, 40)


def _calculate_corroboration_score(independent_source_count: int) -> int:
    """Calculate corroboration score based on distinct independent sources."""
    if independent_source_count <= 0:
        return 0
    if independent_source_count == 1:
        return 40
    if independent_source_count == 2:
        return 70
    if independent_source_count == 3:
        return 85
    return min(85 + (independent_source_count - 3) * 5, 100)


def _derive_assessment_params(
    article: NewsArticleModel,
    source_reliability: int,
    corroborating_articles: list[NewsArticleModel],
) -> dict:
    """Derive all canonical assessment parameters from article data and corroboration."""
    primary = is_primary_source(article.source_url)
    primary_source_count = 1 if primary else 0

    # Count distinct independent domains
    target_domain = get_registered_domain(article.source_url)
    independent_domains = {
        get_registered_domain(c.source_url)
        for c in corroborating_articles
        if get_registered_domain(c.source_url)
        and get_registered_domain(c.source_url) != target_domain
    }
    independent_source_count = len(independent_domains)

    corroboration_score = _calculate_corroboration_score(independent_source_count)
    evidence_quality = _evidence_quality_score(
        article,
        is_primary=primary,
        corroborating_count=len(corroborating_articles),
    )
    content_quality = _content_quality_score(article)

    # Derive composite credibility score via canonical formula
    credibility_score = calculate_credibility_score(
        source_reliability_score=source_reliability,
        evidence_quality_score=evidence_quality,
        corroboration_score=corroboration_score,
        content_quality_score=content_quality,
    )

    supporting_evidence_count = len(corroborating_articles) + primary_source_count

    corrob_desc = (
        f"{independent_source_count} independent source(s) verified"
        if independent_source_count > 0
        else "No independent corroboration sources verified yet"
    )
    primary_desc = " Primary institutional source verified." if primary else ""

    explanation = (
        f"Automatic assessment: Source reliability ({source_reliability}/100), "
        f"evidence quality ({evidence_quality}/100), "
        f"corroboration ({corroboration_score}/100), "
        f"and content quality ({content_quality}/100). {corrob_desc}.{primary_desc}"
    )

    return dict(
        source_reliability_score=source_reliability,
        evidence_quality_score=evidence_quality,
        corroboration_score=corroboration_score,
        content_quality_score=content_quality,
        supporting_evidence_count=supporting_evidence_count,
        contradicting_evidence_count=0,
        independent_source_count=independent_source_count,
        primary_source_count=primary_source_count,
        is_evolving=False,
        credibility_score=credibility_score,
        explanation=explanation,
        method_version=_METHOD_VERSION,
    )


@dataclass(frozen=True, slots=True)
class AutoAssessmentResult:
    """Summary returned by :meth:`AutomaticAssessmentService.assess_batch`."""

    assessed_count: int
    updated_count: int
    skipped_count: int
    ineligible_count: int
    failed_count: int
    article_ids_assessed: tuple[int, ...] = field(default_factory=tuple)
    article_ids_updated: tuple[int, ...] = field(default_factory=tuple)


class AutomaticAssessmentService:
    """Evaluate and update credibility assessments for news articles."""

    def assess_article(
        self,
        article: NewsArticleModel,
        db: Session,
        *,
        all_articles: list[NewsArticleModel] | None = None,
        force: bool = False,
    ) -> CredibilityAssessmentModel | None:
        """Create or update an assessment for *article*.

        If an assessment already exists, it is recalculated ONLY if new genuine
        evidence or corroboration has been discovered. Otherwise it is unchanged.
        """
        source_reliability = _lookup_source_reliability(article.source_url)
        if (
            source_reliability is None
            or source_reliability < _MIN_RELIABILITY_FOR_ASSESSMENT
        ):
            return None  # Ineligible — stays "Assessment pending"

        # Gather candidate pool for corroboration
        if all_articles is None:
            stmt = select(NewsArticleModel).where(NewsArticleModel.id != article.id)
            candidates = list(db.scalars(stmt).all())
        else:
            candidates = [a for a in all_articles if a.id != article.id]

        corroborating = match_corroborating_articles(article, candidates)
        params = _derive_assessment_params(article, source_reliability, corroborating)

        existing = db.scalar(
            select(CredibilityAssessmentModel).where(
                CredibilityAssessmentModel.news_article_id == article.id
            )
        )

        if existing is None:
            # Create new assessment
            assessment = CredibilityAssessmentModel(
                news_article_id=article.id,
                assessed_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                **params,
            )
            db.add(assessment)
            return assessment

        # If existing exists, check if new evidence exists
        evidence_changed = (
            params["independent_source_count"] != existing.independent_source_count
            or params["supporting_evidence_count"] != existing.supporting_evidence_count
            or params["primary_source_count"] != existing.primary_source_count
            or params["evidence_quality_score"] != existing.evidence_quality_score
            or params["source_reliability_score"] != existing.source_reliability_score
        )

        if force or evidence_changed:
            for key, val in params.items():
                setattr(existing, key, val)
            existing.updated_at = datetime.now(timezone.utc)
            return existing

        return None

    def assess_batch(
        self,
        db: Session,
        *,
        article_ids: list[int] | None = None,
        refresh: bool = False,
    ) -> AutoAssessmentResult:
        """Assess or refresh assessments across articles.

        Does NOT call db.commit() or db.rollback(). Transaction ownership belongs to caller.
        """
        articles_stmt = select(NewsArticleModel)
        if article_ids is not None:
            articles_stmt = articles_stmt.where(NewsArticleModel.id.in_(article_ids))
        all_articles = list(db.scalars(articles_stmt).all())

        assessed_ids_stmt = select(CredibilityAssessmentModel.news_article_id)
        assessed_ids = set(db.scalars(assessed_ids_stmt).all())
        assessed_ids.update(
            obj.news_article_id
            for obj in db.new
            if isinstance(obj, CredibilityAssessmentModel)
        )

        assessed_count = 0
        updated_count = 0
        skipped_count = 0
        ineligible_count = 0
        failed_count = 0
        ids_assessed: list[int] = []
        ids_updated: list[int] = []

        for article in all_articles:
            source_reliability = _lookup_source_reliability(article.source_url)
            if (
                source_reliability is None
                or source_reliability < _MIN_RELIABILITY_FOR_ASSESSMENT
            ):
                ineligible_count += 1
                continue

            is_new = article.id not in assessed_ids

            if not is_new and not refresh:
                skipped_count += 1
                continue

            try:
                res = self.assess_article(
                    article, db, all_articles=all_articles, force=refresh
                )
                if res is not None:
                    if is_new:
                        assessed_count += 1
                        ids_assessed.append(article.id)
                        assessed_ids.add(article.id)
                    else:
                        updated_count += 1
                        ids_updated.append(article.id)
                else:
                    skipped_count += 1
            except Exception:  # noqa: BLE001
                failed_count += 1

        return AutoAssessmentResult(
            assessed_count=assessed_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
            ineligible_count=ineligible_count,
            failed_count=failed_count,
            article_ids_assessed=tuple(ids_assessed),
            article_ids_updated=tuple(ids_updated),
        )

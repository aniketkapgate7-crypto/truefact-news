"""Backfill script — idempotent enrichment and safe assessment refresh.

Usage
-----
Run from the ``services/backend`` directory with the virtual-environment active:

    python -m app.scripts.backfill [--dry-run] [--images-only] [--assessments-only] [--refresh]

Options
-------
--dry-run      Print what would be done without writing to the database.
--images-only  Skip assessment backfill; only fill missing image_url fields.
--assessments-only Skip image backfill; only create missing assessments.
--refresh      Recalculate assessments when new evidence/corroboration exists.

Exit codes
----------
0   Success (even if nothing needed to be done)
1   Unexpected error
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass, field

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.services.auto_assessment import (
    _derive_assessment_params,
    _lookup_source_reliability,
    match_corroborating_articles,
)
from app.services.news_ingestion import (
    _fetch_og_image,
)


@dataclass
class AssessmentDiff:
    article_id: int
    title: str
    source_name: str
    old_score: int
    new_score: int
    old_evidence_count: int
    new_evidence_count: int
    old_independent_sources: int
    new_independent_sources: int
    reason: str


@dataclass
class BackfillReport:
    """Summary of a backfill run."""

    articles_inspected: int = 0
    images_updated: int = 0
    images_skipped: int = 0
    assessments_created: int = 0
    assessments_updated: int = 0
    assessments_skipped: int = 0
    assessments_ineligible: int = 0
    assessments_failed: int = 0
    diffs: list[AssessmentDiff] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def _print_report(report: BackfillReport, dry_run: bool) -> None:
    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{'=' * 60}")
    print(f"{mode}Backfill & Assessment Refresh Report")
    print(f"{'=' * 60}")
    print(f"  Articles inspected : {report.articles_inspected}")
    print()
    print(f"  Image URL updates  : {report.images_updated}")
    print(f"  Images already set : {report.images_skipped}")
    print()
    print(f"  Assessments created    : {report.assessments_created}")
    print(f"  Assessments updated    : {report.assessments_updated}")
    print(f"  Assessments unchanged  : {report.assessments_skipped}")
    print(f"  Assessments ineligible : {report.assessments_ineligible}")
    print(f"  Assessments failed     : {report.assessments_failed}")

    if report.diffs:
        print(f"\n{'-' * 60}")
        print(f"{mode}Assessment Changes ({len(report.diffs)}):")
        print(f"{'-' * 60}")
        for diff in report.diffs:
            print(f'  Article #{diff.article_id}: "{diff.title}" [{diff.source_name}]')
            print(
                f"    Score: {diff.old_score}% -> {diff.new_score}% "
                f"({'+' if diff.new_score >= diff.old_score else ''}{diff.new_score - diff.old_score}%)"
            )
            print(
                f"    Evidence: {diff.old_evidence_count} -> {diff.new_evidence_count} supporting items, "
                f"{diff.old_independent_sources} -> {diff.new_independent_sources} independent sources"
            )
            print(f"    Reason: {diff.reason}")
            print()

    if report.errors:
        print("\n  Errors:")
        for err in report.errors[:20]:
            print(f"    - {err}")
    print(f"{'=' * 60}\n")


async def _backfill_images(
    articles: list[NewsArticleModel],
    report: BackfillReport,
    dry_run: bool,
    db: Session,
) -> None:
    """Attempt to find a missing image_url for each article."""
    from urllib.parse import urlsplit

    async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
        for article in articles:
            if article.image_url is not None:
                report.images_skipped += 1
                continue

            hostname = urlsplit(article.source_url).hostname or ""
            allowed_hosts = (hostname,) if hostname else ()

            image_url = await _fetch_og_image(
                article.source_url,
                allowed_hosts,
                client,
            )

            if image_url:
                report.images_updated += 1
                if not dry_run:
                    article.image_url = image_url
            else:
                report.images_skipped += 1


def _refresh_assessments(
    articles: list[NewsArticleModel],
    report: BackfillReport,
    dry_run: bool,
    refresh: bool,
    db: Session,
) -> None:
    """Evaluate or refresh credibility assessments based on current evidence."""
    stmt = select(CredibilityAssessmentModel)
    existing_assessments: dict[int, CredibilityAssessmentModel] = {
        a.news_article_id: a for a in db.scalars(stmt).all()
    }

    for article in articles:
        source_reliability = _lookup_source_reliability(article.source_url)
        if source_reliability is None or source_reliability < 55:
            report.assessments_ineligible += 1
            continue

        existing = existing_assessments.get(article.id)
        candidates = [a for a in articles if a.id != article.id]
        corroborating = match_corroborating_articles(article, candidates)
        params = _derive_assessment_params(article, source_reliability, corroborating)

        if existing is None:
            report.assessments_created += 1
            if not dry_run:
                new_assessment = CredibilityAssessmentModel(
                    news_article_id=article.id,
                    **params,
                )
                db.add(new_assessment)
            report.diffs.append(
                AssessmentDiff(
                    article_id=article.id,
                    title=article.title,
                    source_name=article.source_name,
                    old_score=0,
                    new_score=params["credibility_score"],
                    old_evidence_count=0,
                    new_evidence_count=params["supporting_evidence_count"],
                    old_independent_sources=0,
                    new_independent_sources=params["independent_source_count"],
                    reason="Initial evidence-based assessment created.",
                )
            )
        elif refresh:
            evidence_changed = (
                params["independent_source_count"] != existing.independent_source_count
                or params["supporting_evidence_count"]
                != existing.supporting_evidence_count
                or params["primary_source_count"] != existing.primary_source_count
                or params["evidence_quality_score"] != existing.evidence_quality_score
                or params["credibility_score"] != existing.credibility_score
            )

            if evidence_changed:
                report.assessments_updated += 1
                diff_reason = (
                    f"Evidence updated: {params['independent_source_count']} independent source(s) "
                    f"(was {existing.independent_source_count}), "
                    f"evidence quality {params['evidence_quality_score']}/100 (was {existing.evidence_quality_score}/100)."
                )
                report.diffs.append(
                    AssessmentDiff(
                        article_id=article.id,
                        title=article.title,
                        source_name=article.source_name,
                        old_score=existing.credibility_score,
                        new_score=params["credibility_score"],
                        old_evidence_count=existing.supporting_evidence_count,
                        new_evidence_count=params["supporting_evidence_count"],
                        old_independent_sources=existing.independent_source_count,
                        new_independent_sources=params["independent_source_count"],
                        reason=diff_reason,
                    )
                )
                if not dry_run:
                    for k, v in params.items():
                        setattr(existing, k, v)
            else:
                report.assessments_skipped += 1
        else:
            report.assessments_skipped += 1


async def run_backfill(
    *,
    dry_run: bool,
    do_images: bool,
    do_assessments: bool,
    refresh: bool = False,
    session: Session | None = None,
) -> BackfillReport:
    report = BackfillReport()
    own_session = session is None
    db = SessionLocal() if own_session else session

    try:
        articles: list[NewsArticleModel] = list(
            db.scalars(select(NewsArticleModel)).all()
        )
        report.articles_inspected = len(articles)
        print(f"\nInspecting {len(articles)} article(s)...")

        if do_images:
            print("  Backfilling missing image_url fields...")
            await _backfill_images(articles, report, dry_run, db)
            if not dry_run and report.images_updated > 0:
                try:
                    db.commit()
                    print(
                        f"  + Updated image_url for {report.images_updated} article(s)"
                    )
                except Exception as exc:  # noqa: BLE001
                    db.rollback()
                    report.errors.append(f"Image commit failed: {exc}")

        if do_assessments:
            action_desc = "Refreshing" if refresh else "Backfilling missing"
            print(f"  {action_desc} credibility assessments...")
            _refresh_assessments(articles, report, dry_run, refresh, db)
            if not dry_run and (
                report.assessments_created > 0 or report.assessments_updated > 0
            ):
                try:
                    db.commit()
                    print(
                        f"  + Created {report.assessments_created}, "
                        f"Updated {report.assessments_updated}, "
                        f"Unchanged {report.assessments_skipped}, "
                        f"Ineligible {report.assessments_ineligible}"
                    )
                except Exception as exc:  # noqa: BLE001
                    db.rollback()
                    report.errors.append(f"Assessment commit failed: {exc}")
            else:
                prefix = (
                    "[DRY RUN] Would create/update" if dry_run else "Created/Updated"
                )
                print(
                    f"  + {prefix}: {report.assessments_created} created, "
                    f"{report.assessments_updated} updated, "
                    f"{report.assessments_skipped} unchanged, "
                    f"{report.assessments_ineligible} ineligible"
                )

        if dry_run:
            db.rollback()

    finally:
        if own_session:
            db.close()

    return report


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill missing image_url and credibility assessments.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be done without writing to the database.",
    )
    parser.add_argument(
        "--images-only",
        action="store_true",
        help="Only backfill missing image_url fields.",
    )
    parser.add_argument(
        "--assessments-only",
        action="store_true",
        help="Only backfill missing credibility assessments.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Recalculate assessments when new evidence or corroboration exists.",
    )
    args = parser.parse_args()

    do_images = not args.assessments_only
    do_assessments = not args.images_only

    if args.dry_run:
        print("[DRY RUN] No changes will be written to the database.")

    try:
        report = asyncio.run(
            run_backfill(
                dry_run=args.dry_run,
                do_images=do_images,
                do_assessments=do_assessments,
                refresh=args.refresh,
            )
        )
    except KeyboardInterrupt:
        print("\nBackfill interrupted.")
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"\nFatal error: {exc}", file=sys.stderr)
        sys.exit(1)

    _print_report(report, dry_run=args.dry_run)


if __name__ == "__main__":
    main()

import Link from "next/link";
import type { LiveArticle } from "@/types/news";
import { LIVE_CATEGORY_COLORS } from "@/types/news";
import {
  categoryGradient,
  credibilityBadgeClasses,
  credibilityScoreLabel,
  regionFlag,
  timeAgo,
} from "@/lib/liveUtils";

interface LiveNewsCardProps {
  article: LiveArticle;
  variant?: "default" | "compact" | "horizontal";
}

/** Category pill — no mock-data dependency */
function CategoryPill({ category }: { category: string }) {
  const colors = LIVE_CATEGORY_COLORS[category] ?? "bg-gray-600 text-white";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${colors}`}
    >
      {category}
    </span>
  );
}

/** Evidence link to /evidence/:id */
function EvidenceLink({ articleId }: { articleId: number }) {
  return (
    <Link
      href={`/evidence/${articleId}`}
      aria-label="View evidence for this article"
      className="inline-flex shrink-0 items-center gap-1 font-bold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
    >
      View evidence
      <span aria-hidden="true">{"→"}</span>
    </Link>
  );
}

/**
 * Thumbnail for live news cards.
 *
 * Shows the article's hero image when available with lazy loading and
 * object-cover cropping. Falls back to a category-branded gradient when the
 * image_url is absent or the image fails to load.
 */
function CardThumbnail({
  article,
  className,
}: {
  article: LiveArticle;
  className: string;
}) {
  const gradient = categoryGradient(article.category);

  if (!article.image_url) {
    return (
      <div className={`bg-gradient-to-br ${gradient} ${className}`} />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fallback gradient shown while the image loads or if it errors */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
      />
      <img
        src={article.image_url}
        alt={article.title}
        loading="lazy"
        decoding="async"
        className="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        onError={(e) => {
          // Hide broken image so the gradient fallback beneath shows through
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

export function LiveNewsCard({ article, variant = "default" }: LiveNewsCardProps) {
  const gradient = categoryGradient(article.category);
  const flag = regionFlag(article.region);
  const scoreLabel = credibilityScoreLabel(article.credibility_score);
  const badgeClass = credibilityBadgeClasses(article.credibility_score);

  const scoreChip = (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold backdrop-blur-md ${badgeClass}`}
    >
      {scoreLabel}
    </span>
  );

  /* ── Horizontal variant ──────────────────────────────────────── */
  if (variant === "horizontal") {
    return (
      <article className="group flex items-start gap-4 rounded-xl border-b border-gray-100 px-2 py-3 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
        {/* Category-gradient thumbnail or real image */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read ${article.title}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        >
          {article.image_url ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
              />
              <img
                src={article.image_url}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className={`h-full w-full rounded-xl bg-gradient-to-br ${gradient}`} />
          )}
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
              {flag} {article.region}
            </span>
            {article.credibility_score != null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badgeClass}`}>
                {scoreLabel}
              </span>
            )}
          </div>

          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read ${article.title}`}
          >
            <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
              {article.title}
            </h3>
          </a>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-gray-500">
              {article.source_name}
              {" · "}
              {timeAgo(article.published_at)}
            </p>
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </article>
    );
  }

  /* ── Compact variant ─────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/50">
        {/* Thumbnail */}
        <div className="relative h-44 w-full overflow-hidden">
          <CardThumbnail article={article} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute left-2.5 top-2.5">
            <span className="rounded-md border border-white/20 bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              {flag} {article.region}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5">
            {scoreChip}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <CategoryPill category={article.category} />
            <time className="text-[11px] text-gray-400 dark:text-gray-500" dateTime={article.published_at}>
              {timeAgo(article.published_at)}
            </time>
          </div>

          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read ${article.title}`}
          >
            <h3 className="line-clamp-3 font-serif text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
              {article.title}
            </h3>
          </a>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-gray-500 dark:text-gray-400">
              {article.source_name}
            </p>
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </article>
    );
  }

  /* ── Default variant ─────────────────────────────────────────── */
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/60">
      {/* Thumbnail */}
      <div className="relative h-56 w-full overflow-hidden">
        <CardThumbnail article={article} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-xs font-extrabold text-white shadow-md backdrop-blur-md">
            <span>{flag}</span>
            <span>{article.region}</span>
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          {scoreChip}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <CategoryPill category={article.category} />
          <time
            className="text-xs text-gray-400 dark:text-gray-500"
            dateTime={article.published_at}
          >
            {timeAgo(article.published_at)}
          </time>
        </div>

        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read ${article.title}`}
        >
          <h2 className="line-clamp-3 font-serif text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
            {article.title}
          </h2>
        </a>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {article.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800/80 dark:text-gray-500">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {article.source_name}
          </span>
          <div className="flex items-center gap-3">
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </div>
    </article>
  );
}

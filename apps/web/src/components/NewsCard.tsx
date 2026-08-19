import Link from "next/link";

import { CategoryPill, CredibilityBadge } from "./CredibilityBadge";
import { type NewsArticle, timeAgo } from "@/data/mockNews";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "compact" | "horizontal";
}

function EvidenceLink({
  articleId,
}: {
  articleId: number;
}) {
  return (
    <Link
      href={`/evidence/${articleId}`}
      className="inline-flex shrink-0 items-center gap-1 font-bold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
    >
      View evidence
      <span aria-hidden="true">{"\u2192"}</span>
    </Link>
  );
}

export function NewsCard({
  article,
  variant = "default",
}: NewsCardProps) {
  const truthScore =
    article.truthAnalysis?.truthScore ?? article.credibilityScore;
  const flag = article.countryFlag ?? "\u{1F310}";
  const regionName = article.region ?? "Global";

  if (variant === "horizontal") {
    return (
      <article className="group flex items-start gap-4 rounded-xl border-b border-gray-100 px-2 py-3 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
        <Link
          href={`/article/${article.id}`}
          aria-label={`Read ${article.headline}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200/50 bg-gray-900 dark:border-gray-800"
        >
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${article.imageBg}`}
            />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
              {flag} {regionName}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {truthScore}% Truth
            </span>
          </div>

          <Link href={`/article/${article.id}`}>
            <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
              {article.headline}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-gray-500">
              {article.source}
              {" \u00B7 "}
              {timeAgo(article.publishedAt)}
            </p>
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/50">
        <div className="relative h-44 w-full overflow-hidden bg-gray-900">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${article.imageBg}`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute left-2.5 top-2.5">
            <span className="rounded-md border border-white/20 bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              {flag} {regionName}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5">
            <span className="rounded-full border border-emerald-500/40 bg-black/80 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 backdrop-blur-md">
              Truth {truthScore}%
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <CategoryPill category={article.category} />
            <time className="text-[11px] text-gray-400 dark:text-gray-500">
              {timeAgo(article.publishedAt)}
            </time>
          </div>

          <Link href={`/article/${article.id}`}>
            <h3 className="line-clamp-3 font-serif text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
              {article.headline}
            </h3>
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-gray-500 dark:text-gray-400">
              {article.source}
              {" \u00B7 "}
              {article.readTime} min read
            </p>
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/60">
      <div className="relative h-56 w-full overflow-hidden bg-gray-900">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${article.imageBg}`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-xs font-extrabold text-white shadow-md backdrop-blur-md">
            <span>{flag}</span>
            <span>{regionName}</span>
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <CredibilityBadge score={article.credibilityScore} />
          <span className="rounded-full border border-emerald-500/40 bg-black/80 px-2.5 py-1 text-xs font-extrabold text-emerald-400 shadow-md backdrop-blur-md">
            Truthiness {truthScore}%
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <CategoryPill category={article.category} />
          <time
            className="text-xs text-gray-400 dark:text-gray-500"
            dateTime={article.publishedAt}
          >
            {timeAgo(article.publishedAt)}
          </time>
        </div>

        <Link href={`/article/${article.id}`}>
          <h2 className="line-clamp-3 font-serif text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
            {article.headline}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {article.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800/80 dark:text-gray-500">
          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {article.author}
            </span>
            {" \u00B7 "}
            {article.source}
          </span>

          <div className="flex items-center gap-3">
            <span>{article.readTime} min read</span>
            <EvidenceLink articleId={article.id} />
          </div>
        </div>
      </div>
    </article>
  );
}

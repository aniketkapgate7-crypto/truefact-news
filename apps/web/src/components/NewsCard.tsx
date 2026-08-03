import Link from "next/link";
import { CategoryPill, CredibilityBadge } from "./CredibilityBadge";
import { type NewsArticle, timeAgo } from "@/data/mockNews";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "compact" | "horizontal";
}

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const truthScore = article.truthAnalysis?.truthScore ?? article.credibilityScore;
  const flag = article.countryFlag ?? "🌐";
  const regionName = article.region ?? "Global";

  if (variant === "horizontal") {
    return (
      <Link
        href={`/article/${article.id}`}
        className="group flex gap-4 items-start py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl px-2 -mx-2 transition-colors"
      >
        {/* Thumbnail */}
        <div className="shrink-0 h-16 w-16 rounded-xl bg-gray-900 overflow-hidden relative border border-gray-200/50 dark:border-gray-800">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${article.imageBg}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CategoryPill category={article.category} />
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
              {flag} {regionName}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {truthScore}% Truth
            </span>
          </div>
          <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {article.headline}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
            {article.source} · {timeAgo(article.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-0.5 transition-all duration-200">
        {/* Image */}
        <div className="relative h-44 w-full bg-gray-900 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${article.imageBg}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/75 text-white backdrop-blur-sm border border-white/20">
              {flag} {regionName}
            </span>
          </div>
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/80 text-emerald-400 backdrop-blur-md border border-emerald-500/40">
              Truth {truthScore}%
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <CategoryPill category={article.category} />
            <time className="text-[11px] text-gray-400 dark:text-gray-500">
              {timeAgo(article.publishedAt)}
            </time>
          </div>
          <Link href={`/article/${article.id}`}>
            <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white leading-snug line-clamp-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {article.headline}
            </h3>
          </Link>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {article.source} · {article.readTime} min read
          </p>
        </div>
      </article>
    );
  }

  // Default variant — medium card
  return (
    <article className="group overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-gray-900/60 hover:-translate-y-1 transition-all duration-200">
      {/* Image container */}
      <div className="relative h-56 w-full bg-gray-900 overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${article.imageBg}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1.5">
            <span>{flag}</span>
            <span>{regionName}</span>
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <CredibilityBadge score={article.credibilityScore} />
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-black/80 text-emerald-400 backdrop-blur-md border border-emerald-500/40 shadow-md">
            Truthiness {truthScore}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <CategoryPill category={article.category} />
          <time className="text-xs text-gray-400 dark:text-gray-500" dateTime={article.publishedAt}>
            {timeAgo(article.publishedAt)}
          </time>
        </div>

        <Link href={`/article/${article.id}`}>
          <h2 className="font-serif font-bold text-lg text-gray-900 dark:text-white leading-snug line-clamp-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {article.headline}
          </h2>
        </Link>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {article.summary}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800/80">
          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{article.author}</span>
            {" · "}{article.source}
          </span>
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}

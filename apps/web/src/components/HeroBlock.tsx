import Link from "next/link";
import { CategoryPill, CredibilityBadge } from "./CredibilityBadge";
import { type NewsArticle, timeAgo } from "@/data/mockNews";

interface HeroBlockProps {
  article: NewsArticle;
}

export function HeroBlock({ article }: HeroBlockProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-none sm:rounded-2xl bg-gray-950 min-h-[420px] sm:min-h-[520px] lg:min-h-[580px] shadow-2xl group">
      {/* Editorial News Photography */}
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.headline}
          className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${article.imageBg}`} />
      )}

      {/* Dark vignette gradient overlay for high contrast text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />

      {/* Content — Z-shaped visual hierarchy: content pinned to bottom-left */}
      <div className="relative flex h-full min-h-[420px] sm:min-h-[520px] lg:min-h-[580px] flex-col justify-end p-6 sm:p-8 lg:p-10 z-10">
        {/* Top-right live badge */}
        <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-red-600/30 border border-red-500/50 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-200">
            Live Coverage
          </span>
        </div>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CategoryPill category={article.category} size="md" />
          <CredibilityBadge score={article.credibilityScore} size="md" />
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm">
            Truth {article.truthAnalysis.truthScore}%
          </span>
        </div>

        {/* Headline */}
        <Link href={`/article/${article.id}`} className="group/title block">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight max-w-4xl group-hover/title:text-red-300 transition-colors">
            {article.headline}
          </h1>
        </Link>

        {/* Summary */}
        <p className="mt-4 text-base sm:text-lg text-gray-200 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-3 font-sans drop-shadow">
          {article.summary}
        </p>

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-white">{article.author}</span>
          </span>
          <span>·</span>
          <span>{article.source}</span>
          <span>·</span>
          <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
          <span>·</span>
          <span>{article.readTime} min read</span>

          <Link
            href={`/article/${article.id}`}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-lg group/btn"
          >
            Read story
            <svg
              className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

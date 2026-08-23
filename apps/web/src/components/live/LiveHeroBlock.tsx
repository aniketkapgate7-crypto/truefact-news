import Link from "next/link";
import type { LiveArticle } from "@/types/news";
import { LIVE_CATEGORY_COLORS } from "@/types/news";
import {
  categoryGradient,
  evidenceScoreLabel,
  regionFlag,
  sourceInitials,
  timeAgo,
} from "@/lib/liveUtils";

interface LiveHeroBlockProps {
  article: LiveArticle;
}

export function LiveHeroBlock({ article }: LiveHeroBlockProps) {
  const gradient = categoryGradient(article.category);
  const initials = sourceInitials(article.source_name);
  const scoreLabel = evidenceScoreLabel(article.evidence_score);
  const flag = regionFlag(article.region);
  const catColors = LIVE_CATEGORY_COLORS[article.category] ?? "bg-gray-600 text-white";
  const isPending = !article.evidence_score || article.evidence_score <= 0;

  return (
    <section
      aria-label="Hero story"
      className={`relative w-full overflow-hidden rounded-none sm:rounded-2xl bg-gradient-to-br ${gradient} min-h-[420px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col justify-end`}
    >
      {/* Ambient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Source initials visual accent — top right */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-64 h-64 opacity-10 flex items-center justify-center select-none pointer-events-none"
      >
        <span className="text-[9rem] font-black text-white leading-none">
          {initials}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${catColors}`}
          >
            {article.category}
          </span>
          <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            {flag} {article.region}
          </span>
          {article.category === "Breaking" && (
            <span className="flex items-center gap-1 rounded-full bg-red-600/30 border border-red-500/50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              Breaking
            </span>
          )}
        </div>

        {/* Headline — links to source */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read full story: ${article.title}`}
          className="block"
        >
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight max-w-4xl hover:text-red-300 transition-colors">
            {article.title}
          </h1>
        </a>

        {/* Summary */}
        <p className="text-gray-200 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-3 font-sans text-sm sm:text-base">
          {article.summary}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-white">{article.source_name}</span>
          </span>
          <span>·</span>
          <time dateTime={article.published_at}>
            {timeAgo(article.published_at)}
          </time>
          <span>·</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
              isPending
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            }`}
          >
            {scoreLabel}
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read original article from ${article.source_name}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-lg group/btn"
          >
            Read original
            <svg
              className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <Link
            href={`/evidence/${article.id}`}
            aria-label={`View evidence for: ${article.title}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            View evidence →
          </Link>
        </div>
      </div>
    </section>
  );
}

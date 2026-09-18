"use client";

import Link from "next/link";
import { getCredibilityTier } from "@/lib/credibilityTokens";
import type { LiveArticle } from "@/types/news";

interface IntelligenceStoryCardProps {
  article: LiveArticle;
  isSelected: boolean;
  onSelect: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
}

function formatTimeAgo(dateString: string): string {
  try {
    const published = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - published.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recent";
  }
}

export function IntelligenceStoryCard({
  article,
  isSelected,
  onSelect,
  isSaved = false,
  onToggleSave,
}: IntelligenceStoryCardProps) {
  const tier = getCredibilityTier(article.credibility_score);
  const timeAgo = formatTimeAgo(article.published_at);

  return (
    <article
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex flex-col sm:flex-row items-stretch gap-3.5 rounded-xl border p-3.5 transition-colors cursor-pointer select-none text-left ${
        isSelected
          ? "border-[#38BDF8] bg-[#112337]"
          : "border-[#1E334A] bg-[#0D1B2A] hover:border-[#2D4A6B] hover:bg-[#0D1B2A]/90"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full sm:w-32 h-28 sm:h-auto flex-shrink-0 overflow-hidden rounded-lg bg-[#07111F] border border-[#1E334A]/80">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#091625] p-2 text-center">
            <span className="text-base opacity-40">📰</span>
            <span className="mt-1 font-mono text-[9px] font-medium uppercase tracking-wider text-[#506176]">
              {article.source_name || "TrueFact"}
            </span>
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute top-1.5 left-1.5 rounded bg-[#07111F]/90 border border-[#1E334A] px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-[#E8EEF8]">
          {article.category}
        </div>
      </div>

      {/* Main Story Content */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          {/* Metadata Header Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-[#38BDF8] truncate max-w-[130px]">
                {article.source_name}
              </span>
              <span className="text-[#506176]">·</span>
              <span className="font-mono text-[10px] text-[#8191A8]">
                {timeAgo}
              </span>
              {article.region && article.region !== "Global" && (
                <>
                  <span className="text-[#506176]">·</span>
                  <span className="text-[10px] text-[#8191A8]">
                    {article.region}
                  </span>
                </>
              )}
            </div>

            {/* Credibility Score Badge */}
            <div
              className={`flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-mono font-semibold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tier.dotColor}`} />
              {typeof article.credibility_score === "number" && article.credibility_score > 0
                ? `${Math.round(article.credibility_score)}% ${tier.badgeLabel}`
                : "Pending"}
            </div>
          </div>

          {/* Headline */}
          <h3 className="mt-1 font-sans text-[15px] font-semibold leading-snug text-[#E8EEF8] group-hover:text-white transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="mt-1 text-[13px] leading-relaxed text-[#8191A8] line-clamp-2">
            {article.summary}
          </p>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-2.5 flex items-center justify-between border-t border-[#1E334A]/60 pt-2 text-xs text-[#8191A8]">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#506176]">
            {article.evidence_score && article.evidence_score > 0 ? (
              <span>Evidence score: {article.evidence_score}</span>
            ) : null}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Save Button */}
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(article.id)}
                title={isSaved ? "Remove from saved" : "Save story"}
                className={`p-1 rounded transition-colors ${
                  isSaved
                    ? "text-[#38BDF8]"
                    : "text-[#506176] hover:text-[#8191A8]"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}

            {/* Read Original */}
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Read original source"
                className="flex items-center gap-1 rounded border border-[#1E334A] bg-[#07111F] px-2 py-0.5 text-[10px] font-medium text-[#8191A8] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors"
              >
                <span>Source</span>
                <span className="text-[9px]">↗</span>
              </a>
            )}

            {/* View Evidence */}
            <Link
              href={`/evidence/${article.id}`}
              title="Inspect evidence dossier"
              className="flex items-center gap-1 rounded border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2 py-0.5 text-[10px] font-semibold text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-colors"
            >
              <span>Evidence</span>
              <span className="text-[9px]">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

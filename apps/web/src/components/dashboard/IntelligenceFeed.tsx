"use client";

import { useMemo } from "react";
import { IntelligenceStoryCard } from "./IntelligenceStoryCard";
import type { LiveArticle, LiveRegion } from "@/types/news";
import { LIVE_REGION_LIST } from "@/types/news";

export type FeedFilterMode = "all" | "high_credibility" | "developing" | "needs_review" | "pending";

const FEED_MODES: { id: FeedFilterMode; label: string }[] = [
  { id: "all", label: "All Stories" },
  { id: "high_credibility", label: "High Confidence (80%+)" },
  { id: "needs_review", label: "Needs Review" },
  { id: "pending", label: "Pending" },
];

const CATEGORIES = [
  "All",
  "Breaking",
  "Politics",
  "World",
  "Business",
  "Tech",
  "Science",
  "Sports",
  "Entertainment",
  "Lifestyle",
];

interface IntelligenceFeedProps {
  articles: LiveArticle[];
  selectedArticleId: number | null;
  onSelectArticle: (article: LiveArticle) => void;
  feedMode: FeedFilterMode;
  onSelectFeedMode: (mode: FeedFilterMode) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedRegion: LiveRegion | "All";
  onSelectRegion: (reg: LiveRegion | "All") => void;
  savedArticleIds: Set<number>;
  onToggleSave: (id: number) => void;
}

export function IntelligenceFeed({
  articles,
  selectedArticleId,
  onSelectArticle,
  feedMode,
  onSelectFeedMode,
  selectedCategory,
  onSelectCategory,
  selectedRegion,
  onSelectRegion,
  savedArticleIds,
  onToggleSave,
}: IntelligenceFeedProps) {
  // Region & Mode filtering
  const filteredArticles = useMemo(() => {
    let list = articles;

    // Region filter
    if (selectedRegion !== "All") {
      list = list.filter(
        (a) => a.region.toLowerCase() === selectedRegion.toLowerCase()
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter(
        (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Feed Mode filter
    switch (feedMode) {
      case "high_credibility":
        list = list.filter(
          (a) => typeof a.credibility_score === "number" && a.credibility_score >= 80
        );
        break;
      case "needs_review":
        list = list.filter(
          (a) =>
            typeof a.credibility_score === "number" &&
            a.credibility_score >= 40 &&
            a.credibility_score < 60
        );
        break;
      case "pending":
        list = list.filter(
          (a) => a.credibility_score === null || a.credibility_score === undefined || a.credibility_score === 0
        );
        break;
      case "developing":
      case "all":
      default:
        break;
    }

    return list;
  }, [articles, selectedRegion, selectedCategory, feedMode]);

  return (
    <div className="space-y-3.5">
      {/* Filter Control Header */}
      <div className="rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-3 space-y-2.5">
        {/* Feed Mode Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FEED_MODES.map((mode) => {
            const isActive = feedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectFeedMode(mode.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#38BDF8] text-[#07111F]"
                    : "bg-[#112337] text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#1E334A]"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Category & Region Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E334A]/60 pt-2">
          {/* Category Dropdown/Pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30"
                    : "text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#112337]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Region Dropdown Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-[#506176]">
              Region:
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => onSelectRegion(e.target.value as LiveRegion | "All")}
              className="rounded border border-[#1E334A] bg-[#112337] px-2 py-0.5 text-xs text-[#E8EEF8] outline-none hover:border-[#38BDF8] transition-colors"
            >
              {LIVE_REGION_LIST.map((r) => (
                <option key={r.id} value={r.code} className="bg-[#091625] text-[#E8EEF8]">
                  {r.flag} {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feed List Subheader */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-[#8191A8]">
          Stories ({filteredArticles.length})
        </h2>
        <span className="text-[10px] font-mono text-[#506176]">
          Real-time Ingestion
        </span>
      </div>

      {/* Story Cards List */}
      {filteredArticles.length > 0 ? (
        <div className="space-y-2.5">
          {filteredArticles.map((article) => (
            <IntelligenceStoryCard
              key={article.id}
              article={article}
              isSelected={selectedArticleId === article.id}
              onSelect={() => onSelectArticle(article)}
              isSaved={savedArticleIds.has(article.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-8 text-center">
          <span className="text-2xl opacity-60">📡</span>
          <h4 className="mt-2 text-sm font-semibold text-[#E8EEF8]">
            No matching stories found
          </h4>
          <p className="mt-1 text-xs text-[#8191A8] max-w-sm mx-auto">
            Try adjusting your region filter, category, or search keywords to view available live intelligence records.
          </p>
        </div>
      )}
    </div>
  );
}

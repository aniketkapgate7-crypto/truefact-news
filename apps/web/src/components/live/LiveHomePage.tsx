"use client";

import { useEffect, useMemo, useState } from "react";
import { IntelligenceSidebar, type NavSection } from "@/components/dashboard/IntelligenceSidebar";
import { CommandBar } from "@/components/dashboard/CommandBar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IntelligenceFeed, type FeedFilterMode } from "@/components/dashboard/IntelligenceFeed";
import { StoryIntelligencePanel } from "@/components/dashboard/StoryIntelligencePanel";
import { useNewsContext } from "@/context/NewsContext";
import type { LiveArticle } from "@/types/news";

interface LiveHomePageProps {
  articles: LiveArticle[];
}

export function LiveHomePage({ articles }: LiveHomePageProps) {
  const { selectedRegion, setSelectedRegion, setActiveArticle } = useNewsContext();

  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMode, setFeedMode] = useState<FeedFilterMode>("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tf-saved-stories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedArticleIds(new Set(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSave = (id: number) => {
    setSavedArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("tf-saved-stories", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // 1. Filter out invalid/fixture items like id=1 "string"
  const validArticles = useMemo<LiveArticle[]>(() => {
    return articles.filter(
      (a) =>
        a.id !== 1 &&
        a.title.trim().toLowerCase() !== "string" &&
        !a.source_url.includes("example.com")
    );
  }, [articles]);

  // 2. Real Derived Metrics (strictly from API records)
  const totalLiveArticles = validArticles.length;
  const highConfidenceCount = useMemo(() => {
    return validArticles.filter(
      (a) => typeof a.credibility_score === "number" && a.credibility_score >= 80
    ).length;
  }, [validArticles]);

  const needsReviewCount = useMemo(() => {
    return validArticles.filter(
      (a) =>
        typeof a.credibility_score === "number" &&
        a.credibility_score >= 40 &&
        a.credibility_score < 60
    ).length;
  }, [validArticles]);

  const activeSourcesCount = useMemo(() => {
    const uniqueSources = new Set(
      validArticles.map((a) => a.source_name).filter(Boolean)
    );
    return uniqueSources.size;
  }, [validArticles]);

  // 3. Search Filtering
  const searchedArticles = useMemo(() => {
    if (!searchQuery.trim()) return validArticles;
    const q = searchQuery.toLowerCase().trim();
    return validArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source_name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [validArticles, searchQuery]);

  // 4. Saved Section Articles
  const displayedArticles = useMemo(() => {
    if (activeSection === "saved") {
      return searchedArticles.filter((a) => savedArticleIds.has(a.id));
    }
    return searchedArticles;
  }, [searchedArticles, activeSection, savedArticleIds]);

  // 5. Default Selected Article (prefers highest assessed story)
  useEffect(() => {
    if (displayedArticles.length > 0 && selectedArticleId === null) {
      const best =
        displayedArticles.find(
          (a) => typeof a.credibility_score === "number" && a.credibility_score >= 80
        ) || displayedArticles[0];
      if (best) {
        setSelectedArticleId(best.id);
        setActiveArticle(best);
      }
    }
  }, [displayedArticles, selectedArticleId, setActiveArticle]);

  const selectedArticle = useMemo(() => {
    return (
      validArticles.find((a) => a.id === selectedArticleId) ||
      displayedArticles[0] ||
      null
    );
  }, [validArticles, displayedArticles, selectedArticleId]);

  const handleSelectStory = (article: LiveArticle) => {
    setSelectedArticleId(article.id);
    setActiveArticle(article);
  };

  const getBreadcrumbTitle = () => {
    switch (activeSection) {
      case "feed":
        return "Live Feed";
      case "saved":
        return "Saved Stories";
      case "watchlist":
        return "Review Watchlist";
      case "sources":
        return "Source Monitor";
      case "settings":
        return "Settings";
      case "overview":
      default:
        return "Intelligence Overview";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07111F] text-[#E8EEF8]">
      {/* Left Intelligence Sidebar */}
      <div className="hidden lg:block">
        <IntelligenceSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
          savedCount={savedArticleIds.size}
          totalArticlesCount={totalLiveArticles}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Command Bar */}
        <CommandBar
          breadcrumbSection={getBreadcrumbTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          userInitials="TF"
        />

        {/* Workspace Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Intelligence Overview Metrics Strip */}
          <section aria-label="Intelligence Metrics Overview">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <MetricCard
                label="Live Articles"
                value={totalLiveArticles}
                subtext="Verified stories in active feed"
                icon="📰"
                accentColor="#38BDF8"
                trend="Live"
              />
              <MetricCard
                label="High Confidence"
                value={highConfidenceCount}
                subtext="Scoring 80%+ cross-verified"
                icon="🛡️"
                accentColor="#2DD4BF"
                trend={
                  totalLiveArticles > 0
                    ? `${Math.round((highConfidenceCount / totalLiveArticles) * 100)}%`
                    : undefined
                }
              />
              <MetricCard
                label="Needs Review"
                value={needsReviewCount}
                subtext="Score 40–59% / uncorroborated"
                icon="⚠️"
                accentColor="#F59E0B"
              />
              <MetricCard
                label="Active Sources"
                value={activeSourcesCount}
                subtext="Independent publisher domains"
                icon="🌐"
                accentColor="#818CF8"
              />
            </div>
          </section>

          {/* Main Two-Column Intelligence Workspace */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left ~65% Feed Column */}
            <div className="lg:col-span-7 xl:col-span-8">
              <IntelligenceFeed
                articles={displayedArticles}
                selectedArticleId={selectedArticleId}
                onSelectArticle={handleSelectStory}
                feedMode={feedMode}
                onSelectFeedMode={setFeedMode}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                savedArticleIds={savedArticleIds}
                onToggleSave={handleToggleSave}
              />
            </div>

            {/* Right ~35% Story Intelligence Panel */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              <StoryIntelligencePanel
                article={selectedArticle}
                isSaved={selectedArticle ? savedArticleIds.has(selectedArticle.id) : false}
                onToggleSave={handleToggleSave}
              />
            </div>
          </section>
        </main>

        {/* Minimal Intelligence Dashboard Footer */}
        <footer className="border-t border-[#1E334A] bg-[#091625] px-6 py-4 text-center text-xs text-[#506176] flex flex-wrap items-center justify-between gap-2">
          <span>
            © 2026 TrueFact News · Multi-Source AI Fact Checking &amp; Ingestion Active
          </span>
          <span className="font-mono text-[11px] text-[#8191A8]">
            Evidence before engagement
          </span>
        </footer>
      </div>
    </div>
  );
}

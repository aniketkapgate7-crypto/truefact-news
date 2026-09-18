"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/components/auth/AuthContext";
import { IntelligenceSidebar, type NavSection } from "@/components/dashboard/IntelligenceSidebar";
import { CommandBar } from "@/components/dashboard/CommandBar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IntelligenceFeed, type FeedFilterMode } from "@/components/dashboard/IntelligenceFeed";
import { StoryIntelligencePanel } from "@/components/dashboard/StoryIntelligencePanel";
import { useNewsContext } from "@/context/NewsContext";
import { getSavedStories, saveStoryApi, removeSavedStoryApi } from "@/lib/api";
import type { LiveArticle } from "@/types/news";

interface LiveHomePageProps {
  articles: LiveArticle[];
}

export function LiveHomePage({ articles }: LiveHomePageProps) {
  const { selectedRegion, setSelectedRegion, setActiveArticle } = useNewsContext();
  const { isSignedIn, getToken, isAuthEnabled } = useAppAuth();

  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMode, setFeedMode] = useState<FeedFilterMode>("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<number>>(new Set());
  const [pendingSaveIds, setPendingSaveIds] = useState<Set<number>>(new Set());
  const [saveNotification, setSaveNotification] = useState<{
    type: "error" | "info";
    message: string;
    showSignIn?: boolean;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load saved stories exclusively from backend API when authenticated
  useEffect(() => {
    if (!isSignedIn) {
      setSavedArticleIds(new Set());
      return;
    }

    let isMounted = true;
    getToken()
      .then((token) => {
        if (!token || !isMounted) return null;
        return getSavedStories(token, 100, 0);
      })
      .then((res) => {
        if (!isMounted || !res) return;
        const ids = new Set(res.items.map((item) => item.article_id));
        setSavedArticleIds(ids);
      })
      .catch((err) => {
        console.error("Failed to load saved stories from backend:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken]);

  const handleToggleSave = async (id: number) => {
    if (!isAuthEnabled) {
      setSaveNotification({
        type: "info",
        message: "Saved stories are unavailable: authentication is not configured in this environment.",
        showSignIn: false,
      });
      return;
    }

    if (!isSignedIn) {
      setSaveNotification({
        type: "info",
        message: "Sign in to save stories to your personal reading list.",
        showSignIn: true,
      });
      return;
    }

    if (pendingSaveIds.has(id)) {
      return;
    }

    setPendingSaveIds((prev) => new Set(prev).add(id));
    setSaveNotification(null);

    const isCurrentlySaved = savedArticleIds.has(id);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication session expired. Please sign in again.");
      }

      if (isCurrentlySaved) {
        await removeSavedStoryApi(token, id);
        setSavedArticleIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setSaveNotification({
          type: "info",
          message: "Story removed from your saved list.",
          showSignIn: false,
        });
      } else {
        await saveStoryApi(token, id);
        setSavedArticleIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        setSaveNotification({
          type: "info",
          message: "Story saved to your personal reading list.",
          showSignIn: false,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update saved story.";
      setSaveNotification({
        type: "error",
        message: msg,
        showSignIn: false,
      });
    } finally {
      setPendingSaveIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // Render full API response honestly without client-side fixture hiding
  const validArticles = articles;

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
          {saveNotification && (
            <div
              role="status"
              className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between gap-3 shadow-md transition-all ${
                saveNotification.type === "error"
                  ? "border-red-900/60 bg-red-950/50 text-red-200"
                  : "border-[#1E334A] bg-[#112337] text-[#E8EEF8]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{saveNotification.type === "error" ? "⚠️" : "🔖"}</span>
                <span>{saveNotification.message}</span>
                {saveNotification.showSignIn && (
                  <Link
                    href="/sign-in?redirect_url=/"
                    className="font-bold underline text-[#38BDF8] ml-1 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSaveNotification(null)}
                className="text-[#8191A8] hover:text-white font-mono text-xs px-1"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )}

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

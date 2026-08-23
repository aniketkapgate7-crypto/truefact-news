"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { StickyHeader } from "@/components/StickyHeader";
import { BulletTicker } from "@/components/BulletTicker";
import { RegionFilterBar } from "@/components/RegionFilterBar";
import { OfficialPortals } from "@/components/OfficialPortals";
import { LiveHeroBlock } from "@/components/live/LiveHeroBlock";
import { LiveNewsCard } from "@/components/live/LiveNewsCard";
import { LiveCategorySection } from "@/components/live/LiveCategorySection";
import { useNewsContext } from "@/context/NewsContext";
import type { LiveArticle, LiveCategory, LiveRegion } from "@/types/news";
import { categoryDotColor } from "@/lib/liveUtils";

interface LiveHomePageProps {
  articles: LiveArticle[];
}

/** Category display titles */
const CATEGORY_TITLES: Partial<Record<LiveCategory, string>> = {
  Breaking:      "Breaking News",
  Politics:      "Politics",
  World:         "World News",
  Business:      "Business & Markets",
  Tech:          "Tech & AI",
  Science:       "Science & Health",
  Sports:        "Sports",
  Entertainment: "Entertainment",
  Lifestyle:     "Lifestyle",
};

/** Order in which category sections appear */
const CATEGORY_ORDER: LiveCategory[] = [
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

export function LiveHomePage({ articles }: LiveHomePageProps) {
  const { selectedRegion, setSelectedRegion, setActiveArticle } = useNewsContext();

  // Clear any article reading context when user is on the homepage
  useEffect(() => {
    setActiveArticle(null);
  }, [setActiveArticle]);

  /* ── Region filtering ─────────────────────────────────────────── */
  const filteredArticles = useMemo<LiveArticle[]>(() => {
    if (selectedRegion === "All") return articles;
    const region = selectedRegion as LiveRegion;
    const exact = articles.filter(
      (a) => a.region.toLowerCase() === region.toLowerCase(),
    );
    return exact;
  }, [articles, selectedRegion]);

  /* ── Hero — newest article in filtered set ─────────────────────── */
  const heroArticle = filteredArticles[0] ?? articles[0];

  /* ── Secondary grid (next 3, excluding hero) ────────────────────── */
  const secondaryArticles = useMemo(
    () => filteredArticles.filter((a) => a.id !== heroArticle?.id).slice(0, 3),
    [filteredArticles, heroArticle],
  );

  /* ── Ticker items from live article titles ──────────────────────── */
  const tickerItems = useMemo(
    () =>
      articles.slice(0, 12).map((a) => ({
        id: a.id,
        text: a.title,
        category: a.category,
      })),
    [articles],
  );

  /* ── Category sections — only categories present in filtered feed ── */
  const categorySections = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      title: CATEGORY_TITLES[cat] ?? cat,
      items: filteredArticles.filter((a) => a.category === cat).slice(0, 6),
    })).filter((s) => s.items.length > 0);
  }, [filteredArticles]);

  /* ── Rapid updates strip — up to 8 articles ─────────────────────── */
  const rapidItems = useMemo(
    () => filteredArticles.slice(0, 8),
    [filteredArticles],
  );

  /* ── Empty state ─────────────────────────────────────────────────── */
  const isEmpty = filteredArticles.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5] dark:bg-[#0d1117]">
      <StickyHeader />

      {/* ── Live Ticker ──────────────────────────────────────────── */}
      {tickerItems.length > 0 && <BulletTicker items={tickerItems} />}

      <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 space-y-10">
        {/* ── Region / Country Filter Bar ───────────────────────── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-2">
          <RegionFilterBar
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
          {selectedRegion !== "All" && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
              <span>
                Active Country Filter:{" "}
                <strong className="text-red-600 dark:text-red-400">
                  {selectedRegion}
                </strong>
              </span>
              <button
                onClick={() => setSelectedRegion("All")}
                className="text-xs font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
              >
                Clear Filter (Show All)
              </button>
            </div>
          )}
        </div>

        {/* ── Empty state ──────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center space-y-4">
            <p className="text-4xl">🌐</p>
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
              No stories found for{" "}
              <span className="text-red-600">{selectedRegion}</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              There are no live articles matching this region right now. Try a
              different region or view all stories.
            </p>
            <button
              onClick={() => setSelectedRegion("All")}
              className="mt-2 px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Show all stories
            </button>
          </div>
        ) : (
          <>
            {/* ── Hero Block ─────────────────────────────────────── */}
            {heroArticle && <LiveHeroBlock article={heroArticle} />}

            {/* ── Secondary Grid ─────────────────────────────────── */}
            {secondaryArticles.length > 0 && (
              <section aria-label="Top stories">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-red-600" />
                    <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                      Top Stories{" "}
                      {selectedRegion !== "All" && `(${selectedRegion})`}
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400">
                    Showing {secondaryArticles.length} stories
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {secondaryArticles.map((article) => (
                    <LiveNewsCard
                      key={article.id}
                      article={article}
                      variant="default"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Verification CTA Banner ────────────────────────── */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-red-400">
                    TrueFact Verification Engine
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  Dual-Screen Fact Checking &amp; Live Stream Verification
                </h3>
                <p className="text-sm text-gray-300 max-w-xl">
                  Cross-check any article claim in real-time across Snopes, Boom
                  Live, Alt News, PolitiFact, and official government registries.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/fact-check"
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md"
                >
                  Open Dual-Screen Checker →
                </Link>
                <Link
                  href="/live"
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all"
                >
                  Watch Live Streams 🔴
                </Link>
              </div>
            </div>

            {/* ── Category Sections ──────────────────────────────── */}
            {categorySections.map(({ category, title, items }) => (
              <LiveCategorySection
                key={category}
                title={title}
                articles={items}
              />
            ))}

            {/* ── Official Portals ───────────────────────────────── */}
            <OfficialPortals />

            {/* ── Rapid Updates strip ────────────────────────────── */}
            {rapidItems.length > 0 && (
              <section aria-label="Rapid updates">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-5 w-1 rounded-full bg-red-600" />
                  <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                    Rapid Updates
                  </h2>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {rapidItems.map((article) => (
                    <a
                      key={article.id}
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read: ${article.title}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${categoryDotColor(article.category)} ${
                          article.category === "Breaking" ? "animate-pulse" : ""
                        }`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-1 flex-1">
                        {article.title}
                      </span>
                      <span
                        className={`ml-auto shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          article.category === "Breaking"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {article.category}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <span className="font-serif text-2xl font-black text-gray-950 dark:text-white">
                TRUE<span className="text-red-600">FACT</span>
              </span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Real-time news ranked by evidence score and multi-source
                corroboration. Country-filtered journalism you can verify.
              </p>
            </div>
            {[
              {
                title: "Categories",
                links: [
                  "Politics",
                  "World",
                  "Business",
                  "Tech",
                  "Science",
                  "Sports",
                ],
              },
              {
                title: "Regions",
                links: [
                  "Global 🌐",
                  "India 🇮🇳",
                  "USA 🇺🇸",
                  "UK 🇬🇧",
                  "Europe 🇪🇺",
                  "Asia 🇯🇵",
                ],
              },
              {
                title: "Legal",
                links: [
                  "Privacy",
                  "Terms",
                  "Cookie Policy",
                  "IFCN Methodology",
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {title}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              © 2026 TrueFact News. AI-assisted analysis &amp; Multi-Portal
              Corroboration Engine.
            </p>
            <div className="flex gap-4">
              {["Twitter / X", "LinkedIn", "RSS"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StickyHeader } from "@/components/StickyHeader";
import { HeroBlock } from "@/components/HeroBlock";
import { NewsCard } from "@/components/NewsCard";
import { BulletTicker } from "@/components/BulletTicker";
import { CategorySection } from "@/components/CategorySection";
import { OfficialPortals } from "@/components/OfficialPortals";
import { RegionFilterBar } from "@/components/RegionFilterBar";
import { useNewsContext } from "@/context/NewsContext";
import {
  allNewsArticles,
  politicsArticles,
  worldArticles,
  businessArticles,
  techArticles,
  scienceArticles,
  sportsArticles,
  tickerItems,
  type NewsArticle,
} from "@/data/mockNews";

const CATEGORY_SLUGS = [
  "breaking",
  "politics",
  "world",
  "business",
  "tech",
  "science",
  "sports",
  "entertainment",
  "lifestyle",
] as const;

type CategorySlug = (typeof CATEGORY_SLUGS)[number];

function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}

function formatCategoryLabel(category: CategorySlug) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const { selectedRegion, setSelectedRegion, setActiveArticle } =
    useNewsContext();

  const requestedCategory =
    searchParams.get("category")?.trim().toLowerCase() ?? "";
  const activeCategory = isCategorySlug(requestedCategory)
    ? requestedCategory
    : null;
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const normalizedSearchQuery = searchQuery.toLowerCase();

  // Clear active article reading context when user is on homepage
  useEffect(() => {
    setActiveArticle(null);
  }, [setActiveArticle]);

  // Filter helper: strict match for region if selected, otherwise fallback to Global
  const filterByRegion = (articles: NewsArticle[]) => {
    if (selectedRegion === "All") return articles;
    const regionMatches = articles.filter((a) => a.region === selectedRegion);
    if (regionMatches.length > 0) return regionMatches;
    return articles.filter((a) => a.region === "Global");
  };

  // Dynamic Hero Article based on region selection
  const getDynamicHero = (): NewsArticle => {
    if (selectedRegion === "All") return allNewsArticles[0]; // Global Hero
    const regionHero = allNewsArticles.find(
      (a) =>
        a.region === selectedRegion &&
        (a.category === "Breaking" ||
          a.category === "Tech" ||
          a.category === "World"),
    );
    if (regionHero) return regionHero;
    const anyRegionStory = allNewsArticles.find(
      (a) => a.region === selectedRegion,
    );
    return anyRegionStory ?? allNewsArticles[0];
  };

  const activeHero = getDynamicHero();

  // Secondary stories exclude active hero ID
  const availableArticles = allNewsArticles.filter(
    (a) => a.id !== activeHero.id,
  );
  const filteredSecondary = filterByRegion(availableArticles).slice(0, 3);

  const filteredPolitics = filterByRegion(politicsArticles);
  const filteredWorld = filterByRegion(worldArticles);
  const filteredBusiness = filterByRegion(businessArticles);
  const filteredTech = filterByRegion(techArticles);
  const filteredScience = filterByRegion(scienceArticles);
  const filteredSports = filterByRegion(sportsArticles);

  const filteredResults = allNewsArticles.filter((article) => {
    const matchesRegion =
      selectedRegion === "All" || article.region === selectedRegion;
    const matchesCategory =
      activeCategory === null ||
      article.category.toLowerCase() === activeCategory;
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      JSON.stringify(article).toLowerCase().includes(normalizedSearchQuery);

    return matchesRegion && matchesCategory && matchesSearch;
  });

  const isFilteredView = activeCategory !== null || searchQuery.length > 0;
  const activeCategoryLabel = activeCategory
    ? formatCategoryLabel(activeCategory)
    : null;
  const resultsTitle = searchQuery
    ? activeCategoryLabel
      ? `${activeCategoryLabel} results for “${searchQuery}”`
      : `Search results for “${searchQuery}”`
    : `${activeCategoryLabel ?? "All"} News`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5] dark:bg-[#0d1117]">
      <StickyHeader
        activeCategory={activeCategory}
        initialSearchQuery={searchQuery}
      />

      {/* ── Live Ticker ──────────────────────────────────────── */}
      <BulletTicker items={tickerItems} />

      <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 space-y-10">
        {/* ── Region / Country Filter Bar ───────────────────── */}
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

        {isFilteredView ? (
          <section aria-labelledby="filtered-news-heading" aria-live="polite">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                  Filtered News
                </p>
                <h1
                  id="filtered-news-heading"
                  className="font-serif text-3xl font-black text-gray-950 dark:text-white"
                >
                  {resultsTitle}
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {filteredResults.length} verified{" "}
                  {filteredResults.length === 1 ? "story" : "stories"}
                  {selectedRegion !== "All" ? ` from ${selectedRegion}` : ""}
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Clear category &amp; search
              </Link>
            </div>

            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResults.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                  No matching stories found
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
                  Try another keyword, category, or country filter.
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ── Dynamic Hero Block ─────────────────────────── */}
            <HeroBlock article={activeHero} />

            {/* ── Secondary Grid — F-shaped scan ───────────────── */}
            <section aria-label="Top stories">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 rounded-full bg-red-600" />
                  <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                    Top Verified Stories{" "}
                    {selectedRegion !== "All" && `(${selectedRegion})`}
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  Showing {filteredSecondary.length} stories
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredSecondary.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="default"
                  />
                ))}
              </div>
            </section>

            {/* ── Dual-Screen & Live Streams CTA Banner ───────────── */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-red-400">
                    TrueFact Verification Engine
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  Dual-Screen Fact Checking & Live Stream Verification
                </h3>
                <p className="text-sm text-gray-300 max-w-xl">
                  Cross-check any article claim in real-time across Snopes, Boom
                  Live, Alt News, PolitiFact, and official government
                  registries.
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

            {/* ── Politics Section ──────────────────────────────── */}
            {filteredPolitics.length > 0 && (
              <CategorySection
                title="Politics"
                articles={filteredPolitics}
                viewAllHref="/?category=politics"
              />
            )}

            {/* ── World Section ─────────────────────────────────── */}
            {filteredWorld.length > 0 && (
              <CategorySection
                title="World News"
                articles={filteredWorld}
                viewAllHref="/?category=world"
              />
            )}

            {/* ── Official Regulatory Portals Directory ──────────── */}
            <OfficialPortals />

            {/* ── Business Section ──────────────────────────────── */}
            {filteredBusiness.length > 0 && (
              <CategorySection
                title="Business & Markets"
                articles={filteredBusiness}
                viewAllHref="/?category=business"
              />
            )}

            {/* ── Tech Section ─────────────────────────────────── */}
            {filteredTech.length > 0 && (
              <CategorySection
                title="Tech & AI"
                articles={filteredTech}
                viewAllHref="/?category=tech"
              />
            )}

            {/* ── Science & Health Section ──────────────────────── */}
            {filteredScience.length > 0 && (
              <CategorySection
                title="Science & Health"
                articles={filteredScience}
                viewAllHref="/?category=science"
              />
            )}

            {/* ── Sports Section ────────────────────────────────── */}
            {filteredSports.length > 0 && (
              <CategorySection
                title="Sports"
                articles={filteredSports}
                viewAllHref="/?category=sports"
              />
            )}

            {/* ── Rapid Updates strip (text-only bullets) ───────── */}
            <section aria-label="Rapid updates">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-5 w-1 rounded-full bg-red-600" />
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                  Rapid Updates
                </h2>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {tickerItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        item.category === "Breaking"
                          ? "bg-red-500 animate-pulse"
                          : item.category === "Business"
                            ? "bg-emerald-500"
                            : item.category === "Politics"
                              ? "bg-blue-500"
                              : item.category === "Tech"
                                ? "bg-violet-500"
                                : "bg-teal-500"
                      }`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      {item.text}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        item.category === "Breaking"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <span className="font-serif text-2xl font-black text-gray-950 dark:text-white">
                TRUE<span className="text-red-600">FACT</span>
              </span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Real-time news ranked by truthiness % and multi-source
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
              © 2026 TrueFact News. AI-assisted analysis & Multi-Portal
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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f7f5] text-sm font-semibold text-gray-500 dark:bg-[#0d1117] dark:text-gray-400">
          Loading TrueFact News…
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

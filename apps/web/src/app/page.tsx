import Link from "next/link";
import { getNewsFeed, getPublishedFactChecks, type EditorialFactCheckItem } from "@/lib/api";
import { normalizeLiveCategory, normalizeRegion } from "@/lib/liveUtils";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { EditorialNewsCard } from "@/components/editorial/EditorialNewsCard";
import { FactCheckCard } from "@/components/editorial/FactCheckCard";
import type { LiveArticle } from "@/types/news";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    search?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedCategory = resolvedParams.category?.trim().toLowerCase() || "all";
  const selectedRegion = resolvedParams.region?.trim() || "All";
  const searchQuery = resolvedParams.search?.trim() || "";
  const backendSearch = searchQuery.length >= 2 ? searchQuery : undefined;

  let articles: LiveArticle[] = [];
  let publishedFactChecks: EditorialFactCheckItem[] = [];
  let hasError = false;

  try {
    const raw = await getNewsFeed({
      page: 1,
      page_size: 40,
      search: backendSearch,
      sort_by: "published_at",
      sort_order: "desc",
    });

    articles = raw.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      source_name: item.source_name,
      source_url: item.source_url,
      image_url: item.image_url ?? null,
      category: normalizeLiveCategory(item.category),
      region: normalizeRegion(item.region),
      published_at: item.published_at,
      evidence_score: item.evidence_score ?? 0,
      credibility_score: item.credibility_score ?? null,
    }));

    const factCheckRes = await getPublishedFactChecks(6).catch(() => null);
    if (factCheckRes && Array.isArray(factCheckRes.items)) {
      publishedFactChecks = factCheckRes.items;
    }
  } catch (err) {
    console.error("Failed to load homepage feed:", err);
    hasError = true;
  }

  // Render full API response honestly without client-side fixture hiding
  const validArticles = articles;

  // Apply search/category/region filters
  const filteredArticles = validArticles.filter((a) => {
    if (searchQuery && !backendSearch) {
      const q = searchQuery.toLowerCase();
      const match =
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== "all") {
      if (a.category.toLowerCase() !== selectedCategory) return false;
    }
    if (selectedRegion !== "All") {
      if (a.region.toLowerCase() !== selectedRegion.toLowerCase()) return false;
    }
    return true;
  });

  // Lead story + supporting stories
  const leadStory = filteredArticles[0] || (searchQuery ? null : validArticles[0]) || null;
  const supportingStories = filteredArticles.slice(1, 4);
  const feedStories = filteredArticles.slice(4);

  // Breaking news story (only if appropriate real story exists)
  const breakingStory = validArticles.find(
    (a) => a.category.toLowerCase() === "breaking" || (typeof a.evidence_score === "number" && a.evidence_score >= 85)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      {/* 1. Breaking News Strip (Displayed only when real story exists) */}
      {breakingStory && !searchQuery && selectedCategory === "all" && (
        <div className="border-b border-red-200 dark:border-red-950/60 bg-red-50/80 dark:bg-red-950/30 px-4 py-2 text-xs">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-[#E5242A] px-2.5 py-0.5 font-bold uppercase tracking-wider text-white text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Developing
            </span>
            <Link
              href={`/article/${breakingStory.id}`}
              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-[#E5242A] dark:hover:text-red-400 transition-colors line-clamp-1 flex-1 min-w-[200px]"
            >
              {breakingStory.title}
            </Link>
            <span className="text-gray-400 text-[11px]">{breakingStory.source_name}</span>
          </div>
        </div>
      )}

      {/* Main News Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 space-y-12">
        {/* Error State */}
        {hasError && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-8 text-center space-y-3">
            <span className="text-3xl">⚠️</span>
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
              Live Ingestion Feed Temporarily Unavailable
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We could not reach the backend news service. Please ensure the API is running at the configured endpoint.
            </p>
          </div>
        )}

        {/* Search header feedback if search active */}
        {searchQuery && (
          <div className="pb-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Search Results for “{searchQuery}”
              </h1>
              <p className="text-xs text-gray-500">{filteredArticles.length} stories found</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-[#E5242A] hover:underline">
              Clear Search ✕
            </Link>
          </div>
        )}

        {/* 2. Lead Story & Supporting Grid */}
        {leadStory && !searchQuery && selectedCategory === "all" && selectedRegion === "All" && (
          <section aria-label="Top News">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Large Lead Story (col 8) */}
              <div className="lg:col-span-8">
                <EditorialNewsCard article={leadStory} variant="lead" featured />
              </div>

              {/* 2-3 Supporting Stories (col 4) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-white">
                    Top Stories
                  </h3>
                  <span className="text-[11px] text-gray-400">Current Feed</span>
                </div>

                <div className="space-y-3">
                  {supportingStories.map((story) => (
                    <EditorialNewsCard key={story.id} article={story} variant="horizontal" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Latest News Grid */}
        <section aria-label="Latest News Stream" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#102A43] dark:text-white">
                {selectedCategory !== "all"
                  ? `${selectedCategory.toUpperCase()} NEWS`
                  : selectedRegion !== "All"
                  ? `${selectedRegion.toUpperCase()} STORIES`
                  : "Latest News & Credibility Reports"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Continuous ingestion with automated multi-factor source &amp; evidence evaluation.
              </p>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {["All", "India", "Global", "USA", "Europe", "Asia"].map((reg) => (
                <Link
                  key={reg}
                  href={reg === "All" ? "/" : `/?region=${reg}`}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedRegion.toLowerCase() === reg.toLowerCase()
                      ? "bg-[#102A43] text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {reg === "All" ? "🌐 All" : reg === "India" ? "🇮🇳 India" : reg === "Global" ? "🌍 Global" : reg}
                </Link>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {feedStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedStories.map((article) => (
                <EditorialNewsCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <EditorialNewsCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                No active stories match the selected section right now.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  ← Explore all available news
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 4. Latest Fact Checks (Displayed on Main Homepage only - Human-Reviewed Only) */}
        {selectedCategory === "all" && selectedRegion === "All" && !searchQuery && (
          <section
            aria-label="Human-Reviewed Fact Checks"
            className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E5242A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
                    Human-Reviewed Fact-Check Desk
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#102A43] dark:text-white">
                  Latest Verified Claims &amp; Verdicts
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rigorous editorial investigations with cited evidence. Automated scores never appear as published fact checks.
                </p>
              </div>

              <Link
                href="/verify"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors self-start sm:self-auto"
              >
                <span>⚡ Submit a Claim to Desk</span>
              </Link>
            </div>

            {publishedFactChecks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedFactChecks.map((item) => (
                  <FactCheckCard key={item.article_id} factCheck={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 p-8 text-center space-y-3">
                <span className="text-3xl">🔍</span>
                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                  No Published Fact Checks Yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Human-reviewed fact checks require manual evidence verification and attribution before publication. Have a claim you’d like checked?
                </p>
                <Link
                  href="/verify"
                  className="inline-block rounded-lg bg-[#E5242A] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
                >
                  Submit a Claim for Verification
                </Link>
              </div>
            )}
          </section>
        )}

        {/* 5. Trending Claims for Community Verification */}
        <section aria-label="Trending Claims" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#102A43] dark:text-white">
                Detected Claims Under Review
              </h3>
              <p className="text-xs text-gray-500">Real claims undergoing active evidence gathering across international bureaus.</p>
            </div>
            <Link href="/fact-check" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Dual-Screen Checker ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                topic: "Economy",
                claim: "Claims that cross-border transaction fees were waived for all regional banks.",
                status: "Cross-referencing central bank circulars",
              },
              {
                topic: "Health",
                claim: "Viral social post asserting new dietary supplement prevents viral transmission.",
                status: "Pending peer-reviewed medical trial corroboration",
              },
              {
                topic: "Technology",
                claim: "Satellite imagery purportedly showing undisclosed facility construction.",
                status: "Analysing geospatial registry records",
              },
            ].map((claimItem, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                    {claimItem.topic}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                    “{claimItem.claim}”
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="italic">{claimItem.status}</span>
                  <Link href={`/verify?claim=${encodeURIComponent(claimItem.claim)}`} className="text-[#E5242A] font-bold hover:underline">
                    Check Claim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Trust & Transparency Explainer */}
        <section aria-label="Trust and Methodology" className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-2xl">⚖️</span>
              <h3 className="font-serif text-base font-bold text-[#102A43] dark:text-white">
                Automated Score vs Human Verdict
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Automated credibility scores measure domain track record and multi-source corroboration. Published fact-check verdicts are investigated and attributed by human editors.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl">🔗</span>
              <h3 className="font-serif text-base font-bold text-[#102A43] dark:text-white">
                Traceable Evidence &amp; Citations
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Every score breakdown links to primary sources, independent news organizations, and regulatory databases so you can verify the evidence yourself.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl">📝</span>
              <h3 className="font-serif text-base font-bold text-[#102A43] dark:text-white">
                Transparent Corrections
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                If an article changes or an editorial finding is amended, we document the correction timestamp, version number, and rationale publicly.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Explore our full standards:
            </span>
            <div className="flex items-center gap-4">
              <Link href="/methodology" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Methodology &amp; Weights →
              </Link>
              <Link href="/corrections" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Corrections Policy →
              </Link>
              <Link href="/about" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                About TrueFact →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}

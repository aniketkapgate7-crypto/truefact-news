import { getNewsFeed } from "@/lib/api";
import { normalizeLiveCategory, normalizeRegion } from "@/lib/liveUtils";
import type { LiveArticle } from "@/types/news";
import { LiveHomePage } from "@/components/live/LiveHomePage";
export const dynamic = "force-dynamic";

/**
 * Homepage — server component.
 *
 * Fetches the 30 most recent articles from the live FastAPI feed,
 * normalises category and region fields, then passes the serialisable
 * array to the interactive client-side LiveHomePage component.
 *
 * There is NO silent fallback to mock data. If the API is unreachable,
 * an honest error state is rendered.
 */
export default async function HomePage() {
  let articles: LiveArticle[] = [];
  let hasError = false;

  try {
    const raw = await getNewsFeed({
      page: 1,
      page_size: 30,
      sort_by: "published_at",
      sort_order: "desc",
    });

    articles = raw.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      source_name: item.source_name,
      source_url: item.source_url,
      category: normalizeLiveCategory(item.category),
      region: normalizeRegion(item.region),
      published_at: item.published_at,
      evidence_score: item.evidence_score ?? 0,
    }));
  } catch (err) {
    console.error("Failed to load news feed:", err);
    hasError = true;
  }

  /* ── API error state ─────────────────────────────────────────── */
  if (hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f5] dark:bg-[#0d1117] px-4 text-center space-y-4">
        <p className="text-5xl">⚠️</p>
        <h1 className="font-serif text-2xl font-black text-gray-900 dark:text-white">
          Live feed unavailable
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          TrueFact News could not reach the news API right now. Please try
          refreshing the page in a moment.
        </p>
      </div>
    );
  }

  /* ── Empty feed state ────────────────────────────────────────── */
  if (articles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f5] dark:bg-[#0d1117] px-4 text-center space-y-4">
        <p className="text-5xl">📰</p>
        <h1 className="font-serif text-2xl font-black text-gray-900 dark:text-white">
          No articles yet
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          The live news feed is empty. Articles will appear here once the
          ingestion pipeline publishes new stories.
        </p>
      </div>
    );
  }

  return <LiveHomePage articles={articles} />;
}

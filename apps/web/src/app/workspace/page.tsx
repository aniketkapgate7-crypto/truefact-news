import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getNewsFeed } from "@/lib/api";
import { normalizeLiveCategory, normalizeRegion } from "@/lib/liveUtils";
import { checkWorkspaceAccess } from "@/lib/workspaceAuth";
import type { LiveArticle } from "@/types/news";
import { LiveHomePage } from "@/components/live/LiveHomePage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Internal Editorial Workspace — TrueFact News",
  description: "Internal newsroom intelligence dashboard, review queue, and evidence inspection.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspacePage() {
  let userId: string | null = null;
  let getToken: () => Promise<string | null> = async () => null;
  let authContext = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
    getToken = authResult.getToken;
    authContext = { userId, getToken };
  } catch {
    // Clerk might throw if completely unconfigured or offline
  }

  const access = await checkWorkspaceAccess(
    process.env.AUTH_ENABLED,
    process.env.ENABLE_EDITORIAL_WORKSPACE,
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    authContext
  );

  if (!access.granted) {
    notFound();
  }
  let articles: LiveArticle[] = [];
  let hasError = false;

  try {
    const raw = await getNewsFeed({
      page: 1,
      page_size: 40,
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
  } catch (err) {
    console.error("Failed to load workspace news feed:", err);
    hasError = true;
  }

  return (
    <div className="min-h-screen bg-[#07111F] text-[#E8EEF8]">
      {/* Editorial Security / Environment Banner */}
      <div className="bg-[#102A43] border-b border-[#1E334A] px-4 py-2 text-xs text-[#E8EEF8]">
        <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <strong className="text-amber-300">INTERNAL EDITORIAL WORKSPACE</strong>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">
              Active in Development Mode · Ingestion Monitor &amp; Fact-Check Queue
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-amber-400/90 italic">
              🔒 Auth Blocker: SSO/JWT Authentication required before public deployment
            </span>
            <Link
              href="/"
              className="rounded bg-blue-600/80 hover:bg-blue-600 px-2.5 py-1 text-white font-bold transition-colors"
            >
              ← Public Newsroom
            </Link>
          </div>
        </div>
      </div>

      {hasError ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center space-y-3">
          <span className="text-4xl">⚠️</span>
          <h2 className="font-serif text-xl font-bold text-white">API Connection Failed</h2>
          <p className="text-xs text-gray-400 max-w-md">
            The internal editorial workspace could not reach FastAPI. Verify backend server is listening on port 8000.
          </p>
        </div>
      ) : (
        <LiveHomePage articles={articles} />
      )}
    </div>
  );
}

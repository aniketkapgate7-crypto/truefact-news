import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getSavedStories, type SavedStoryResponse } from "@/lib/api";
import { SavedStoriesList } from "@/components/user/SavedStoriesList";
import { isAuthEnabled } from "@/lib/authConfig";

export const metadata = {
  title: "Saved Stories — TrueFact News",
  description: "Access your saved news articles and personal reading list.",
};

export default async function SavedStoriesPage() {
  if (!isAuthEnabled()) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Saved Stories
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Authentication is currently disabled in this environment. All news, credibility assessments, and public claim tools are freely accessible.
            </p>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  const { userId, getToken } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#E5242A] mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In to View Saved Stories
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Sign in to save verified news stories, access your reading list across devices, and organize evidence dossiers.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c9181e] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  let token: string | null = null;
  let savedStories: SavedStoryResponse[] = [];
  let fetchError: string | null = null;

  try {
    token = await getToken();
    if (!token) {
      fetchError = "Authentication token missing. Please sign in again.";
    } else {
      const res = await getSavedStories(token);
      savedStories = res.items;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load saved stories from backend";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header Title */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A]">
            Personal Library
          </span>
          <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Saved Stories
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your personal collection of bookmarked articles and evidence dossiers.
          </p>
        </div>

        <SavedStoriesList
          initialStories={savedStories}
          initialError={fetchError}
          token={token}
        />
      </main>

      <EditorialFooter />
    </div>
  );
}

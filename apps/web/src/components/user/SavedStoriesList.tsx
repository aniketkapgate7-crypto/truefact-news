"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppAuth } from "@/components/auth/AuthContext";
import { SavedStoryResponse, getSavedStories, removeSavedStoryApi } from "@/lib/api";

interface SavedStoriesListProps {
  initialStories?: SavedStoryResponse[];
  initialError?: string | null;
  token?: string | null;
}

export function SavedStoriesList({
  initialStories = [],
  initialError = null,
  token: initialToken = null,
}: SavedStoriesListProps) {
  const { getToken } = useAppAuth();
  const [stories, setStories] = useState<SavedStoryResponse[]>(initialStories);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    setRemoveError(null);
    try {
      let token = initialToken;
      if (!token) {
        token = await getToken();
      }
      if (!token) {
        throw new Error("Authentication credentials missing. Please sign in again.");
      }
      const res = await getSavedStories(token, 50, 0);
      setStories(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved stories from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (articleId: number) => {
    setRemovingId(articleId);
    setRemoveError(null);
    try {
      let token = initialToken;
      if (!token) {
        token = await getToken();
      }
      if (!token) {
        throw new Error("Authentication credentials missing. Please sign in again.");
      }
      const ok = await removeSavedStoryApi(token, articleId);
      if (ok) {
        setStories((prev) => prev.filter((s) => s.article_id !== articleId));
      }
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove story.");
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-12 text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E5242A] border-t-transparent" />
        <p className="text-xs text-gray-600 dark:text-gray-400">Loading saved stories from backend…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-8 text-center space-y-4 shadow-sm">
        <span className="text-3xl">⚠️</span>
        <h3 className="text-base font-serif font-bold text-gray-900 dark:text-white">
          Unable to Load Saved Stories
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">
          {error}
        </p>
        <div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors shadow-sm"
          >
            Retry Loading Stories
          </button>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-12 text-center shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2">
          No Saved Stories Yet
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
          Click the bookmark icon on any article card across TrueFact News to save it to your personal reading list.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
        >
          Explore News Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {removeError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2"
        >
          <span>⚠️ {removeError}</span>
          <button
            type="button"
            onClick={() => setRemoveError(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-mono text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {stories.map((story) => (
        <div
          key={story.id}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-[#E5242A] uppercase tracking-wider">
                {story.source_name || story.source_domain || "News Source"}
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs text-gray-400">
                Saved {new Date(story.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>

            <Link
              href={`/article/${story.article_id}`}
              className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white hover:text-[#E5242A] dark:hover:text-[#E5242A] transition-colors line-clamp-2"
            >
              {story.article_title}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/article/${story.article_id}`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Read Article
            </Link>

            <Link
              href={`/evidence/${story.article_id}`}
              className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors flex items-center gap-1"
            >
              <span>Evidence</span>
              <span className="text-[10px]">→</span>
            </Link>

            <button
              onClick={() => handleRemove(story.article_id)}
              disabled={removingId === story.article_id}
              className="rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-[#E5242A] hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-50"
            >
              {removingId === story.article_id ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

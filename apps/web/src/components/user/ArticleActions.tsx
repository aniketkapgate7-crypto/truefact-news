"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { saveStoryApi, removeSavedStoryApi, createSourceWatchlistApi } from "@/lib/api";

interface ArticleActionsProps {
  articleId: number;
  isPro?: boolean;
}

export function ArticleActions({ articleId, isPro = false }: ArticleActionsProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [watched, setWatched] = useState(false);
  const [loadingWatch, setLoadingWatch] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveToggle = async () => {
    if (!isSignedIn) return;
    setLoadingSave(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) return;

      if (saved) {
        const ok = await removeSavedStoryApi(token, articleId);
        if (ok) setSaved(false);
      } else {
        const res = await saveStoryApi(token, articleId);
        if (res) setSaved(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save story";
      setMessage(msg);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleWatchSource = async () => {
    if (!isSignedIn || !isPro) return;
    setLoadingWatch(true);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await createSourceWatchlistApi(token, articleId);
      if (res) setWatched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to watch source";
      setMessage(msg);
    } finally {
      setLoadingWatch(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span>🔖</span> Save
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span>🔒</span> Watch Source
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Save Story Button */}
      <button
        onClick={handleSaveToggle}
        disabled={loadingSave}
        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
          saved
            ? "bg-rose-50 text-[#E5242A] border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
            : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
        }`}
      >
        <span>{saved ? "🔖 Saved" : "🔖 Save Story"}</span>
      </button>

      {/* Watch Source Button */}
      {isPro ? (
        <button
          onClick={handleWatchSource}
          disabled={loadingWatch || watched}
          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            watched
              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          }`}
        >
          <span>{watched ? "👁️ Watching Source" : "👁️ Watch Source"}</span>
        </button>
      ) : (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Requires TrueFact Pro entitlement"
        >
          <span>🔒</span> Watch Source (Pro)
        </Link>
      )}

      {message && <span className="text-[10px] text-rose-500">{message}</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { WatchlistResponse, removeSourceWatchlistApi } from "@/lib/api";

interface WatchlistsListProps {
  initialWatchlists: WatchlistResponse[];
  token: string;
}

export function WatchlistsList({ initialWatchlists, token }: WatchlistsListProps) {
  const [watchlists, setWatchlists] = useState<WatchlistResponse[]>(initialWatchlists);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (watchlistId: string) => {
    setRemovingId(watchlistId);
    try {
      const ok = await removeSourceWatchlistApi(token, watchlistId);
      if (ok) {
        setWatchlists((prev) => prev.filter((w) => w.id !== watchlistId));
      }
    } finally {
      setRemovingId(null);
    }
  };

  if (watchlists.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-12 text-center shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2">
          No Monitored Sources Yet
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
          You can add any news publisher domain to your watchlist from story cards in the news feed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
        >
          Browse News Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {watchlists.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Monitored Source
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {item.source_domain}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-1">
              {item.source_name_snapshot}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Added {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              href={`/?search=${encodeURIComponent(item.source_domain)}`}
              className="text-xs font-semibold text-[#E5242A] hover:underline"
            >
              Filter Feed Articles →
            </Link>

            <button
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              className="rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30 px-3 py-1 text-xs font-semibold text-[#E5242A] hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-50"
            >
              {removingId === item.id ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

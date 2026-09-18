import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchNewsFeed } from "@/services/newsApi";
import { mapApiArticleToNewsStory } from "@/services/newsMapper";
import type { NewsCategory, NewsStory } from "@/types/news";

export function useNewsFeed() {
  const [allStories, setAllStories] = useState<NewsStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "All">("All");
  const [highCredibilityOnly, setHighCredibilityOnly] = useState(false);

  const loadPage = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    try {
      const response = await fetchNewsFeed(signal, pageNum);
      const mapped = response.items.map(mapApiArticleToNewsStory);

      setAllStories((prev) =>
        pageNum === 1 ? mapped : [...prev, ...mapped],
      );
      setHasMore(response.pagination.has_next);
      setPage(pageNum);
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") return;
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the news feed.",
      );
    }
  }, []);

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void loadPage(1, controller.signal).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });

    return () => controller.abort();
  }, [loadPage]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    await loadPage(1, controller.signal);
    setIsLoading(false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isLoading) return;
    setIsFetchingMore(true);
    await loadPage(page + 1);
    setIsFetchingMore(false);
  }, [hasMore, isFetchingMore, isLoading, loadPage, page]);

  // Client-side category and credibility filtering
  const stories = useMemo(() => {
    let result = allStories;

    if (highCredibilityOnly) {
      result = result
        .filter(
          (s) => typeof s.credibilityScore === "number" && s.credibilityScore >= 80,
        )
        .sort((a, b) => (b.credibilityScore ?? 0) - (a.credibilityScore ?? 0));
    }

    if (selectedCategory !== "All") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    return result;
  }, [allStories, highCredibilityOnly, selectedCategory]);

  return {
    stories,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    selectedCategory,
    setSelectedCategory,
    highCredibilityOnly,
    setHighCredibilityOnly,
    reload,
    loadMore,
  };
}

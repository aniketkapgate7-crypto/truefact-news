import { useCallback, useEffect, useRef, useState } from "react";

import { fetchNewsFeed } from "@/services/newsApi";
import { mapApiArticleToNewsStory } from "@/services/newsMapper";
import type { NewsStory } from "@/types/news";

export function useNewsFeed() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reloadControllerRef = useRef<AbortController | null>(null);

  const loadNews = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchNewsFeed(signal);
      setStories(response.items.map(mapApiArticleToNewsStory));
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the news feed.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Manual reload (pull-to-refresh). Uses a separate AbortController so the
   * RefreshControl spinner drives the loading state, not the full-page spinner.
   */
  const reload = useCallback(async () => {
    // Cancel any in-flight manual reload
    reloadControllerRef.current?.abort();
    const controller = new AbortController();
    reloadControllerRef.current = controller;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetchNewsFeed(controller.signal);
      if (!controller.signal.aborted) {
        setStories(response.items.map(mapApiArticleToNewsStory));
      }
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the news feed.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadNews(controller.signal);

    return () => controller.abort();
  }, [loadNews]);

  return {
    stories,
    isLoading,
    isRefreshing,
    error,
    reload,
  };
}

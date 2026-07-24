import { useCallback, useEffect, useState } from "react";

import { fetchNewsFeed } from "@/services/newsApi";
import { mapApiArticleToNewsStory } from "@/services/newsMapper";
import type { NewsStory } from "@/types/news";

export function useNewsFeed() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const controller = new AbortController();

    void loadNews(controller.signal);

    return () => controller.abort();
  }, [loadNews]);

  return {
    stories,
    isLoading,
    error,
    reload: loadNews,
  };
}

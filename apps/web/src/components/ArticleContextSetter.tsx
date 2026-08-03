"use client";

import { useEffect } from "react";
import { useNewsContext } from "@/context/NewsContext";
import type { NewsArticle } from "@/data/mockNews";

export function ArticleContextSetter({ article }: { article: NewsArticle }) {
  const { setActiveArticle } = useNewsContext();

  useEffect(() => {
    setActiveArticle(article);
    return () => {
      setActiveArticle(null);
    };
  }, [article, setActiveArticle]);

  return null;
}

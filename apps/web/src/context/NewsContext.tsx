"use client";

import React, { createContext, useContext, useState } from "react";
import type { LiveRegion } from "@/types/news";

/**
 * The context stores the currently viewed article as `unknown` so it can
 * accept both `LiveArticle` (from the live homepage) and `NewsArticle`
 * (from the mock article route) without a type conflict.
 * Each consumer is responsible for narrowing or casting the value.
 */
interface NewsContextType {
  activeArticle: unknown;
  setActiveArticle: (article: unknown) => void;
  selectedRegion: LiveRegion | "All";
  setSelectedRegion: (region: LiveRegion | "All") => void;
}

const NewsContext = createContext<NewsContextType>({
  activeArticle: null,
  setActiveArticle: () => {},
  selectedRegion: "All",
  setSelectedRegion: () => {},
});

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [activeArticle, setActiveArticle] = useState<unknown>(null);
  const [selectedRegion, setSelectedRegion] = useState<LiveRegion | "All">("All");

  return (
    <NewsContext.Provider
      value={{
        activeArticle,
        setActiveArticle,
        selectedRegion,
        setSelectedRegion,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNewsContext() {
  return useContext(NewsContext);
}

"use client";

import React, { createContext, useContext, useState } from "react";
import type { NewsArticle, Region } from "@/data/mockNews";

interface NewsContextType {
  activeArticle: NewsArticle | null;
  setActiveArticle: (article: NewsArticle | null) => void;
  selectedRegion: Region | "All";
  setSelectedRegion: (region: Region | "All") => void;
}

const NewsContext = createContext<NewsContextType>({
  activeArticle: null,
  setActiveArticle: () => {},
  selectedRegion: "All",
  setSelectedRegion: () => {},
});

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | "All">("All");

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

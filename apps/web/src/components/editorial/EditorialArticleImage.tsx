"use client";

import { useState } from "react";

interface EditorialArticleImageProps {
  src: string | null | undefined;
  alt: string;
  sourceName: string;
  aspectRatioClass?: string;
  className?: string;
  priority?: boolean;
}

function getSourceInitials(name: string): string {
  if (!name) return "TF";
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || "TF";
}

export function EditorialArticleImage({
  src,
  alt,
  sourceName,
  aspectRatioClass = "aspect-[16/10]",
  className = "",
  priority = false,
}: EditorialArticleImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isValidUrl = Boolean(
    src &&
    typeof src === "string" &&
    src.trim().length > 0 &&
    (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))
  );

  const showFallback = !isValidUrl || hasError;
  const initials = getSourceInitials(sourceName);

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800 ${aspectRatioClass} ${className}`}
    >
      {!showFallback && (
        <img
          src={src!}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Clean, Editorial Neutral Fallback */}
      {showFallback && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-300/60 dark:from-slate-900 dark:via-[#121A2A] dark:to-slate-800 text-slate-700 dark:text-slate-300 p-4 text-center select-none"
          aria-label={`Media placeholder from ${sourceName}`}
        >
          {/* Source Initials Emblem */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-black text-[#102A43] dark:text-white tracking-wider mb-2">
            {initials}
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {sourceName || "TrueFact Newsroom"}
          </span>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Archival News Reporting
          </span>

          {/* Accessible alt description without visual clutter */}
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}

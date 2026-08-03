"use client";

import type { RedFlagItem } from "@/data/mockNews";

interface RedFlagsPanelProps {
  redFlags: RedFlagItem[];
}

export function RedFlagsPanel({ redFlags }: RedFlagsPanelProps) {
  const criticalFlags = redFlags.filter((f) => f.severity === "high" || f.severity === "medium");
  const lowFlags = redFlags.filter((f) => f.severity === "low");
  const positiveSignals = redFlags.filter((f) => f.severity === "positive");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Spot On-Screen Visual Red Flags & Claims Inspection
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Automated detection of sensational headlines, imagery manipulation, and unverified claims.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            {criticalFlags.length + lowFlags.length} Warnings
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {positiveSignals.length} Passed
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {redFlags.map((flag) => {
          const isHigh = flag.severity === "high";
          const isMedium = flag.severity === "medium";
          const isLow = flag.severity === "low";
          const isPositive = flag.severity === "positive";

          const icon = isHigh
            ? "🚨"
            : isMedium
            ? "⚠️"
            : isLow
            ? "🔍"
            : "✅";

          const cardStyle = isHigh
            ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
            : isMedium
            ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
            : isLow
            ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20"
            : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20";

          const titleColor = isHigh
            ? "text-red-900 dark:text-red-300"
            : isMedium
            ? "text-amber-900 dark:text-amber-300"
            : isLow
            ? "text-blue-900 dark:text-blue-300"
            : "text-emerald-900 dark:text-emerald-300";

          return (
            <div
              key={flag.id}
              className={`p-4 rounded-xl border ${cardStyle} transition-all`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-sm ${titleColor}`}>
                        {flag.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/70 dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {flag.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                      {flag.description}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {flag.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

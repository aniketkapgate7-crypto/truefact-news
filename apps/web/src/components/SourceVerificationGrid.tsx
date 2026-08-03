"use client";

import type { SourceVerification } from "@/data/mockNews";

interface SourceVerificationGridProps {
  verifications: SourceVerification[];
}

const sourceIcons: Record<string, string> = {
  global_channel: "📺",
  social: "📱",
  fact_checker: "🔍",
  official: "🏛️",
};

export function SourceVerificationGrid({ verifications }: SourceVerificationGridProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Multi-Source Cross Verification Grid
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time truthiness evaluation across news networks, social media, and fact-checking organizations.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          {verifications.length} Signals Tracked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifications.map((source, index) => {
          const isVerified = source.status === "verified";
          const isPartial = source.status === "partial";
          const isDisputed = source.status === "disputed";

          const statusBg = isVerified
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            : isPartial
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            : isDisputed
            ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800"
            : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";

          const statusText = isVerified
            ? "✓ Verified"
            : isPartial
            ? "⚠ Partial"
            : isDisputed
            ? "✗ Disputed"
            : "Unverified";

          return (
            <div
              key={index}
              className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-label={source.type}>
                      {sourceIcons[source.type] ?? "🌐"}
                    </span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {source.name}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBg}`}>
                    {statusText}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {source.detail}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium capitalize">
                  {source.type.replace("_", " ")}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full ${
                        source.matchScore >= 85
                          ? "bg-emerald-500"
                          : source.matchScore >= 65
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${source.matchScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {source.matchScore}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

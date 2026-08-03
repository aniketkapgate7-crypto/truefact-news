"use client";

import type { BiasAnalysis as BiasAnalysisType } from "@/data/mockNews";

interface BiasAnalysisProps {
  biasAnalysis: BiasAnalysisType;
}

export function BiasAnalysis({ biasAnalysis }: BiasAnalysisProps) {
  const { politicalLean, sensationalismScore, tone, emotionalTriggersCount, readingEaseScore } =
    biasAnalysis;

  // Calculate lean position percentage (0% to 100% on the slider bar)
  const leanPercent = Math.min(100, Math.max(0, ((politicalLean + 100) / 200) * 100));

  const getLeanLabel = (val: number) => {
    if (val <= -40) return "Left Bias";
    if (val < -10) return "Center-Left";
    if (val <= 10) return "Neutral / Center";
    if (val < 40) return "Center-Right";
    return "Right Bias";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Evaluate Anchoring, Bias & Language Tone
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Linguistic sentiment parsing, framing perspective, and sensationalism index.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          NLP Analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Political Lean Axis */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Political Lean Spectrum
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {getLeanLabel(politicalLean)} ({politicalLean > 0 ? `+${politicalLean}` : politicalLean})
            </span>
          </div>

          <div className="relative my-4">
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-blue-600 via-gray-300 dark:via-gray-600 to-red-600 overflow-hidden" />
            {/* Indicator Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-white shadow-md transition-all duration-500"
              style={{ left: `${leanPercent}%` }}
              title={`Political Lean Index: ${politicalLean}`}
            />
          </div>

          <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
            <span>Left (-100)</span>
            <span>Center (0)</span>
            <span>Right (+100)</span>
          </div>
        </div>

        {/* Sensationalism & Emotion Bar */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Sensationalism Index
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {sensationalismScore}/100 ({sensationalismScore < 25 ? "Low" : sensationalismScore < 60 ? "Moderate" : "High"})
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden my-4">
            <div
              className={`h-full transition-all duration-500 ${
                sensationalismScore < 25
                  ? "bg-emerald-500"
                  : sensationalismScore < 60
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${sensationalismScore}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Emotional Triggers: <strong className="text-gray-900 dark:text-white">{emotionalTriggersCount}</strong></span>
            <span>Reading Ease: <strong className="text-gray-900 dark:text-white">{readingEaseScore}/100</strong></span>
          </div>
        </div>
      </div>

      {/* Tone Badge Summary */}
      <div className="mt-4 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
        <span className="text-purple-900 dark:text-purple-300 font-medium">
          Primary Editorial Tone: <strong className="font-bold">{tone}</strong>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Flesch-Kincaid Standard Compliant
        </span>
      </div>
    </div>
  );
}

"use client";

import type { TruthAnalysis } from "@/data/mockNews";

interface TruthMeterProps {
  truthAnalysis: TruthAnalysis;
  size?: "sm" | "md" | "lg";
}

export function TruthMeter({ truthAnalysis, size = "md" }: TruthMeterProps) {
  const { truthScore, truthGrade, sourceVerifications } = truthAnalysis;

  // Calculate SVG Circle Parameters
  const strokeWidth = size === "lg" ? 14 : size === "md" ? 10 : 8;
  const radius = size === "lg" ? 64 : size === "md" ? 48 : 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (truthScore / 100) * circumference;

  // Determine color theme based on percentage
  const ringColor =
    truthScore >= 85
      ? "text-emerald-500 stroke-emerald-500"
      : truthScore >= 65
      ? "text-amber-500 stroke-amber-500"
      : "text-red-500 stroke-red-500";

  const badgeBg =
    truthScore >= 85
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
      : truthScore >= 65
      ? "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400"
      : "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400";

  // Calculate source contributions breakdown
  const verifiedCount = sourceVerifications.filter((s) => s.status === "verified").length;
  const partialCount = sourceVerifications.filter((s) => s.status === "partial").length;
  const totalSources = sourceVerifications.length;

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="32"
              className="stroke-gray-200 dark:stroke-gray-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              className={`transition-all duration-1000 ease-out ${ringColor}`}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={2 * Math.PI * 32 - (truthScore / 100) * (2 * Math.PI * 32)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute font-bold text-xs text-gray-900 dark:text-white">
            {truthScore}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400">Truth Score</span>
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{truthGrade}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Truthiness Score (Truth %)
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
          {truthGrade}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* SVG Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className={`${size === "lg" ? "h-44 w-44" : "h-36 w-36"} -rotate-90 transform`}
            viewBox="0 0 160 160"
          >
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-gray-100 dark:stroke-gray-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={`transition-all duration-1000 ease-out ${ringColor}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-serif text-4xl font-black text-gray-950 dark:text-white tracking-tight">
              {truthScore}
              <span className="text-xl font-sans font-medium text-gray-400">%</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
              Verified
            </span>
          </div>
        </div>

        {/* Signals & Breakdown */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              <span>Source Consensus ({verifiedCount}/{totalSources} verified)</span>
              <span className="text-gray-900 dark:text-white font-bold">{truthScore}% Confidence</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${(verifiedCount / totalSources) * 100}%` }}
                title={`${verifiedCount} Verified Sources`}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(partialCount / totalSources) * 100}%` }}
                title={`${partialCount} Partial Corroborations`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 font-medium block mb-0.5">Global Wire Consensus</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">98% Alignment</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 font-medium block mb-0.5">Fact Checkers Match</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">4/4 Passed</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 font-medium block mb-0.5">Social Media Cluster</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">High Corroboration</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 font-medium block mb-0.5">Official Govt Registry</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

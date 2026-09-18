"use client";

import { getCredibilityTier } from "@/lib/credibilityTokens";

interface EvidenceMetricBarProps {
  label: string;
  score: number;
  weightLabel?: string;
}

export function EvidenceMetricBar({
  label,
  score,
  weightLabel,
}: EvidenceMetricBarProps) {
  const tier = getCredibilityTier(score);
  const clampedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-[#E8EEF8] text-[12px]">{label}</span>
          {weightLabel && (
            <span className="text-[10px] text-[#506176] font-mono">({weightLabel})</span>
          )}
        </div>
        <span className="font-mono text-[11px] font-semibold" style={{ color: tier.hexColor }}>
          {Math.round(score)}
          <span className="text-[#506176] font-normal text-[10px]">/100</span>
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1E334A]">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedScore}%`,
            backgroundColor: tier.hexColor,
          }}
        />
      </div>
    </div>
  );
}

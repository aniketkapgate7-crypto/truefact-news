"use client";

import { getCredibilityTier } from "@/lib/credibilityTokens";

interface CredibilityRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function CredibilityRing({
  score,
  size = 96,
  strokeWidth = 7,
  showLabel = true,
}: CredibilityRingProps) {
  const tier = getCredibilityTier(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = typeof score === "number" && score > 0 ? Math.min(Math.max(score, 0), 100) : 0;
  const strokeDashoffset = circumference - (validScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E334A"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        {typeof score === "number" && score > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tier.hexColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        )}
      </svg>

      {/* Centered Score Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {typeof score === "number" && score > 0 ? (
          <>
            <span className="font-mono text-xl font-bold tracking-tight" style={{ color: tier.hexColor }}>
              {Math.round(score)}
              <span className="text-xs font-normal text-[#8191A8] ml-0.5">%</span>
            </span>
            {showLabel && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#8191A8]">
                {tier.badgeLabel}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-mono text-base font-bold text-[#64748B]">—</span>
            {showLabel && (
              <span className="text-[9px] font-medium uppercase tracking-wider text-[#64748B]">
                Pending
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

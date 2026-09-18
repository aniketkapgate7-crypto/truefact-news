import { getCredibilityTier } from "@/lib/credibilityTokens";
import { LIVE_CATEGORY_COLORS } from "@/types/news";

interface CredibilityBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "md";
}

export function CredibilityBadge({ score, size = "sm" }: CredibilityBadgeProps) {
  const tier = getCredibilityTier(score);
  const padding = size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-bold tracking-wide ${tier.borderColor} ${tier.bgColor} ${tier.textColor} ${padding}`}
      title={score ? `Credibility score: ${score}/100` : "Assessment pending"}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${tier.dotColor}`} />
      {score ? `${tier.badgeLabel} · ${Math.round(score)}%` : "Pending"}
    </span>
  );
}

interface CategoryPillProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryPill({ category, size = "sm" }: CategoryPillProps) {
  const colors = LIVE_CATEGORY_COLORS[category] ?? "bg-[#1E334A] text-[#8191A8] border border-[#2D4A6B]";
  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`inline-block rounded-md font-bold uppercase tracking-wider ${colors} ${padding}`}>
      {category}
    </span>
  );
}

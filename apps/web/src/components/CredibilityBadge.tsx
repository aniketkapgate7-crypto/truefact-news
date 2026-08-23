import { LIVE_CATEGORY_COLORS } from "@/types/news";

interface CredibilityBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function CredibilityBadge({ score, size = "sm" }: CredibilityBadgeProps) {
  const color =
    score >= 75
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800";

  const label = score >= 75 ? "Verified" : score >= 50 ? "Partial" : "Disputed";
  const padding = size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${color} ${padding}`}
      title={`Credibility score: ${score}/100`}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
        }`}
      />
      {label} · {score}%
    </span>
  );
}

interface CategoryPillProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryPill({ category, size = "sm" }: CategoryPillProps) {
  const colors = LIVE_CATEGORY_COLORS[category] ?? "bg-gray-600 text-white";
  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-block rounded font-bold uppercase tracking-widest ${colors} ${padding}`}>
      {category}
    </span>
  );
}

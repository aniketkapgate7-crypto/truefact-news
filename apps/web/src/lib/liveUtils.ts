/**
 * Utility helpers for live news articles.
 * No "server-only" import — safe to use in server components and utilities.
 */

import type { LiveCategory, LiveRegion } from "@/types/news";

/* ── Category normalisation ─────────────────────────────────────── */

const CATEGORY_MAP: Record<string, LiveCategory> = {
  breaking:      "Breaking",
  politics:      "Politics",
  world:         "World",
  global:        "World",
  international: "World",
  business:      "Business",
  finance:       "Business",
  markets:       "Business",
  tech:          "Tech",
  technology:    "Tech",
  ai:            "Tech",
  science:       "Science",
  health:        "Science",
  space:         "Science",
  sports:        "Sports",
  entertainment: "Entertainment",
  lifestyle:     "Lifestyle",
};

export function normalizeLiveCategory(raw: string): LiveCategory {
  return CATEGORY_MAP[raw.toLowerCase().trim()] ?? "World";
}

/* ── Region normalisation ────────────────────────────────────────── */

const REGION_MAP: Record<string, LiveRegion> = {
  global:        "Global",
  international: "Global",
  world:         "Global",
  usa:           "USA",
  "united states": "USA",
  us:            "USA",
  america:       "USA",
  india:         "India",
  in:            "India",
  uk:            "UK",
  "united kingdom": "UK",
  britain:       "UK",
  europe:        "Europe",
  eu:            "Europe",
  asia:          "Asia",
  "asia-pacific":"Asia",
  apac:          "Asia",
};

export function normalizeRegion(raw: string | undefined | null): LiveRegion {
  if (!raw) return "Global";
  return REGION_MAP[raw.toLowerCase().trim()] ?? "Global";
}

/* ── Category visual gradients ──────────────────────────────────── */

const CATEGORY_GRADIENTS: Record<LiveCategory, string> = {
  Breaking:      "from-red-950 via-red-900 to-slate-900",
  Politics:      "from-blue-950 via-blue-900 to-slate-900",
  World:         "from-teal-950 via-teal-900 to-slate-900",
  Business:      "from-emerald-950 via-emerald-900 to-slate-900",
  Tech:          "from-violet-950 via-violet-900 to-slate-900",
  Science:       "from-purple-950 via-indigo-900 to-slate-900",
  Sports:        "from-amber-950 via-amber-900 to-slate-900",
  Entertainment: "from-rose-950 via-rose-900 to-slate-900",
  Lifestyle:     "from-indigo-950 via-indigo-900 to-slate-900",
};

export function categoryGradient(category: LiveCategory): string {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.World;
}

/* ── Category accent colours for ticker dots ────────────────────── */

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Breaking:      "bg-red-500",
  Politics:      "bg-blue-500",
  World:         "bg-teal-500",
  Business:      "bg-emerald-500",
  Tech:          "bg-violet-500",
  Science:       "bg-purple-500",
  Sports:        "bg-amber-500",
  Entertainment: "bg-rose-500",
  Lifestyle:     "bg-indigo-500",
};

export function categoryDotColor(category: string): string {
  return CATEGORY_DOT_COLORS[category] ?? "bg-gray-400";
}

/* ── Source initials for visual fallback ────────────────────────── */

export function sourceInitials(sourceName: string): string {
  return sourceName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* ── Evidence score label ────────────────────────────────────────── */

export function evidenceScoreLabel(score: number): string {
  if (!score || score <= 0) return "Assessment pending";
  return `Evidence score: ${score}/100`;
}

/* ── Time ago helper ─────────────────────────────────────────────── */

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Region flag lookup ──────────────────────────────────────────── */

const REGION_FLAGS: Record<LiveRegion, string> = {
  Global: "🌍",
  USA:    "🇺🇸",
  India:  "🇮🇳",
  UK:     "🇬🇧",
  Europe: "🇪🇺",
  Asia:   "🇯🇵",
};

export function regionFlag(region: LiveRegion): string {
  return REGION_FLAGS[region] ?? "🌐";
}

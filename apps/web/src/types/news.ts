/**
 * Shared live-article types.
 *
 * This file has NO runtime imports so it can be used safely in both
 * server components and "use client" components without violating the
 * `server-only` boundary enforced by @/lib/api.ts.
 */

export type LiveCategory =
  | "Breaking"
  | "Politics"
  | "World"
  | "Business"
  | "Tech"
  | "Science"
  | "Sports"
  | "Entertainment"
  | "Lifestyle";

/** Canonical region names used in the UI filter. */
export type LiveRegion =
  | "Global"
  | "USA"
  | "India"
  | "UK"
  | "Europe"
  | "Asia";

/** Serializable shape passed from the server page to the client homepage. */
export interface LiveArticle {
  id: number;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  category: LiveCategory;
  region: LiveRegion;
  published_at: string;
  evidence_score: number;
}

/** Static region filter list — shared between RegionFilterBar and context. */
export interface RegionFilterItem {
  id: string;
  name: string;
  flag: string;
  code: LiveRegion | "All";
}

export const LIVE_REGION_LIST: RegionFilterItem[] = [
  { id: "all",    name: "All Regions",    flag: "🌐", code: "All" },
  { id: "global", name: "Global / Intl",  flag: "🌍", code: "Global" },
  { id: "india",  name: "India",          flag: "🇮🇳", code: "India" },
  { id: "usa",    name: "United States",  flag: "🇺🇸", code: "USA" },
  { id: "uk",     name: "United Kingdom", flag: "🇬🇧", code: "UK" },
  { id: "europe", name: "Europe (EU)",    flag: "🇪🇺", code: "Europe" },
  { id: "asia",   name: "Asia-Pacific",   flag: "🇯🇵", code: "Asia" },
];

/** Category colour classes used by CategoryPill and other components. */
export const LIVE_CATEGORY_COLORS: Record<string, string> = {
  Breaking:      "bg-red-600 text-white",
  Politics:      "bg-blue-700 text-white",
  World:         "bg-teal-700 text-white",
  Business:      "bg-emerald-700 text-white",
  Tech:          "bg-violet-700 text-white",
  Science:       "bg-purple-700 text-white",
  Sports:        "bg-amber-600 text-white",
  Entertainment: "bg-rose-600 text-white",
  Lifestyle:     "bg-indigo-600 text-white",
};

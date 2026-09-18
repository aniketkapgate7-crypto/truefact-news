export type CredibilityLabel =
  | "High Credibility"
  | "Highly credible"
  | "Credible"
  | "Needs context"
  | "Unverified"
  | "Assessment pending";

export type NewsCategory =
  | "Breaking"
  | "Politics"
  | "World"
  | "Business"
  | "Tech"
  | "Science"
  | "Sports"
  | "Entertainment"
  | "Lifestyle"
  | "Other";

export type NewsStory = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string | null;
  category: NewsCategory;
  region: string;
  publishedAt: string;
  credibilityScore: number | null;
  credibilityLabel: CredibilityLabel;
  comments: number;
  reposts: number;
  platforms: string[];
  confidenceLevel?: "low" | "medium" | "high" | string | null;
};
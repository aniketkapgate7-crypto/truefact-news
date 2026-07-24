export type CredibilityLabel =
  | "Highly credible"
  | "Credible"
  | "Needs context"
  | "Unverified";

export type NewsStory = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  credibilityScore: number;
  credibilityLabel: CredibilityLabel;
  comments: number;
  reposts: number;
  platforms: string[];
};
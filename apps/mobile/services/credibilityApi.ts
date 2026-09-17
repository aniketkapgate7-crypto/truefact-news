const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export type CredibilityAssessment = {
  id: number;
  news_article_id: number;
  source_reliability_score: number;
  evidence_quality_score: number;
  corroboration_score: number;
  content_quality_score: number;
  supporting_evidence_count: number;
  contradicting_evidence_count: number;
  independent_source_count: number;
  credibility_score: number;
  credibility_rating: "very_low" | "low" | "medium" | "high" | "very_high";
  assessment_status: "supported" | "disputed" | "mixed" | "unverified";
  confidence_level: "low" | "medium" | "high";
  explanation: string;
  is_evolving: boolean;
  assessed_at: string;
};

export async function fetchCredibilityAssessment(
  articleId: string,
  signal?: AbortSignal,
): Promise<CredibilityAssessment | null> {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");

  const response = await fetch(
    `${API_BASE_URL}/api/v1/news/${articleId}/credibility-assessment`,
    { headers: { Accept: "application/json" }, signal },
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Credibility request failed with status ${response.status}.`);
  }

  return (await response.json()) as CredibilityAssessment;
}

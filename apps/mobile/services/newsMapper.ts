import type { ApiNewsArticle } from "@/types/api";
import type { CredibilityLabel, NewsStory } from "@/types/news";

function getCredibilityLabel(score: number): CredibilityLabel {
  if (score >= 85) return "Highly credible";
  if (score >= 65) return "Credible";
  if (score >= 45) return "Needs context";
  return "Unverified";
}

export function mapApiArticleToNewsStory(
  article: ApiNewsArticle,
): NewsStory {
  // NOTE: The news-feed endpoint exposes `evidence_score` (0-100), not the
  // full weighted `credibility_score` from the credibility-assessment endpoint.
  // For a per-article credibility score, fetch /api/v1/news/{id}/credibility-assessment.
  const credibilityScore = Math.max(
    0,
    Math.min(100, Math.round(article.evidence_score)),
  );

  return {
    id: String(article.id),
    headline: article.title,
    summary: article.summary,
    source: article.source_name,
    publishedAt: article.published_at,
    credibilityScore,
    credibilityLabel: getCredibilityLabel(credibilityScore),
    comments: article.comment_count,
    reposts: article.repost_count,
    platforms: ["Web"],
  };
}

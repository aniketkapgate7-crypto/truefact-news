import type { ApiNewsArticle } from "@/types/api";
import type { CredibilityLabel, NewsCategory, NewsStory } from "@/types/news";

function getCredibilityLabel(score: number | null | undefined): CredibilityLabel {
  if (score == null || score <= 0) return "Assessment pending";
  if (score >= 80) return "High Credibility";
  if (score >= 65) return "Credible";
  if (score >= 45) return "Needs context";
  return "Unverified";
}

const CATEGORY_MAP: Record<string, NewsCategory> = {
  breaking: "Breaking",
  politics: "Politics",
  world: "World",
  business: "Business",
  tech: "Tech",
  technology: "Tech",
  science: "Science",
  health: "Science",
  sports: "Sports",
  entertainment: "Entertainment",
  lifestyle: "Lifestyle",
};

function normalizeCategory(raw: string): NewsCategory {
  return CATEGORY_MAP[raw.toLowerCase()] ?? "Other";
}

export function mapApiArticleToNewsStory(
  article: ApiNewsArticle,
): NewsStory {
  const credibilityScore =
    article.credibility_score !== undefined
      ? article.credibility_score
      : null;

  return {
    id: String(article.id),
    headline: article.title,
    summary: article.summary,
    source: article.source_name,
    sourceUrl: article.source_url,
    imageUrl: article.image_url ?? null,
    category: normalizeCategory(article.category),
    region: article.region,
    publishedAt: article.published_at,
    credibilityScore,
    credibilityLabel: getCredibilityLabel(credibilityScore),
    comments: article.comment_count,
    reposts: article.repost_count,
    platforms: [article.source_name ?? "Web"],
  };
}

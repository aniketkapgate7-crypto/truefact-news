import "server-only";

export type AssessmentStatus =
  | "supported"
  | "disputed"
  | "mixed"
  | "unverified";

export type ConfidenceLevel = "low" | "medium" | "high";

export type CredibilityRating =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export interface ApiNewsArticle {
  id: number;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  category: string;
  region: string;
  published_at: string;
  evidence_score: number;
  comment_count: number;
  repost_count: number;
}

export interface CredibilityReason {
  code: string;
  message: string;
}

export interface ApiCredibilityAssessment {
  id: number;
  news_article_id: number;

  source_reliability_score: number;
  evidence_quality_score: number;
  corroboration_score: number;
  content_quality_score: number;

  supporting_evidence_count: number;
  contradicting_evidence_count: number;
  independent_source_count: number;
  primary_source_count: number;

  is_evolving: boolean;
  explanation: string;

  credibility_score: number;
  credibility_rating: CredibilityRating;
  assessment_status: AssessmentStatus;
  confidence_level: ConfidenceLevel;

  credibility_reason_codes: string[];
  credibility_reasons: CredibilityReason[];

  method_version: string;
  assessed_at: string;
  updated_at: string;
}

export interface PaginationMetadata {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/** Paginated news-feed response from GET /api/v1/news/ */
export interface NewsFeedResponse {
  items: ApiNewsArticle[];
  pagination: PaginationMetadata;
}

export type NewsSortBy =
  | "published_at"
  | "evidence_score"
  | "comment_count"
  | "repost_count";

export type NewsSortOrder = "asc" | "desc";

export interface NewsFeedOptions {
  page?: number;
  page_size?: number;
  region?: string;
  category?: string;
  sort_by?: NewsSortBy;
  sort_order?: NewsSortOrder;
}

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL is not configured. Add it to apps/web/.env.local.",
    );
  }

  return apiBaseUrl.replace(/\/+$/, "");
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as unknown;

    if (
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
    ) {
      return body.detail;
    }
  } catch {
    // Use the fallback message below when the body is not JSON.
  }

  return `API request failed with status ${response.status}`;
}

async function fetchApiResource<T>(path: string): Promise<T | null> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
}

export function getNewsArticle(
  articleId: number,
): Promise<ApiNewsArticle | null> {
  return fetchApiResource<ApiNewsArticle>(`/api/v1/news/${articleId}`);
}

export function getCredibilityAssessment(
  articleId: number,
): Promise<ApiCredibilityAssessment | null> {
  return fetchApiResource<ApiCredibilityAssessment>(
    `/api/v1/news/${articleId}/credibility-assessment`,
  );
}

/**
 * Fetch a paginated, sorted list of live news articles.
 * Always uses cache: "no-store" so results reflect the current feed.
 */
export async function getNewsFeed(
  options: NewsFeedOptions = {},
): Promise<ApiNewsArticle[]> {
  const {
    page = 1,
    page_size = 30,
    region,
    category,
    sort_by = "published_at",
    sort_order = "desc",
  } = options;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(page_size));
  params.set("sort_by", sort_by);
  params.set("sort_order", sort_order);
  if (region) params.set("region", region);
  if (category) params.set("category", category);

  const path = `/api/v1/news/?${params.toString()}`;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as unknown;

  if (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as NewsFeedResponse).items) &&
    "pagination" in data &&
    typeof (data as NewsFeedResponse).pagination === "object" &&
    (data as NewsFeedResponse).pagination !== null
  ) {
    return (data as NewsFeedResponse).items;
  }

  throw new Error("Invalid API response format for news feed");
}
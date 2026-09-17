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

export type ReviewStatus =
  | "automated"
  | "pending_review"
  | "in_review"
  | "reviewed"
  | "published"
  | "corrected"
  | "retracted";

export type FactCheckVerdict =
  | "true"
  | "mostly_true"
  | "mixed"
  | "misleading"
  | "mostly_false"
  | "false"
  | "unverified";

export interface ApiNewsArticle {
  id: number;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  /** Hero image extracted from the RSS feed; null when unavailable. */
  image_url?: string | null;
  category: string;
  region: string;
  published_at: string;
  evidence_score: number;
  comment_count: number;
  repost_count: number;
  /**
   * Credibility score from the assessment engine (0–100).
   * Null when no assessment has been generated yet.
   */
  credibility_score?: number | null;
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

  // Editorial Review fields
  review_status?: ReviewStatus;
  verdict?: FactCheckVerdict | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  claim?: string | null;
  claimant?: string | null;
  claim_date?: string | null;
  conclusion?: string | null;
  correction_summary?: string | null;
  review_version?: number;
  reviewed_at?: string | null;
  review_published_at?: string | null;
}

export interface EditorialFactCheckItem {
  article_id: number;
  title: string;
  summary: string;
  category: string;
  source_name: string;
  source_url: string;
  image_url?: string | null;
  published_at: string;

  claim: string;
  claimant?: string | null;
  claim_date?: string | null;
  verdict: FactCheckVerdict;
  review_status: ReviewStatus;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  review_published_at?: string | null;
  conclusion?: string | null;
  correction_summary?: string | null;
  review_version: number;
  credibility_score: number;
  supporting_evidence_count: number;
  contradicting_evidence_count: number;
  independent_source_count: number;
  primary_source_count: number;
}

export interface PublishedFactChecksResponse {
  items: EditorialFactCheckItem[];
  total_count: number;
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
  | "repost_count"
  | "credibility_score";

export type NewsSortOrder = "asc" | "desc";

export interface NewsFeedOptions {
  page?: number;
  page_size?: number;
  search?: string;
  region?: string;
  category?: string;
  min_credibility_score?: number;
  sort_by?: NewsSortBy;
  sort_order?: NewsSortOrder;
}

export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    return "http://localhost:8000";
  }

  return apiBaseUrl.replace(/\/+$/, "");
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as unknown;

    if (
      typeof body === "object" &&
      body !== null &&
      "detail" in body
    ) {
      if (typeof body.detail === "string") {
        return body.detail;
      }
      if (Array.isArray(body.detail)) {
        return body.detail
          .map((item) => (typeof item === "object" && item !== null && "msg" in item ? String(item.msg) : String(item)))
          .join("; ");
      }
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

export function getPublishedFactChecks(
  limit = 10,
): Promise<PublishedFactChecksResponse | null> {
  return fetchApiResource<PublishedFactChecksResponse>(
    `/api/v1/fact-checks/published?limit=${limit}`,
  );
}

export function getEditorialFactCheck(
  articleId: number,
): Promise<EditorialFactCheckItem | null> {
  return fetchApiResource<EditorialFactCheckItem>(
    `/api/v1/fact-checks/editorial/${articleId}`,
  );
}

export async function getNewsFeed(
  options: NewsFeedOptions = {},
): Promise<ApiNewsArticle[]> {
  const {
    page = 1,
    page_size = 30,
    search,
    region,
    category,
    min_credibility_score,
    sort_by = "published_at",
    sort_order = "desc",
  } = options;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(page_size));
  params.set("sort_by", sort_by);
  params.set("sort_order", sort_order);
  if (search && search.trim()) {
    params.set("search", search.trim());
  }
  if (region) params.set("region", region);
  if (category) params.set("category", category);
  if (min_credibility_score !== undefined) {
    params.set("min_credibility_score", String(min_credibility_score));
  }

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

export interface ApiUser {
  id: string;
  email?: string | null;
  display_name?: string | null;
  role: "reader" | "reviewer" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAuthenticatedUserProfile(
  token: string,
): Promise<ApiUser | null> {
  if (!token || !token.trim()) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiUser;
  } catch {
    return null;
  }
}

// =====================================================================
// PHASE 2C BILLING & PRODUCTIVITY SCHEMAS AND HELPERS
// =====================================================================

export interface BillingPlanSchema {
  slug: string;
  display_name: string;
  amount_subunits: number;
  currency: string;
  interval: string;
  entitlement_tier: string;
  features: string[];
  subscription_available: boolean;
}

export interface SubscriptionResponse {
  internal_subscription_id: string;
  plan_slug: string;
  local_status: string;
  provider_status?: string | null;
  effective_tier: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  access_until?: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  capabilities: string[];
}

export interface CustomerResponse {
  effective_tier: string;
  subscriptions: SubscriptionResponse[];
  capabilities: string[];
}

export interface SavedStoryResponse {
  id: string;
  user_id: string;
  article_id: number;
  article_title: string;
  article_url: string;
  source_domain?: string | null;
  source_name?: string | null;
  created_at: string;
}

export interface PaginatedSavedStoriesResponse {
  items: SavedStoryResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface WatchlistResponse {
  id: string;
  user_id: string;
  source_domain: string;
  source_name_snapshot: string;
  created_at: string;
}

export interface PaginatedWatchlistsResponse {
  items: WatchlistResponse[];
  total: number;
  limit: number;
  offset: number;
}

export async function getBillingPlans(): Promise<BillingPlanSchema[]> {
  const res = await fetchApiResource<BillingPlanSchema[]>("/api/v1/billing/plans");
  return res || [];
}

export async function getBillingMe(token: string): Promise<CustomerResponse | null> {
  if (!token || !token.trim()) return null;
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/billing/me`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as CustomerResponse;
  } catch {
    return null;
  }
}

export async function getSavedStories(
  token: string,
  limit = 20,
  offset = 0,
): Promise<PaginatedSavedStoriesResponse | null> {
  if (!token || !token.trim()) return null;
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/users/me/saved-stories?limit=${limit}&offset=${offset}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as PaginatedSavedStoriesResponse;
  } catch {
    return null;
  }
}

export async function saveStoryApi(
  token: string,
  articleId: number,
): Promise<SavedStoryResponse | null> {
  if (!token || !token.trim()) return null;
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/users/me/saved-stories/${articleId}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return (await response.json()) as SavedStoryResponse;
}

export async function removeSavedStoryApi(
  token: string,
  articleId: number,
): Promise<boolean> {
  if (!token || !token.trim()) return false;
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/users/me/saved-stories/${articleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    },
  );
  return response.ok;
}

export async function getSourceWatchlists(
  token: string,
  limit = 20,
  offset = 0,
): Promise<PaginatedWatchlistsResponse | null> {
  if (!token || !token.trim()) return null;
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/users/me/source-watchlists?limit=${limit}&offset=${offset}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as PaginatedWatchlistsResponse;
  } catch {
    return null;
  }
}

export async function createSourceWatchlistApi(
  token: string,
  articleId: number,
): Promise<WatchlistResponse | null> {
  if (!token || !token.trim()) return null;
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/users/me/source-watchlists`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ article_id: articleId }),
    },
  );
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return (await response.json()) as WatchlistResponse;
}

export async function removeSourceWatchlistApi(
  token: string,
  watchlistId: string,
): Promise<boolean> {
  if (!token || !token.trim()) return false;
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/users/me/source-watchlists/${watchlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    },
  );
  return response.ok;
}

export interface EditorialReviewUpdatePayload {
  review_status?: ReviewStatus;
  verdict?: FactCheckVerdict | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  claim?: string | null;
  claimant?: string | null;
  claim_date?: string | null;
  conclusion?: string | null;
  correction_summary?: string | null;
}

export async function updateEditorialReviewApi(
  token: string,
  articleId: number,
  updates: EditorialReviewUpdatePayload,
): Promise<ApiCredibilityAssessment> {
  if (!token || !token.trim()) {
    throw new Error("Authentication credentials were not provided");
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/editorial/review/${articleId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(updates),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as ApiCredibilityAssessment;
}
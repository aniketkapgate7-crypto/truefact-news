import type { ApiNewsFeedResponse, ApiNewsArticle } from "@/types/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function getBase(): string {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  return API_BASE_URL;
}

export async function fetchNewsFeed(
  signal?: AbortSignal,
  page = 1,
  pageSize = 20,
  minCredibilityScore?: number,
  sortBy = "published_at",
  sortOrder: "asc" | "desc" = "desc",
): Promise<ApiNewsFeedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (minCredibilityScore !== undefined) {
    params.set("min_credibility_score", String(minCredibilityScore));
  }

  const url = `${getBase()}/api/v1/news/?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`News request failed with status ${response.status}.`);
  }

  return (await response.json()) as ApiNewsFeedResponse;
}

export async function fetchArticle(
  id: string,
  signal?: AbortSignal,
): Promise<ApiNewsArticle> {
  const response = await fetch(`${getBase()}/api/v1/news/${id}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Article request failed with status ${response.status}.`);
  }

  return (await response.json()) as ApiNewsArticle;
}

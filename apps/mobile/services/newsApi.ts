import type { ApiNewsFeedResponse } from "@/types/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export async function fetchNewsFeed(
  signal?: AbortSignal,
): Promise<ApiNewsFeedResponse> {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/news/`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`News request failed with status ${response.status}.`);
  }

  return (await response.json()) as ApiNewsFeedResponse;
}

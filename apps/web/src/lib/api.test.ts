import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBillingPlans,
  getBillingMe,
  getSavedStories,
  createSourceWatchlistApi,
  getNewsFeed,
} from "./api";

describe("Web API Client Helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getBillingPlans fetches and returns available plan schemas", async () => {
    const mockPlans = [
      {
        slug: "pro_monthly",
        display_name: "TrueFact Pro (Monthly)",
        amount_subunits: 0,
        currency: "INR",
        interval: "monthly",
        entitlement_tier: "pro",
        features: ["saved_stories", "source_watchlists"],
        subscription_available: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPlans,
    } as unknown as Response);

    const result = await getBillingPlans();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("pro_monthly");
    expect(result[0].subscription_available).toBe(true);
  });

  it("getBillingMe passes auth token and returns customer response", async () => {
    const mockCustomer = {
      effective_tier: "pro",
      subscriptions: [
        {
          internal_subscription_id: "sub-123",
          plan_slug: "pro_monthly",
          local_status: "active",
          effective_tier: "pro",
          cancel_at_period_end: false,
          created_at: "2026-08-29T12:00:00Z",
          updated_at: "2026-08-29T12:00:00Z",
          capabilities: ["saved_stories", "source_watchlists"],
        },
      ],
      capabilities: ["saved_stories", "source_watchlists"],
    };

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      expect(url).toContain("/api/v1/billing/me");
      expect(opts.headers.Authorization).toBe("Bearer valid_test_token");
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockCustomer,
      } as unknown as Response);
    });

    const result = await getBillingMe("valid_test_token");
    expect(result?.effective_tier).toBe("pro");
    expect(result?.capabilities).toContain("source_watchlists");
  });

  it("getBillingMe returns null when token is missing or empty", async () => {
    const result = await getBillingMe("");
    expect(result).toBeNull();
  });

  it("getSavedStories fetches paginated saved stories with token", async () => {
    const mockSaved = {
      items: [
        {
          id: "story-uuid-1",
          user_id: "user-uuid-1",
          article_id: 101,
          article_title: "Test Article Title",
          article_url: "https://news.example.com/story-101",
          source_domain: "news.example.com",
          source_name: "Example News",
          created_at: "2026-08-29T12:00:00Z",
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSaved,
    } as unknown as Response);

    const res = await getSavedStories("valid_token");
    expect(res?.total).toBe(1);
    expect(res?.items[0].article_id).toBe(101);
  });

  it("createSourceWatchlistApi posts article_id and returns WatchlistResponse", async () => {
    const mockWatchlist = {
      id: "w-uuid-1",
      user_id: "user-uuid-1",
      source_domain: "news.example.com",
      source_name_snapshot: "Example News",
      created_at: "2026-08-29T12:00:00Z",
    };

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      expect(url).toContain("/api/v1/users/me/source-watchlists");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toEqual({ article_id: 101 });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockWatchlist,
      } as unknown as Response);
    });

    const res = await createSourceWatchlistApi("valid_token", 101);
    expect(res?.source_domain).toBe("news.example.com");
  });

  it("getNewsFeed serializes a non-empty search value", async () => {
    const mockArticlesResponse = {
      items: [
        {
          id: 1,
          title: "NASA Discovers New Exoplanet",
          summary: "Exoplanet discovery confirmed",
          source_name: "NASA",
          source_url: "https://nasa.gov/news/1",
          category: "Science",
          region: "Global",
          published_at: "2026-08-20T12:00:00Z",
          evidence_score: 95,
          comment_count: 0,
          repost_count: 0,
        },
      ],
      pagination: {
        page: 1,
        page_size: 30,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
    };

    let requestedUrl = "";
    global.fetch = vi.fn().mockImplementation((url) => {
      requestedUrl = String(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockArticlesResponse,
      } as unknown as Response);
    });

    const result = await getNewsFeed({ search: "climate crisis" });
    expect(requestedUrl).toContain("search=climate+crisis");
    expect(result).toHaveLength(1);
  });

  it("getNewsFeed omits an empty search value", async () => {
    const mockArticlesResponse = {
      items: [],
      pagination: {
        page: 1,
        page_size: 30,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
    };

    let requestedUrl = "";
    global.fetch = vi.fn().mockImplementation((url) => {
      requestedUrl = String(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockArticlesResponse,
      } as unknown as Response);
    });

    await getNewsFeed({ search: "   " });
    expect(requestedUrl).not.toContain("search=");

    await getNewsFeed({ search: "" });
    expect(requestedUrl).not.toContain("search=");

    await getNewsFeed({});
    expect(requestedUrl).not.toContain("search=");
  });

  it("verify page uses the canonical API base variable", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const verifyPagePath = path.resolve(__dirname, "../app/verify/page.tsx");
    const verifySource = fs.readFileSync(verifyPagePath, "utf-8");

    // Must not use NEXT_PUBLIC_API_URL
    expect(verifySource).not.toContain("NEXT_PUBLIC_API_URL");
    // Must use getApiBaseUrl which resolves NEXT_PUBLIC_API_BASE_URL
    expect(verifySource).toContain("getApiBaseUrl");

    // Check that getApiBaseUrl correctly uses NEXT_PUBLIC_API_BASE_URL
    const orig = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      process.env.NEXT_PUBLIC_API_BASE_URL = "https://canonical-api.example.com/";
      const { getApiBaseUrl } = await import("./api");
      expect(getApiBaseUrl()).toBe("https://canonical-api.example.com");
    } finally {
      process.env.NEXT_PUBLIC_API_BASE_URL = orig;
    }
  });
});

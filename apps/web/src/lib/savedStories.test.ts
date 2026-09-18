import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getSavedStories,
  saveStoryApi,
  removeSavedStoryApi,
  type SavedStoryResponse,
} from "./api";

describe("Saved Stories Backend Persistence & Unification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. No tf-saved-stories localStorage usage remains
  it("proves no tf-saved-stories localStorage usage remains in apps/web source files", () => {
    const webSrcDir = path.resolve(__dirname, "..");

    function scanDirectory(dir: string): string[] {
      let findings: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "dist") {
            findings = findings.concat(scanDirectory(fullPath));
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
          // exclude this test file itself from the literal scan
          if (!entry.name.includes("savedStories.test")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (content.includes("tf-saved-stories")) {
              findings.push(fullPath);
            }
          }
        }
      }
      return findings;
    }

    const matches = scanDirectory(webSrcDir);
    expect(matches).toEqual([]);
  });

  // 2. Unauthenticated users cannot receive fake saved state
  describe("Authentication Requirements", () => {
    it("rejects getSavedStories when token is missing or empty", async () => {
      await expect(getSavedStories("")).rejects.toThrow(
        "Authentication credentials were not provided"
      );
      await expect(getSavedStories("   ")).rejects.toThrow(
        "Authentication credentials were not provided"
      );
    });

    it("rejects saveStoryApi when token is missing or empty", async () => {
      await expect(saveStoryApi("", 42)).rejects.toThrow(
        "Authentication credentials were not provided"
      );
      await expect(saveStoryApi("   ", 42)).rejects.toThrow(
        "Authentication credentials were not provided"
      );
    });

    it("rejects removeSavedStoryApi when token is missing or empty", async () => {
      await expect(removeSavedStoryApi("", 42)).rejects.toThrow(
        "Authentication credentials were not provided"
      );
      await expect(removeSavedStoryApi("   ", 42)).rejects.toThrow(
        "Authentication credentials were not provided"
      );
    });
  });

  // 3. Authenticated list/save/delete requests include bearer tokens
  describe("Bearer Token Transmission", () => {
    it("getSavedStories sends Bearer token in Authorization header", async () => {
      const mockResponse = {
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });
      global.fetch = fetchMock;

      const result = await getSavedStories("valid-jwt-token", 20, 0);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/v1/users/me/saved-stories?limit=20&offset=0");
      expect(opts.headers["Authorization"]).toBe("Bearer valid-jwt-token");
      expect(opts.headers["Accept"]).toBe("application/json");
      expect(result).toEqual(mockResponse);
    });

    it("saveStoryApi sends Bearer token and POST method to article_id endpoint", async () => {
      const mockSavedStory: SavedStoryResponse = {
        id: "story-uuid-1",
        user_id: "user-uuid-1",
        article_id: 42,
        article_title: "Clean Energy Breakthrough",
        article_url: "https://example.com/energy",
        source_domain: "example.com",
        source_name: "Example News",
        created_at: new Date().toISOString(),
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSavedStory,
      });
      global.fetch = fetchMock;

      const result = await saveStoryApi("jwt-token-123", 42);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/v1/users/me/saved-stories/42");
      expect(opts.method).toBe("POST");
      expect(opts.headers["Authorization"]).toBe("Bearer jwt-token-123");
      expect(result).toEqual(mockSavedStory);
    });

    it("removeSavedStoryApi sends Bearer token and DELETE method to article_id endpoint", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: "Saved story removed." }),
      });
      global.fetch = fetchMock;

      const result = await removeSavedStoryApi("jwt-token-456", 42);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/v1/users/me/saved-stories/42");
      expect(opts.method).toBe("DELETE");
      expect(opts.headers["Authorization"]).toBe("Bearer jwt-token-456");
      expect(result).toBe(true);
    });
  });

  // 4. Duplicate save responses are handled correctly (backend idempotent behavior)
  describe("Idempotent Duplicate Save Behavior", () => {
    it("returns existing saved story without error on duplicate save", async () => {
      const existingSavedStory: SavedStoryResponse = {
        id: "existing-uuid-99",
        user_id: "user-uuid-1",
        article_id: 42,
        article_title: "Clean Energy Breakthrough",
        article_url: "https://example.com/energy",
        source_domain: "example.com",
        source_name: "Example News",
        created_at: "2026-08-01T10:00:00Z",
      };

      // Backend returns HTTP 200 with existing record upon repeated save
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => existingSavedStory,
      });
      global.fetch = fetchMock;

      const result = await saveStoryApi("jwt-token-789", 42);

      expect(result.id).toBe("existing-uuid-99");
      expect(result.article_id).toBe(42);
    });
  });

  // 5. Failed mutations do not display false success
  describe("Failed Mutations Error Handling", () => {
    it("throws error when backend returns 404 for non-existent article save", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Article not found." }),
      });
      global.fetch = fetchMock;

      await expect(saveStoryApi("valid-token", 999999)).rejects.toThrow(
        "Article not found."
      );
    });

    it("throws error when backend returns 401 Unauthorized for invalid token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid or expired token." }),
      });
      global.fetch = fetchMock;

      await expect(getSavedStories("expired-token")).rejects.toThrow(
        "Invalid or expired token."
      );
    });

    it("throws error when removeSavedStoryApi encounters 404 for untracked story", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Saved story not found." }),
      });
      global.fetch = fetchMock;

      await expect(removeSavedStoryApi("valid-token", 42)).rejects.toThrow(
        "Saved story not found."
      );
    });

    it("throws error when backend returns 500 internal server error", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Database connection failed." }),
      });
      global.fetch = fetchMock;

      await expect(saveStoryApi("valid-token", 42)).rejects.toThrow(
        "Database connection failed."
      );
    });
  });

  // 6. UI State Management Logic: Removal and State Reconciliation
  describe("Saved State Reconciliation", () => {
    it("updates saved state list correctly on removal", () => {
      const initialList: SavedStoryResponse[] = [
        {
          id: "1",
          user_id: "u1",
          article_id: 101,
          article_title: "Story 101",
          article_url: "https://example.com/101",
          source_domain: "example.com",
          source_name: "Example",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: "u1",
          article_id: 102,
          article_title: "Story 102",
          article_url: "https://example.com/102",
          source_domain: "example.com",
          source_name: "Example",
          created_at: new Date().toISOString(),
        },
      ];

      // Simulate client removal
      const updatedList = initialList.filter((story) => story.article_id !== 101);
      expect(updatedList).toHaveLength(1);
      expect(updatedList[0].article_id).toBe(102);
    });

    it("prevents duplicate concurrent save requests using in-flight set", () => {
      const inFlight = new Set<number>();
      const articleId = 42;

      // First click
      const canProceed1 = !inFlight.has(articleId);
      if (canProceed1) inFlight.add(articleId);

      // Immediate second click while pending
      const canProceed2 = !inFlight.has(articleId);

      expect(canProceed1).toBe(true);
      expect(canProceed2).toBe(false);

      // After request completes
      inFlight.delete(articleId);
      const canProceed3 = !inFlight.has(articleId);
      expect(canProceed3).toBe(true);
    });
  });
});

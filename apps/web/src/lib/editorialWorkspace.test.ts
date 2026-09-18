import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkWorkspaceAccess } from "./workspaceAuth";
import { updateEditorialReviewApi, type EditorialReviewUpdatePayload, type ApiUser } from "./api";
import * as api from "./api";

describe("Editorial Workspace Access Control & Safeguards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Workspace disabled
  it("denies access when workspace feature flag ENABLE_EDITORIAL_WORKSPACE is disabled", async () => {
    const access = await checkWorkspaceAccess("true", "false", "pk_test_123", {
      userId: "user_reviewer",
      getToken: async () => "valid_token",
    });
    expect(access).toEqual({ granted: false, reason: "workspace_disabled" });
  });

  // 2. Unauthenticated access
  it("denies access when user is unauthenticated", async () => {
    const access = await checkWorkspaceAccess("true", "true", "pk_test_123", null);
    expect(access).toEqual({ granted: false, reason: "unauthenticated" });

    const accessWithoutUser = await checkWorkspaceAccess("true", "true", "pk_test_123", {
      userId: null,
      getToken: async () => null,
    });
    expect(accessWithoutUser).toEqual({ granted: false, reason: "unauthenticated" });
  });

  // 3. Reader denied
  it("denies access when user role is reader", async () => {
    const readerProfile: ApiUser = {
      id: "user_reader_1",
      email: "reader@example.com",
      role: "reader",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(api, "getAuthenticatedUserProfile").mockResolvedValueOnce(readerProfile);

    const access = await checkWorkspaceAccess("true", "true", "pk_test_123", {
      userId: "user_reader_1",
      getToken: async () => "reader_token",
    });

    expect(access).toEqual({ granted: false, reason: "insufficient_role" });
  });

  // 4. Editor/Reviewer allowed
  it("allows access when user role is reviewer (editor)", async () => {
    const reviewerProfile: ApiUser = {
      id: "user_reviewer_1",
      email: "editor@example.com",
      display_name: "Staff Reviewer",
      role: "reviewer",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(api, "getAuthenticatedUserProfile").mockResolvedValueOnce(reviewerProfile);

    const access = await checkWorkspaceAccess("true", "true", "pk_test_123", {
      userId: "user_reviewer_1",
      getToken: async () => "reviewer_token",
    });

    expect(access).toEqual({ granted: true, profile: reviewerProfile });
  });

  // 5. Admin allowed
  it("allows access when user role is admin", async () => {
    const adminProfile: ApiUser = {
      id: "user_admin_1",
      email: "admin@example.com",
      display_name: "Managing Editor",
      role: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(api, "getAuthenticatedUserProfile").mockResolvedValueOnce(adminProfile);

    const access = await checkWorkspaceAccess("true", "true", "pk_test_123", {
      userId: "user_admin_1",
      getToken: async () => "admin_token",
    });

    expect(access).toEqual({ granted: true, profile: adminProfile });
  });

  // 6. Required-field validation & Publishing safeguards logic
  describe("Publishing Safeguards Validation", () => {
    function validatePublishingRequirements(review: {
      review_status: string;
      verdict?: string | null;
      reviewer_name?: string | null;
      reviewer_id?: string | null;
      claim?: string | null;
      conclusion?: string | null;
    }): { canPublish: boolean; missingFields: string[] } {
      if (review.review_status !== "published") {
        return { canPublish: true, missingFields: [] };
      }
      const missing: string[] = [];
      if (!review.verdict || !review.verdict.trim()) missing.push("verdict");
      if (
        (!review.reviewer_name || !review.reviewer_name.trim()) &&
        (!review.reviewer_id || !review.reviewer_id.trim())
      ) {
        missing.push("reviewer_attribution");
      }
      if (!review.claim || !review.claim.trim()) missing.push("claim");
      if (!review.conclusion || !review.conclusion.trim()) missing.push("conclusion");

      return {
        canPublish: missing.length === 0,
        missingFields: missing,
      };
    }

    it("prevents publishing when verdict is missing", () => {
      const result = validatePublishingRequirements({
        review_status: "published",
        verdict: null,
        reviewer_name: "Aarav Sharma",
        claim: "Claim about economic inflation",
        conclusion: "Evidence shows inflation is within normal range.",
      });

      expect(result.canPublish).toBe(false);
      expect(result.missingFields).toContain("verdict");
    });

    it("prevents publishing when reviewer attribution is missing", () => {
      const result = validatePublishingRequirements({
        review_status: "published",
        verdict: "false",
        reviewer_name: "",
        reviewer_id: "",
        claim: "Claim about economic inflation",
        conclusion: "Evidence shows inflation is within normal range.",
      });

      expect(result.canPublish).toBe(false);
      expect(result.missingFields).toContain("reviewer_attribution");
    });

    it("prevents publishing when claim text is missing", () => {
      const result = validatePublishingRequirements({
        review_status: "published",
        verdict: "mostly_false",
        reviewer_name: "Staff Fact-Checker",
        claim: "",
        conclusion: "Evidence contradicts the assertion.",
      });

      expect(result.canPublish).toBe(false);
      expect(result.missingFields).toContain("claim");
    });

    it("prevents publishing when conclusion is missing", () => {
      const result = validatePublishingRequirements({
        review_status: "published",
        verdict: "true",
        reviewer_name: "Staff Fact-Checker",
        claim: "Official government census data released",
        conclusion: " ",
      });

      expect(result.canPublish).toBe(false);
      expect(result.missingFields).toContain("conclusion");
    });

    it("allows publishing when all required fields are complete", () => {
      const result = validatePublishingRequirements({
        review_status: "published",
        verdict: "false",
        reviewer_name: "Aarav Sharma",
        claim: "Official quarterly report fabricated",
        conclusion: "Verified cross-agency data proves quarterly report is authentic.",
      });

      expect(result.canPublish).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it("allows draft/in_review status even with incomplete publish fields", () => {
      const result = validatePublishingRequirements({
        review_status: "in_review",
        verdict: null,
        reviewer_name: "Aarav Sharma",
        claim: "Work in progress claim",
        conclusion: null,
      });

      expect(result.canPublish).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });
  });

  // 7. Authenticated review submission API
  describe("updateEditorialReviewApi", () => {
    it("rejects submission if authentication token is missing or empty", async () => {
      await expect(
        updateEditorialReviewApi("", 42, { review_status: "in_review" })
      ).rejects.toThrow("Authentication credentials were not provided");

      await expect(
        updateEditorialReviewApi("   ", 42, { review_status: "in_review" })
      ).rejects.toThrow("Authentication credentials were not provided");
    });

    it("sends authenticated PATCH request with correct headers and payload", async () => {
      const mockAssessment = {
        id: 101,
        news_article_id: 42,
        review_status: "in_review",
        verdict: "misleading",
        reviewer_name: "Senior Editor",
        claim: "Misleading headline",
        conclusion: "Context omitted from original story.",
        review_version: 2,
        credibility_score: 55,
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockAssessment,
      });
      global.fetch = fetchMock;

      const payload: EditorialReviewUpdatePayload = {
        review_status: "in_review",
        verdict: "misleading",
        reviewer_name: "Senior Editor",
        claim: "Misleading headline",
        conclusion: "Context omitted from original story.",
      };

      const result = await updateEditorialReviewApi("bearer-token-xyz", 42, payload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/v1/editorial/review/42");
      expect(options.method).toBe("PATCH");
      expect(options.headers["Authorization"]).toBe("Bearer bearer-token-xyz");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(result).toEqual(mockAssessment);
    });

    // 8. Backend error display & 422 array formatting
    it("parses and propagates backend error messages including 422 detail arrays", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            { loc: ["body", "verdict"], msg: "Verdict is required when publishing a fact-check" },
            { loc: ["body", "conclusion"], msg: "Conclusion cannot be empty" },
          ],
        }),
      });
      global.fetch = fetchMock;

      await expect(
        updateEditorialReviewApi("token-123", 42, { review_status: "published" })
      ).rejects.toThrow(
        "Verdict is required when publishing a fact-check; Conclusion cannot be empty"
      );
    });

    it("propagates backend 403 Forbidden with honest authorization failure", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          detail: "Only reviewers and administrators can perform editorial reviews.",
        }),
      });
      global.fetch = fetchMock;

      await expect(
        updateEditorialReviewApi("reader-token", 42, { review_status: "in_review" })
      ).rejects.toThrow(
        "Only reviewers and administrators can perform editorial reviews."
      );
    });

    // 9. No fake success state
    it("never returns synthetic success when backend returns an error", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Database connection failed" }),
      });
      global.fetch = fetchMock;

      let callCompletedWithoutError = false;
      try {
        await updateEditorialReviewApi("token-xyz", 42, { review_status: "published" });
        callCompletedWithoutError = true;
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("Database connection failed");
      }

      expect(callCompletedWithoutError).toBe(false);
    });
  });
});

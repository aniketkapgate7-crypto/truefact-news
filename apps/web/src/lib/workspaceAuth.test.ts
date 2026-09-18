import { describe, it, expect, vi } from "vitest";
import { checkWorkspaceAccess } from "./workspaceAuth";
import * as api from "./api";
import type { ApiUser } from "./api";

vi.mock("./api", () => ({
  getAuthenticatedUserProfile: vi.fn(),
}));

describe("checkWorkspaceAccess", () => {
  it("rejects when workspace is disabled", async () => {
    const res = await checkWorkspaceAccess("true", "false", "key", null);
    expect(res).toEqual({ granted: false, reason: "workspace_disabled" });
  });

  it("rejects when clerk key is missing", async () => {
    const res = await checkWorkspaceAccess("true", "true", "", null);
    expect(res).toEqual({ granted: false, reason: "clerk_not_configured" });
  });

  it("rejects when auth is disabled", async () => {
    const res = await checkWorkspaceAccess("false", "true", "key", null);
    expect(res).toEqual({ granted: false, reason: "auth_disabled" });
  });

  it("rejects when unauthenticated", async () => {
    const res = await checkWorkspaceAccess("true", "true", "key", null);
    expect(res).toEqual({ granted: false, reason: "unauthenticated" });

    const res2 = await checkWorkspaceAccess("true", "true", "key", { userId: null, getToken: async () => "token" });
    expect(res2).toEqual({ granted: false, reason: "unauthenticated" });
  });

  it("rejects when missing token", async () => {
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => null });
    expect(res).toEqual({ granted: false, reason: "missing_token" });
  });

  it("rejects when profile role is reader", async () => {
    vi.mocked(api.getAuthenticatedUserProfile).mockResolvedValueOnce({
      id: "u", email: "e", role: "reader", is_active: true
    } as unknown as ApiUser);
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: false, reason: "insufficient_role" });
  });

  it("rejects when profile is inactive", async () => {
    vi.mocked(api.getAuthenticatedUserProfile).mockResolvedValueOnce({
      id: "u", email: "e", role: "reviewer", is_active: false
    } as unknown as ApiUser);
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: false, reason: "insufficient_role" });
  });

  it("allows when profile is reviewer and active", async () => {
    const profile = { id: "u", email: "e", role: "reviewer", is_active: true };
    vi.mocked(api.getAuthenticatedUserProfile).mockResolvedValueOnce(profile as unknown as ApiUser);
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: true, profile });
  });

  it("allows when profile is admin and active", async () => {
    const profile = { id: "u", email: "e", role: "admin", is_active: true };
    vi.mocked(api.getAuthenticatedUserProfile).mockResolvedValueOnce(profile as unknown as ApiUser);
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: true, profile });
  });

  it("rejects when backend is unavailable", async () => {
    vi.mocked(api.getAuthenticatedUserProfile).mockRejectedValueOnce(new Error("Network error"));
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: false, reason: "backend_error" });
  });

  it("rejects when backend response is malformed", async () => {
    // Return a malformed profile object that doesn't match UserProfile interface
    vi.mocked(api.getAuthenticatedUserProfile).mockResolvedValueOnce({ invalid: "data" } as unknown as ApiUser);
    const res = await checkWorkspaceAccess("true", "true", "key", { userId: "user", getToken: async () => "t" });
    expect(res).toEqual({ granted: false, reason: "insufficient_role" });
  });

  it("rejects NEXT_PUBLIC bypass when server flag is false", async () => {
    // If NEXT_PUBLIC_ENABLE_EDITORIAL_WORKSPACE is set (which is obsolete, but let's simulate the environment)
    // and the server flag ENABLE_EDITORIAL_WORKSPACE is false, it should reject.
    process.env.NEXT_PUBLIC_ENABLE_EDITORIAL_WORKSPACE = "true";
    const res = await checkWorkspaceAccess("true", "false", "key", null);
    expect(res).toEqual({ granted: false, reason: "workspace_disabled" });
    delete process.env.NEXT_PUBLIC_ENABLE_EDITORIAL_WORKSPACE;
  });
});

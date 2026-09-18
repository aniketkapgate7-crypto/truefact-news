import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isAuthEnabled } from "./authConfig";
import { disabledAuthValue } from "@/components/auth/AuthContext";
import { checkWorkspaceAccess } from "./workspaceAuth";

describe("Authentication & Build Configuration Invariants", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // 1. /verify and other public routes do not rely on deprecated SignedIn/SignedOut
  it("proves that no file in apps/web/src imports or uses deprecated <SignedIn> or <SignedOut>", () => {
    const srcDir = path.resolve(__dirname, "..");

    function scanFiles(dir: string): string[] {
      let violations: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "dist") {
            violations = violations.concat(scanFiles(fullPath));
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          // exclude this test file itself from the literal scan
          if (!entry.name.includes("authConfiguration.test")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const hasSignedOutTag = /<\s*SignedOut\b/.test(content);
            const hasSignedInTag = /<\s*SignedIn\b/.test(content);
            const hasClerkImport = /import\s+[^;]*\b(SignedIn|SignedOut)\b[^;]*from\s+['"]@clerk\/nextjs['"]/.test(content);

            if (hasSignedOutTag || hasSignedInTag || hasClerkImport) {
              violations.push(fullPath);
            }
          }
        }
      }
      return violations;
    }

    const matches = scanFiles(srcDir);
    expect(matches).toEqual([]);
  });

  // 2. /verify page source renders public interface without auth gate
  it("ensures /verify page is completely independent of Clerk auth gate", () => {
    const verifyPagePath = path.resolve(__dirname, "../app/verify/page.tsx");
    const content = fs.readFileSync(verifyPagePath, "utf-8");

    expect(content).not.toContain("@clerk");
    expect(content).not.toContain("useAuth");
    expect(content).not.toContain("SignedOut");
    expect(content).not.toContain("SignedIn");
    expect(content).toContain("Public Claim Verification Interface");
  });

  // 3. auth-disabled configuration does not instantiate ClerkProvider
  describe("isAuthEnabled gate", () => {
    it("evaluates to false when AUTH_ENABLED is false even if publishable key is present", () => {
      process.env.AUTH_ENABLED = "false";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_placeholder";
      expect(isAuthEnabled()).toBe(false);
    });

    it("evaluates to false when AUTH_ENABLED is unset", () => {
      delete process.env.AUTH_ENABLED;
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
      expect(isAuthEnabled()).toBe(false);
    });

    it("evaluates to false when publishable key is empty or whitespace", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "   ";
      expect(isAuthEnabled()).toBe(false);

      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      expect(isAuthEnabled()).toBe(false);
    });

    it("evaluates to true only when AUTH_ENABLED is 'true' AND valid key exists", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_real_key_123";
      expect(isAuthEnabled()).toBe(true);
    });
  });

  // 4. disabledAuthValue provides safe fallback without Clerk
  it("provides safe disabledAuthValue with null credentials and loaded status", async () => {
    expect(disabledAuthValue.isAuthEnabled).toBe(false);
    expect(disabledAuthValue.isLoaded).toBe(true);
    expect(disabledAuthValue.isSignedIn).toBe(false);
    expect(disabledAuthValue.userId).toBeNull();

    const token = await disabledAuthValue.getToken();
    expect(token).toBeNull();
  });

  // 5. auth-disabled CI build does not require a publishable key
  it("ensures web-ci.yml does not inject fake or placeholder Clerk keys in production build step", () => {
    const ciWorkflowPath = path.resolve(__dirname, "../../../../.github/workflows/web-ci.yml");
    const content = fs.readFileSync(ciWorkflowPath, "utf-8");

    expect(content).not.toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(content).not.toContain("pk_test_placeholder");
    expect(content).toContain('AUTH_ENABLED: "false"');
  });

  // 6. protected save/editorial controls remain unavailable without auth
  describe("Protected Controls Fail Closed Without Auth", () => {
    it("workspace access is denied when auth is disabled", async () => {
      const access = await checkWorkspaceAccess("false", "true", "pk_test_123", {
        userId: "user_reviewer_1",
        getToken: async () => "token",
      });

      expect(access).toEqual({ granted: false, reason: "auth_disabled" });
    });

    it("workspace access is denied when Clerk key is missing", async () => {
      const access = await checkWorkspaceAccess("true", "true", "", {
        userId: "user_reviewer_1",
        getToken: async () => "token",
      });

      expect(access).toEqual({ granted: false, reason: "clerk_not_configured" });
    });
  });
});

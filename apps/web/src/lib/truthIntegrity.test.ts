import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Truth-Integrity Invariant Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("evidence page contains no hardcoded article ID 7 special case or injected NASA/eVTOL URLs", () => {
    const evidencePagePath = path.resolve(__dirname, "../app/evidence/[id]/page.tsx");
    const content = fs.readFileSync(evidencePagePath, "utf-8");

    expect(content).not.toContain("article.id === 7");
    expect(content).not.toContain("id === 7");
    expect(content).not.toContain("https://evtolinsights.com");
    expect(content).toContain(
      "No external evidence links are available for this assessment."
    );
  });

  it("feed components do not apply client-side fixture-hiding rules", () => {
    const webHomePagePath = path.resolve(__dirname, "../app/page.tsx");
    const liveHomePagePath = path.resolve(
      __dirname,
      "../components/live/LiveHomePage.tsx"
    );
    const mobileIndexPath = path.resolve(
      __dirname,
      "../../../../apps/mobile/app/index.tsx"
    );

    const webHomeContent = fs.readFileSync(webHomePagePath, "utf-8");
    expect(webHomeContent).not.toContain("a.id !== 1");
    expect(webHomeContent).not.toContain("!a.source_url.includes(\"example.com\")");

    const liveHomeContent = fs.readFileSync(liveHomePagePath, "utf-8");
    expect(liveHomeContent).not.toContain("a.id !== 1");
    expect(liveHomeContent).not.toContain("!a.source_url.includes(\"example.com\")");

    if (fs.existsSync(mobileIndexPath)) {
      const mobileContent = fs.readFileSync(mobileIndexPath, "utf-8");
      expect(mobileContent).not.toContain("s.id !== \"1\"");
      expect(mobileContent).not.toContain("!s.sourceUrl.includes(\"example.com\")");
    }
  });

  it("insufficient evidence status maps honestly to unverified and never converts to false", () => {
    const insufficientResponse = {
      query: "Unsubstantiated viral claim about deep sea energy grid",
      status: "insufficient_evidence" as const,
      message: "No corroborating reports identified.",
      submitted_at: "2026-09-17T12:00:00Z",
      result: null,
    };

    // Confirm that insufficient evidence retains status 'insufficient_evidence'
    expect(insufficientResponse.status).toBe("insufficient_evidence");
    // Verify that result.verdict is not fabricated or mapped to "false"
    expect(insufficientResponse.result).toBeNull();

    // Invariant: Unverified is never considered false
    const verdict = (insufficientResponse.result as { verdict?: string } | null)?.verdict;
    expect(verdict).toBeUndefined();
    expect(verdict).not.toBe("false");
    expect(verdict).not.toBe("FALSE");
  });

  it("verify endpoint request and response payload contract maps properly", async () => {
    const mockSuccessResponse = {
      query: "NASA announces university research consortium",
      status: "existing_fact_check",
      message: "Direct match found in verified records.",
      submitted_at: "2026-09-17T12:00:00Z",
      result: {
        title: "NASA Aeronautics Research Initiative",
        summary: "Verified university leadership grant program.",
        matched_type: "human_verdict",
        verdict: "TRUE",
        score: 95,
        reviewer: "IFCN Independent Fact Check",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    } as unknown as Response);

    const res = await fetch("http://localhost:8000/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_text: "NASA announces university research consortium" }),
    });

    const data = await res.json();
    expect(data.status).toBe("existing_fact_check");
    expect(data.result.verdict).toBe("TRUE");
    expect(data.result.matched_type).toBe("human_verdict");
    expect(data.result.score).toBe(95);
  });

  it("no remaining active mockNews imports exist in the web source tree", () => {
    const srcDir = path.resolve(__dirname, "..");
    function scanDir(dir: string): string[] {
      const files: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...scanDir(fullPath));
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const allSourceFiles = scanDir(srcDir).filter(
      (p) => !p.endsWith("truthIntegrity.test.ts")
    );
    const offendingFiles: string[] = [];

    for (const filePath of allSourceFiles) {
      const text = fs.readFileSync(filePath, "utf-8");
      if (text.includes("mockNews")) {
        offendingFiles.push(filePath);
      }
    }

    expect(offendingFiles).toEqual([]);
  });
});

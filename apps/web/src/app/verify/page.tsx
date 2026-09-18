"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getApiBaseUrl } from "@/lib/api";

interface VerificationResponse {
  query: string;
  status:
    | "existing_fact_check"
    | "automated_assessment_available"
    | "submitted_for_review"
    | "insufficient_evidence"
    | "verification_unavailable";
  message: string;
  submitted_at: string;
  result?: {
    title: string;
    summary: string;
    matched_type: string;
    url?: string | null;
    score?: number | null;
    verdict?: string | null;
    reviewer?: string | null;
    evidence_count?: number | null;
    extra?: Record<string, unknown> | null;
  } | null;
}

function VerifyClaimContent() {
  const searchParams = useSearchParams();
  const initialClaim = searchParams.get("claim") || "";

  const [claimText, setClaimText] = useState(initialClaim);
  const [articleUrl, setArticleUrl] = useState("");
  const [supportingContext, setSupportingContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<VerificationResponse | null>(null);

  useEffect(() => {
    if (initialClaim) {
      setClaimText(initialClaim);
    }
  }, [initialClaim]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || claimText.trim().length < 3) {
      setErrorMessage("Please enter a claim containing at least 3 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResponse(null);

    try {
      const apiBase = getApiBaseUrl();

      const res = await fetch(`${apiBase}/api/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_text: claimText.trim(),
          article_url: articleUrl.trim() ? articleUrl.trim() : null,
          supporting_context: supportingContext.trim() ? supportingContext.trim() : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error ${res.status}`);
      }

      const data: VerificationResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reach verification endpoint. Please verify backend service status.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5242A]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Public Claim Verification Interface
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Verify a News Claim or Social Post
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Submit any headline, viral statement, or link. TrueFact searches its existing assessments and configured fact-check sources.
        </p>
      </div>

      {/* Claim Submission Form */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Claim Text */}
          <div>
            <label htmlFor="claim-input" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Claim or Statement to Verify <span className="text-[#E5242A]">*</span>
            </label>
            <textarea
              id="claim-input"
              rows={3}
              required
              placeholder="e.g. Government announced a 50% waiver on electricity bills starting next month..."
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5242A]"
            />
          </div>

          {/* Optional Source URL */}
          <div>
            <label htmlFor="url-input" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Article or Social Link <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="url-input"
              type="url"
              placeholder="https://example.com/news-story..."
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5242A]"
            />
          </div>

          {/* Optional Context */}
          <div>
            <label htmlFor="context-input" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Supporting Context <span className="text-gray-400 font-normal">(Where did you see this?)</span>
            </label>
            <input
              id="context-input"
              type="text"
              placeholder="e.g. Circulated on WhatsApp family group, YouTube video caption..."
              value={supportingContext}
              onChange={(e) => setSupportingContext(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5242A]"
            />
          </div>

          {/* Error feedback */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#E5242A] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#c9181e] disabled:opacity-50 transition-all min-h-[46px]"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Checking TrueFact Databases...</span>
              </>
            ) : (
              <>
                <span>⚡ Verify Claim</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Server Response Card ── */}
      {response && (
        <section aria-label="Verification Result" className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Verification Result Status
              </span>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                {response.status === "existing_fact_check" && "Published Fact-Check Found"}
                {response.status === "automated_assessment_available" && "Automated Credibility Assessment Available"}
                {response.status === "submitted_for_review" && "Claim Submitted for Editorial Review"}
                {response.status === "insufficient_evidence" && "No Matching Record Found"}
                {response.status === "verification_unavailable" && "Verification Service Unavailable"}
              </h2>
            </div>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase ${
                response.status === "existing_fact_check"
                  ? "bg-teal-50 text-teal-800 border border-teal-300 dark:bg-teal-950/50 dark:text-teal-300"
                  : response.status === "automated_assessment_available"
                  ? "bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300"
                  : "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              <span>{response.status.replaceAll("_", " ")}</span>
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {response.message}
          </p>

          {/* Matched Details */}
          {response.result && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-gray-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                  {response.result.title}
                </h3>
                {response.result.verdict && (
                  <span className="rounded-md bg-[#102A43] dark:bg-gray-800 px-2.5 py-1 text-xs font-black uppercase text-white">
                    Verdict: {response.result.verdict}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {response.result.summary}
              </p>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-gray-500">
                  {response.result.reviewer ? `Attributed to: ${response.result.reviewer}` : "Automated Score Engine"}
                </span>

                {response.result.url && (
                  <Link
                    href={response.result.url}
                    className="font-bold text-[#E5242A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect Full Report</span>
                    <span>→</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Dual-Screen Link */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-bold text-[#102A43] dark:text-white">
            Need Multi-Portal Corroboration?
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Use our dual-screen research workspace to search Snopes, Alt News, Boom Live, and PIB India side-by-side.
          </p>
        </div>
        <Link
          href="/fact-check"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors self-start sm:self-auto"
        >
          <span>Dual-Screen Tool</span>
          <span>↗</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />
      <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">Loading verification tool...</div>}>
        <VerifyClaimContent />
      </Suspense>
      <EditorialFooter />
    </div>
  );
}

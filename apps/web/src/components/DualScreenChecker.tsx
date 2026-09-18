"use client";

import { useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api";

interface DualScreenCheckerProps {
  initialText?: string;
  headline?: string;
}

interface VerificationResult {
  title: string;
  summary: string;
  matched_type: string;
  url?: string | null;
  score?: number | null;
  verdict?: string | null;
  reviewer?: string | null;
  evidence_count?: number | null;
}

interface VerificationData {
  query: string;
  status:
    | "existing_fact_check"
    | "automated_assessment_available"
    | "submitted_for_review"
    | "insufficient_evidence"
    | "verification_unavailable";
  message: string;
  submitted_at: string;
  result?: VerificationResult | null;
}

export function DualScreenChecker({
  initialText = "World leaders convened an emergency UN session late Tuesday to negotiate ceasefire terms following maritime boundary disputes.",
  headline = "UN Emergency Session Verification",
}: DualScreenCheckerProps) {
  const [inputText, setInputText] = useState(initialText);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!inputText.trim()) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_text: inputText.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned error ${res.status}`);
      }
      const data: VerificationData = await res.json();
      setVerificationResult(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification request failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-gray-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-serif text-lg font-bold tracking-tight">
            Dual-Screen Real-Time Fact-Checker
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-600 text-white uppercase tracking-wider">
            Live Verification API
          </span>
        </div>
      </div>

      {/* Dual Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800 min-h-[460px]">
        {/* Screen 1: Original Source Article Text / Input */}
        <div className="p-6 flex flex-col justify-between bg-gray-50/50 dark:bg-gray-950/40">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📄</span> Left Screen: Source Text / Claim Under Test
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {inputText.length} chars
              </span>
            </div>

            <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white mb-2">
              {headline}
            </h4>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-48 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed resize-none font-sans"
              placeholder="Paste article claims, quotes, or social media statements here to run instant dual-screen verification..."
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() =>
                setInputText(
                  "World leaders convened an emergency UN session late Tuesday to negotiate ceasefire terms following maritime boundary disputes."
                )
              }
              className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
            >
              Reset to Sample Claim
            </button>

            <button
              onClick={handleVerify}
              disabled={isVerifying || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying Against Live API...
                </>
              ) : (
                <>
                  <span>⚡</span> Run Verification Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screen 2: Real-time Multi-Portal Corroboration Engine */}
        <div className="p-6 flex flex-col justify-between bg-white dark:bg-gray-900">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>🔍</span> Right Screen: Verified External Results
              </span>
              <Link
                href="/verify"
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Dedicated Verify Page →
              </Link>
            </div>

            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-10 w-10 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Checking live verification database and external fact-checks...
                </p>
              </div>
            ) : errorMessage ? (
              <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
                <p className="font-semibold mb-1">Verification Request Error</p>
                <p>{errorMessage}</p>
              </div>
            ) : verificationResult ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status: {verificationResult.status.replaceAll("_", " ")}
                    </span>
                    {verificationResult.result?.score !== undefined &&
                      verificationResult.result?.score !== null && (
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Score: {verificationResult.result.score}/100
                        </span>
                      )}
                    {verificationResult.result?.verdict && (
                      <span className="font-mono text-xs font-bold uppercase text-red-600 dark:text-red-400">
                        Verdict: {verificationResult.result.verdict}
                      </span>
                    )}
                  </div>

                  {verificationResult.result?.title && (
                    <h5 className="font-serif font-bold text-sm text-gray-900 dark:text-white mb-1">
                      {verificationResult.result.title}
                    </h5>
                  )}

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                    {verificationResult.result?.summary || verificationResult.message}
                  </p>

                  {verificationResult.result?.reviewer && (
                    <p className="text-[11px] text-gray-500">
                      Reviewer: {verificationResult.result.reviewer}
                    </p>
                  )}

                  {verificationResult.result?.url && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={verificationResult.result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <span>View Corroborating Source</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>

                {verificationResult.status === "insufficient_evidence" && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
                    ℹ️ <strong>Insufficient Evidence:</strong> No existing editorial verdict or corroborating report was identified. This claim remains unverified.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <span className="text-3xl">🛡️</span>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Ready to verify
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                  Click &ldquo;Run Verification Check&rdquo; on the left to query live backend assessments and verified fact-checks.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Powered by TrueFact Verification API</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Live API Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

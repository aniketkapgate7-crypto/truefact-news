"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CredibilityRing } from "./CredibilityRing";
import { EvidenceMetricBar } from "./EvidenceMetricBar";
import { getCredibilityTier, getConfidenceBadgeClass } from "@/lib/credibilityTokens";
import type { LiveArticle } from "@/types/news";
import type { ApiCredibilityAssessment } from "@/lib/api";

interface StoryIntelligencePanelProps {
  article: LiveArticle | null;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
  onClose?: () => void;
}

export function StoryIntelligencePanel({
  article,
  isSaved = false,
  onToggleSave,
  onClose,
}: StoryIntelligencePanelProps) {
  const [assessment, setAssessment] = useState<ApiCredibilityAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch assessment dynamically whenever article changes
  useEffect(() => {
    if (!article) {
      setAssessment(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/news/${article.id}/assessment`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<ApiCredibilityAssessment>;
      })
      .then((data) => {
        if (isMounted) {
          setAssessment(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load story assessment:", err);
        if (isMounted) setAssessment(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [article]);

  if (!article) {
    return (
      <aside className="rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1E334A] bg-[#112337] text-base text-[#38BDF8]">
          🔍
        </div>
        <h3 className="mt-3 font-sans text-sm font-semibold text-[#E8EEF8]">
          No story selected
        </h3>
        <p className="mt-1 text-xs text-[#8191A8] max-w-[200px]">
          Select an article from the live feed to inspect its credibility analysis and evidence.
        </p>
      </aside>
    );
  }

  const score = assessment ? assessment.credibility_score : article.credibility_score;
  const tier = getCredibilityTier(score);

  return (
    <aside className="rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-4 space-y-4 select-none">
      {/* 1. Header: Headline & Source */}
      <div className="space-y-1.5 border-b border-[#1E334A] pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-[#38BDF8]">{article.source_name}</span>
            <span className="text-[#506176]">·</span>
            <span className="text-[#8191A8]">{article.category}</span>
            {article.region && article.region !== "Global" && (
              <>
                <span className="text-[#506176]">·</span>
                <span className="text-[#8191A8]">{article.region}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(article.id)}
                className={`p-1 rounded transition-colors ${
                  isSaved ? "text-[#38BDF8]" : "text-[#506176] hover:text-[#8191A8]"
                }`}
                title={isSaved ? "Remove from saved" : "Save story"}
              >
                <svg className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 rounded text-[#506176] hover:text-[#E8EEF8]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <h3 className="font-sans text-[15px] font-semibold leading-snug text-[#E8EEF8]">
          {article.title}
        </h3>

        {article.summary ? (
          <p className="text-[12px] leading-relaxed text-[#8191A8] line-clamp-2">
            {article.summary}
          </p>
        ) : null}
      </div>

      {/* 2 & 3. Credibility Score, Rating, Confidence & Status */}
      <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#8191A8]">
            Credibility Score
          </span>
          {isLoading && (
            <span className="text-[10px] font-mono text-[#38BDF8]">
              Syncing…
            </span>
          )}
        </div>

        <div className="flex items-center gap-3.5">
          <CredibilityRing score={score} size={80} strokeWidth={6} />

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span
                className={`rounded border px-2 py-0.2 text-[10px] font-mono font-semibold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}
              >
                {tier.label}
              </span>

              {assessment?.confidence_level && (
                <span
                  className={`rounded border px-2 py-0.2 text-[10px] font-mono font-semibold ${getConfidenceBadgeClass(
                    assessment.confidence_level
                  )}`}
                >
                  {assessment.confidence_level} Confidence
                </span>
              )}

              {assessment?.assessment_status && (
                <span className="rounded border border-[#1E334A] bg-[#0D1B2A] px-1.5 py-0.2 text-[10px] font-mono text-[#8191A8]">
                  {assessment.assessment_status}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#506176] leading-tight">
              {assessment
                ? `Algorithm: ${assessment.method_version || "FastAPI Pipeline"}`
                : "Multi-source evidence processing."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Four Analysis Dimensions */}
      {assessment ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8191A8]">
              Dimension Scores
            </span>
            <span className="text-[10px] font-mono text-[#506176]">
              4 factors
            </span>
          </div>

          <div className="space-y-2 rounded-lg border border-[#1E334A] bg-[#07111F]/70 p-3">
            <EvidenceMetricBar
              label="Source Reliability"
              score={assessment.source_reliability_score}
              weightLabel="30%"
            />
            <EvidenceMetricBar
              label="Evidence Quality"
              score={assessment.evidence_quality_score}
              weightLabel="30%"
            />
            <EvidenceMetricBar
              label="Independent Corroboration"
              score={assessment.corroboration_score}
              weightLabel="25%"
            />
            <EvidenceMetricBar
              label="Content Quality"
              score={assessment.content_quality_score}
              weightLabel="15%"
            />
          </div>
        </div>
      ) : null}

      {/* 5. Evidence Counts */}
      {assessment && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#8191A8]">
            Evidence Inventory
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-2">
              <span className="font-mono text-base font-semibold text-[#2DD4BF]">
                {assessment.supporting_evidence_count}
              </span>
              <p className="text-[10px] text-[#8191A8] mt-0.5">
                Supporting proof
              </p>
            </div>

            <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-2">
              <span className="font-mono text-base font-semibold text-[#FB7185]">
                {assessment.contradicting_evidence_count}
              </span>
              <p className="text-[10px] text-[#8191A8] mt-0.5">
                Contradicting
              </p>
            </div>

            <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-2">
              <span className="font-mono text-base font-semibold text-[#38BDF8]">
                {assessment.independent_source_count}
              </span>
              <p className="text-[10px] text-[#8191A8] mt-0.5">
                Independent sources
              </p>
            </div>

            <div className="rounded-lg border border-[#1E334A] bg-[#112337] p-2">
              <span className="font-mono text-base font-semibold text-[#E8EEF8]">
                {assessment.primary_source_count ?? 1}
              </span>
              <p className="text-[10px] text-[#8191A8] mt-0.5">
                Primary sources
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Main Score Reasons */}
      {assessment?.credibility_reasons && assessment.credibility_reasons.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#8191A8]">
            Scoring Factors
          </span>

          <div className="space-y-1.5">
            {assessment.credibility_reasons.slice(0, 2).map((reason) => (
              <div
                key={reason.code}
                className="rounded border border-[#1E334A] bg-[#07111F] p-2 text-xs text-[#8191A8]"
              >
                <span className="font-medium text-[#E8EEF8] block mb-0.5 text-[11px]">
                  {reason.code.replaceAll("_", " ")}
                </span>
                <span className="text-[11px] leading-relaxed text-[#8191A8]">
                  {reason.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Action Footer: View Full Evidence & Read Original */}
      <div className="pt-2 border-t border-[#1E334A] space-y-2">
        <Link
          href={`/evidence/${article.id}`}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#38BDF8] px-3.5 py-2 text-xs font-semibold text-[#07111F] hover:bg-[#0284C7] hover:text-white transition-colors"
        >
          <span>View Full Evidence Dossier</span>
          <span>→</span>
        </Link>

        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#1E334A] bg-[#112337] px-3.5 py-1.5 text-xs font-medium text-[#8191A8] hover:text-[#E8EEF8] hover:border-[#38BDF8] transition-colors"
          >
            <span>Open Original Source</span>
            <span className="text-[10px]">↗</span>
          </a>
        )}
      </div>
    </aside>
  );
}

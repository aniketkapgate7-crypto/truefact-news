import { getCredibilityTier, getConfidenceBadgeClass, getVerdictStyle } from "@/lib/credibilityTokens";
import type { ApiCredibilityAssessment } from "@/lib/api";

interface CredibilitySummaryBoxProps {
  assessment: ApiCredibilityAssessment | null | undefined;
}

export function CredibilitySummaryBox({ assessment }: CredibilitySummaryBoxProps) {
  if (!assessment) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
          <span>⏳</span>
          <span>Assessment Pending</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This article has been ingested and is currently being processed by the TrueFact multi-source credibility engine.
        </p>
      </div>
    );
  }

  const tier = getCredibilityTier(assessment.credibility_score);
  const isHumanReviewed = assessment.review_status === "published" && Boolean(assessment.verdict);
  const verdictStyle = isHumanReviewed ? getVerdictStyle(assessment.verdict) : null;

  return (
    <section aria-label="Credibility Assessment" className="rounded-2xl border border-[#E5E7EB] dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-6 sm:p-7 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#E5242A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-gray-200">
              {isHumanReviewed ? "Human-Reviewed Fact-Check Verdict" : "Automated Credibility Assessment"}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isHumanReviewed
              ? `Reviewed by ${assessment.reviewer_name || "TrueFact Editorial Staff"}`
              : "Algorithm-assisted evaluation based on verifiable citations and multi-source corroboration"}
          </p>
        </div>

        {/* Score & Verdict badges */}
        <div className="flex items-center gap-3">
          {verdictStyle && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase ${verdictStyle.borderColor} ${verdictStyle.bgColor} ${verdictStyle.textColor}`}>
              <span>{verdictStyle.icon}</span>
              <span>{verdictStyle.label}</span>
            </span>
          )}

          <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}>
            <span className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
            <span className="text-sm font-black">{Math.round(assessment.credibility_score)}/100</span>
            <span>· {tier.badgeLabel}</span>
          </div>
        </div>
      </div>

      {/* 4 Score Dimensions Grid */}
      <div className="py-6 border-b border-gray-200 dark:border-gray-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Four Credibility Dimensions
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Source Reliability */}
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#121826] p-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-700 dark:text-gray-300">Source Reliability</span>
              <span className="font-mono text-[#102A43] dark:text-white font-bold">{assessment.source_reliability_score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all" style={{ width: `${assessment.source_reliability_score}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Historical accuracy and domain authority weight (30%)</p>
          </div>

          {/* 2. Evidence Quality */}
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#121826] p-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-700 dark:text-gray-300">Evidence Quality</span>
              <span className="font-mono text-[#102A43] dark:text-white font-bold">{assessment.evidence_quality_score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-teal-600 dark:bg-teal-500 transition-all" style={{ width: `${assessment.evidence_quality_score}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Direct quotes, documents, and data citations (30%)</p>
          </div>

          {/* 3. Corroboration */}
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#121826] p-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-700 dark:text-gray-300">Cross-Source Corroboration</span>
              <span className="font-mono text-[#102A43] dark:text-white font-bold">{assessment.corroboration_score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all" style={{ width: `${assessment.corroboration_score}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Independent reporting matching the same facts (25%)</p>
          </div>

          {/* 4. Content Quality */}
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#121826] p-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-700 dark:text-gray-300">Content Quality &amp; Neutrality</span>
              <span className="font-mono text-[#102A43] dark:text-white font-bold">{assessment.content_quality_score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all" style={{ width: `${assessment.content_quality_score}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Neutral tone, lack of clickbait, and clarity (15%)</p>
          </div>
        </div>
      </div>

      {/* Traceable Evidence Counts Strip */}
      <div className="py-5 border-b border-gray-200 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-lg bg-white dark:bg-[#121826] border border-gray-200/60 dark:border-gray-800/60">
          <span className="block font-mono text-xl font-black text-[#102A43] dark:text-white">
            {assessment.primary_source_count}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Primary Sources</span>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#121826] border border-gray-200/60 dark:border-gray-800/60">
          <span className="block font-mono text-xl font-black text-[#102A43] dark:text-white">
            {assessment.independent_source_count}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Independent Outlets</span>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#121826] border border-gray-200/60 dark:border-gray-800/60">
          <span className="block font-mono text-xl font-black text-teal-600 dark:text-teal-400">
            {assessment.supporting_evidence_count}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Supporting Evidence</span>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#121826] border border-gray-200/60 dark:border-gray-800/60">
          <span className="block font-mono text-xl font-black text-rose-600 dark:text-rose-400">
            {assessment.contradicting_evidence_count}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Contradicting Claims</span>
        </div>
      </div>

      {/* Explanatory notes & Transparency notice */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span>Confidence: </span>
          <span className={`inline-block rounded px-2 py-0.5 font-bold uppercase text-[10px] ${getConfidenceBadgeClass(assessment.confidence_level)}`}>
            {assessment.confidence_level}
          </span>
          <span className="mx-2">·</span>
          <span>Assessed: {new Date(assessment.assessed_at).toLocaleDateString()}</span>
        </div>

        <p className="text-[11px] italic">
          *Scores reflect automated signals and source corroboration. Not a mathematical guarantee of absolute truth.
        </p>
      </div>
    </section>
  );
}

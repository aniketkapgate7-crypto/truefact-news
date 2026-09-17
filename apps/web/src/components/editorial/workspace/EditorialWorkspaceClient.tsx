"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAppAuth } from "@/components/auth/AuthContext";
import {
  type ApiNewsArticle,
  type ApiCredibilityAssessment,
  type FactCheckVerdict,
  type ReviewStatus,
  type EditorialReviewUpdatePayload,
  getNewsFeed,
  getCredibilityAssessment,
  updateEditorialReviewApi,
} from "@/lib/api";

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  automated: "Automated (Unreviewed)",
  pending_review: "Pending Review",
  in_review: "In Review",
  reviewed: "Completed (Draft)",
  published: "Published Fact-Check",
  corrected: "Published with Correction",
  retracted: "Retracted",
};

const REVIEW_STATUS_BADGES: Record<
  ReviewStatus,
  { bg: string; text: string; border: string }
> = {
  automated: {
    bg: "bg-slate-800/60",
    text: "text-slate-300",
    border: "border-slate-700",
  },
  pending_review: {
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-700/60",
  },
  in_review: {
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-700/60",
  },
  reviewed: {
    bg: "bg-purple-950/60",
    text: "text-purple-300",
    border: "border-purple-700/60",
  },
  published: {
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-600/70",
  },
  corrected: {
    bg: "bg-teal-950/60",
    text: "text-teal-300",
    border: "border-teal-700/60",
  },
  retracted: {
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-700/60",
  },
};

const VERDICT_OPTIONS: { value: FactCheckVerdict; label: string; color: string }[] = [
  { value: "true", label: "True — Completely Accurate", color: "text-emerald-400" },
  { value: "mostly_true", label: "Mostly True — Minor Context Missing", color: "text-teal-400" },
  { value: "mixed", label: "Mixed — Elements of Truth and Error", color: "text-amber-400" },
  { value: "misleading", label: "Misleading — Out of Context or Distorted", color: "text-orange-400" },
  { value: "mostly_false", label: "Mostly False — Substantially Inaccurate", color: "text-rose-400" },
  { value: "false", label: "False — Fabricated or Proven False", color: "text-red-500" },
  { value: "unverified", label: "Unverified — Insufficient Evidence", color: "text-gray-400" },
];

export interface EditorialWorkspaceClientProps {
  initialArticles: ApiNewsArticle[];
  userProfile: {
    id: string;
    email?: string | null;
    display_name?: string | null;
    role: string;
  };
  initialToken?: string | null;
}

export function EditorialWorkspaceClient({
  initialArticles,
  userProfile,
  initialToken,
}: EditorialWorkspaceClientProps) {
  const { getToken } = useAppAuth();

  const [articles, setArticles] = useState<ApiNewsArticle[]>(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    initialArticles.length > 0 ? initialArticles[0].id : null
  );
  const [selectedAssessment, setSelectedAssessment] =
    useState<ApiCredibilityAssessment | null>(null);

  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form State
  const [claim, setClaim] = useState("");
  const [claimant, setClaimant] = useState("");
  const [verdict, setVerdict] = useState<FactCheckVerdict | "">("");
  const [reviewerName, setReviewerName] = useState(
    userProfile.display_name || userProfile.email || "Editorial Staff"
  );
  const [reviewerId, setReviewerId] = useState(userProfile.id);
  const [conclusion, setConclusion] = useState("");
  const [correctionSummary, setCorrectionSummary] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("pending_review");

  // Mutation and Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const selectedArticle = useMemo(() => {
    return articles.find((a) => a.id === selectedArticleId) || null;
  }, [articles, selectedArticleId]);

  // Load full assessment whenever selectedArticleId changes
  useEffect(() => {
    if (!selectedArticleId) {
      setSelectedAssessment(null);
      return;
    }

    let isMounted = true;
    setIsAssessmentLoading(true);
    setAssessmentError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    getCredibilityAssessment(selectedArticleId)
      .then((assessment) => {
        if (!isMounted) return;
        setSelectedAssessment(assessment);
        if (assessment) {
          setClaim(assessment.claim || selectedArticle?.title || "");
          setClaimant(assessment.claimant || selectedArticle?.source_name || "");
          setVerdict(assessment.verdict || "");
          setReviewerName(
            assessment.reviewer_name ||
              userProfile.display_name ||
              userProfile.email ||
              "Editorial Reviewer"
          );
          setReviewerId(assessment.reviewer_id || userProfile.id);
          setConclusion(assessment.conclusion || "");
          setCorrectionSummary(assessment.correction_summary || "");
          setReviewStatus(assessment.review_status || "pending_review");
        } else {
          setClaim(selectedArticle?.title || "");
          setClaimant(selectedArticle?.source_name || "");
          setVerdict("");
          setConclusion("");
          setCorrectionSummary("");
          setReviewStatus("pending_review");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setAssessmentError(
          err instanceof Error ? err.message : "Failed to load credibility assessment"
        );
      })
      .finally(() => {
        if (isMounted) setIsAssessmentLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedArticleId, selectedArticle, userProfile]);

  const handleRefreshQueue = async () => {
    setIsQueueLoading(true);
    setQueueError(null);
    try {
      const freshArticles = await getNewsFeed({
        page: 1,
        page_size: 50,
        sort_by: "published_at",
        sort_order: "desc",
      });
      setArticles(freshArticles);
      if (!selectedArticleId && freshArticles.length > 0) {
        setSelectedArticleId(freshArticles[0].id);
      }
    } catch (err) {
      setQueueError(
        err instanceof Error ? err.message : "Failed to refresh editorial review queue"
      );
    } finally {
      setIsQueueLoading(false);
    }
  };

  // Filtered Queue
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matches =
          art.title.toLowerCase().includes(q) ||
          art.source_name.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (categoryFilter !== "all") {
        if (art.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [articles, searchFilter, categoryFilter]);

  // Publishing Safeguards Calculation
  const isPublishingTarget = reviewStatus === "published";
  const missingPublishFields = useMemo(() => {
    if (!isPublishingTarget) return [];
    const missing: string[] = [];
    if (!verdict) missing.push("Verdict");
    if (!reviewerName.trim() && !reviewerId.trim()) {
      missing.push("Reviewer attribution (Name or ID)");
    }
    if (!claim.trim()) missing.push("Claim text");
    if (!conclusion.trim()) missing.push("Human-written conclusion");
    return missing;
  }, [isPublishingTarget, verdict, reviewerName, reviewerId, claim, conclusion]);

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (!selectedArticleId) return false;
    if (isPublishingTarget && missingPublishFields.length > 0) return false;
    return true;
  }, [isSubmitting, selectedArticleId, isPublishingTarget, missingPublishFields]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedArticleId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let token = initialToken;
      if (!token) {
        token = await getToken();
      }
      if (!token || !token.trim()) {
        throw new Error(
          "Authentication token is missing. Please sign in again with your editorial credentials."
        );
      }

      const payload: EditorialReviewUpdatePayload = {
        review_status: reviewStatus,
        verdict: verdict ? (verdict as FactCheckVerdict) : null,
        claim: claim.trim() || null,
        claimant: claimant.trim() || null,
        reviewer_name: reviewerName.trim() || null,
        reviewer_id: reviewerId.trim() || null,
        conclusion: conclusion.trim() || null,
        correction_summary: correctionSummary.trim() || null,
      };

      const updatedAssessment = await updateEditorialReviewApi(
        token,
        selectedArticleId,
        payload
      );

      // Server confirmation received: update local state
      setSelectedAssessment(updatedAssessment);
      setSubmitSuccess(
        reviewStatus === "published"
          ? `Fact check published successfully! (Version ${updatedAssessment.review_version})`
          : `Editorial review updated to '${REVIEW_STATUS_LABELS[reviewStatus]}' successfully!`
      );

      // Update the article in the local list
      setArticles((prev) =>
        prev.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                credibility_score: updatedAssessment.credibility_score,
              }
            : a
        )
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit editorial review update to backend."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Newsroom Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#1E334A] bg-[#091625] p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h1 className="font-serif text-lg font-bold text-white tracking-tight">
              Newsroom Editorial Review Desk
            </h1>
            <p className="text-[11px] text-[#8191A8]">
              Authorized Internal Reviewer Console · IFCN Fact-Check Certification Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-[#1E334A] bg-[#0D1B2A] px-3 py-1.5 font-mono">
            <span className="text-[#8191A8]">Editor:</span>
            <span className="font-semibold text-[#E8EEF8]">
              {userProfile.display_name || userProfile.email || "Certified Reviewer"}
            </span>
            <span className="rounded bg-[#38BDF8]/15 px-2 py-0.5 text-[10px] font-bold text-[#38BDF8] uppercase border border-[#38BDF8]/30">
              {userProfile.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshQueue}
            disabled={isQueueLoading}
            className="flex items-center gap-1.5 rounded-lg border border-[#1E334A] bg-[#112337] px-3 py-1.5 text-xs font-semibold text-[#E8EEF8] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{isQueueLoading ? "Refreshing…" : "Refresh Queue"}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Queue on Left, Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Queue (5 cols) */}
        <section
          aria-label="Article Review Queue"
          className="lg:col-span-5 space-y-4 rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between border-b border-[#1E334A] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Review Queue ({filteredArticles.length})
              </h2>
              <p className="text-[11px] text-[#8191A8]">
                Select an ingested story to verify claims and edit fact check dossiers
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search queue by title, source, or summary..."
              className="w-full rounded-lg border border-[#1E334A] bg-[#112337] px-3 py-2 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-[#38BDF8] focus:outline-none"
            />

            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-[#1E334A] bg-[#112337] px-2.5 py-1.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="politics">Politics</option>
                <option value="world">World</option>
                <option value="business">Business</option>
                <option value="tech">Tech</option>
                <option value="science">Science</option>
                <option value="sports">Sports</option>
              </select>
            </div>
          </div>

          {/* Queue List / States */}
          {queueError ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-center space-y-2">
              <p className="text-xs text-red-300">⚠️ {queueError}</p>
              <button
                type="button"
                onClick={handleRefreshQueue}
                className="rounded bg-red-800/60 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
              >
                Retry Ingestion
              </button>
            </div>
          ) : isQueueLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent" />
              <p className="text-xs text-[#8191A8]">Loading articles from ingestion pipeline…</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1E334A] py-12 text-center space-y-2">
              <span className="text-2xl">📡</span>
              <p className="text-xs font-semibold text-[#E8EEF8]">No Stories in Queue</p>
              <p className="text-[11px] text-[#8191A8] max-w-xs mx-auto">
                No news articles match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredArticles.map((article) => {
                const isSelected = article.id === selectedArticleId;
                const score = article.credibility_score;

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-[#38BDF8] bg-[#112337] shadow-md ring-1 ring-[#38BDF8]"
                        : "border-[#1E334A] bg-[#091625] hover:border-[#2D4A6B] hover:bg-[#0D1B2A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#38BDF8]">
                        {article.source_name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        {score !== null && score !== undefined ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              score >= 80
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : score >= 60
                                ? "bg-sky-950 text-sky-300 border border-sky-800"
                                : score >= 40
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}
                          >
                            Score: {score}
                          </span>
                        ) : (
                          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
                            Unscored
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xs font-semibold text-[#E8EEF8] line-clamp-2 leading-snug mb-1">
                      {article.title}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-[#506176] font-mono">
                      <span>{article.category}</span>
                      <span>
                        {new Date(article.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Active Editorial Review Form (7 cols) */}
        <section
          aria-label="Editorial Fact-Check Review Form"
          className="lg:col-span-7 space-y-5 rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-5 sm:p-6"
        >
          {selectedArticle ? (
            <>
              {/* Article Overview Header */}
              <div className="border-b border-[#1E334A] pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#38BDF8]">
                      Article #{selectedArticle.id}
                    </span>
                    <span className="text-[#506176]">•</span>
                    <span className="text-xs text-[#8191A8] font-semibold">
                      {selectedArticle.source_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedAssessment?.review_status && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold border ${
                          REVIEW_STATUS_BADGES[selectedAssessment.review_status]?.border
                        } ${REVIEW_STATUS_BADGES[selectedAssessment.review_status]?.bg} ${
                          REVIEW_STATUS_BADGES[selectedAssessment.review_status]?.text
                        }`}
                      >
                        {REVIEW_STATUS_LABELS[selectedAssessment.review_status]}
                      </span>
                    )}
                    <Link
                      href={`/evidence/${selectedArticle.id}`}
                      target="_blank"
                      className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Public Dossier</span>
                      <span>↗</span>
                    </Link>
                  </div>
                </div>

                <h2 className="font-serif text-lg font-bold text-white leading-snug">
                  {selectedArticle.title}
                </h2>

                <p className="text-xs text-[#8191A8] leading-relaxed">
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Assessment Telemetry Strip */}
              {isAssessmentLoading ? (
                <div className="p-3 bg-[#112337] rounded-lg text-center text-xs text-[#8191A8]">
                  Loading assessment telemetry…
                </div>
              ) : assessmentError ? (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg text-xs text-red-300">
                  ⚠️ {assessmentError}
                </div>
              ) : selectedAssessment ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                  <div className="rounded-lg bg-[#112337] p-2 border border-[#1E334A]">
                    <span className="block text-[10px] text-[#8191A8]">Source Reliability</span>
                    <span className="text-sm font-bold text-[#38BDF8]">
                      {selectedAssessment.source_reliability_score}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#112337] p-2 border border-[#1E334A]">
                    <span className="block text-[10px] text-[#8191A8]">Evidence Quality</span>
                    <span className="text-sm font-bold text-[#2DD4BF]">
                      {selectedAssessment.evidence_quality_score}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#112337] p-2 border border-[#1E334A]">
                    <span className="block text-[10px] text-[#8191A8]">Corroboration</span>
                    <span className="text-sm font-bold text-[#38BDF8]">
                      {selectedAssessment.corroboration_score}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#112337] p-2 border border-[#1E334A]">
                    <span className="block text-[10px] text-[#8191A8]">Total Credibility</span>
                    <span className="text-sm font-bold text-white">
                      {selectedAssessment.credibility_score}/100
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Editorial Review Form */}
              <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#1E334A] pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Fact-Check Dossier Editor
                  </h3>
                  <span className="text-[10px] text-[#8191A8]">
                    Backend Endpoint: PATCH /api/v1/editorial/review/{selectedArticle.id}
                  </span>
                </div>

                {/* Claim Under Review */}
                <div className="space-y-1.5">
                  <label htmlFor="field-claim" className="block text-xs font-bold text-[#E8EEF8]">
                    Claim Under Review <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="field-claim"
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    rows={2}
                    placeholder="Exact headline, statement, or assertion being tested..."
                    className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-[#38BDF8] focus:outline-none"
                    required
                  />
                </div>

                {/* Claimant & Target Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="field-claimant" className="block text-xs font-bold text-[#E8EEF8]">
                      Claimant / Origin
                    </label>
                    <input
                      id="field-claimant"
                      type="text"
                      value={claimant}
                      onChange={(e) => setClaimant(e.target.value)}
                      placeholder="e.g. Agency, Politician, Viral Post..."
                      className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-[#38BDF8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="field-status" className="block text-xs font-bold text-[#E8EEF8]">
                      Review Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="field-status"
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                      className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8] focus:outline-none"
                    >
                      <option value="pending_review">Pending Review</option>
                      <option value="in_review">In Review</option>
                      <option value="reviewed">Completed / Draft</option>
                      <option value="published">Published Fact-Check</option>
                      <option value="corrected">Published with Correction</option>
                      <option value="retracted">Retracted</option>
                    </select>
                  </div>
                </div>

                {/* Verdict & Reviewer Attribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="field-verdict" className="block text-xs font-bold text-[#E8EEF8]">
                      Fact-Check Verdict {isPublishingTarget && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      id="field-verdict"
                      value={verdict}
                      onChange={(e) => setVerdict(e.target.value as FactCheckVerdict)}
                      className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8] focus:outline-none"
                    >
                      <option value="">-- Select Verdict --</option>
                      {VERDICT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="field-reviewer" className="block text-xs font-bold text-[#E8EEF8]">
                      Reviewer Attribution {isPublishingTarget && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      id="field-reviewer"
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Reviewer Name or Newsroom Byline"
                      className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-[#38BDF8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Human Conclusion */}
                <div className="space-y-1.5">
                  <label htmlFor="field-conclusion" className="block text-xs font-bold text-[#E8EEF8]">
                    Reviewer Conclusion &amp; Evidence Summary{" "}
                    {isPublishingTarget && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    id="field-conclusion"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={4}
                    placeholder="Comprehensive explanation synthesizing corroborated evidence, source reliability, and rationale for the verdict..."
                    className="w-full rounded-lg border border-[#1E334A] bg-[#112337] p-2.5 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-[#38BDF8] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Correction Summary (if corrected) */}
                {reviewStatus === "corrected" && (
                  <div className="space-y-1.5">
                    <label htmlFor="field-correction" className="block text-xs font-bold text-teal-400">
                      Correction Summary <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="field-correction"
                      value={correctionSummary}
                      onChange={(e) => setCorrectionSummary(e.target.value)}
                      rows={2}
                      placeholder="Public note detailing what information was corrected, why, and the date of modification..."
                      className="w-full rounded-lg border border-teal-800 bg-[#112337] p-2.5 text-xs text-[#E8EEF8] placeholder-[#506176] focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* Publishing Safeguards Notice */}
                {isPublishingTarget && missingPublishFields.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-600/70 bg-amber-950/40 p-3.5 space-y-1.5 text-xs text-amber-200"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span>⚠️</span>
                      <span>Publishing Safeguards Active:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Publishing to the public registry requires complete human-reviewed data.
                      Missing mandatory fields:
                    </p>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 font-semibold text-amber-300">
                      {missingPublishFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Backend Feedback Alerts */}
                {submitError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-800/70 bg-red-950/50 p-3 text-xs text-red-200"
                  >
                    <strong className="font-semibold block mb-0.5">Submission Rejected by Backend:</strong>
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-800/70 bg-emerald-950/50 p-3 text-xs text-emerald-200"
                  >
                    <strong className="font-semibold block mb-0.5">✓ Verification Complete:</strong>
                    <span>{submitSuccess}</span>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="pt-3 border-t border-[#1E334A] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-[#8191A8]">
                    {isPublishingTarget ? (
                      <span className="text-emerald-400 font-semibold">
                        ● Target: Public Fact-Check Registry
                      </span>
                    ) : (
                      <span>● Target: Internal Editorial Draft</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isPublishingTarget
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Sending to Backend…</span>
                      </>
                    ) : isPublishingTarget ? (
                      <>
                        <span>🚀</span>
                        <span>Confirm &amp; Publish Fact-Check</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Review Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-24 text-center space-y-3">
              <span className="text-3xl">📄</span>
              <h3 className="font-serif text-base font-bold text-white">No Story Selected</h3>
              <p className="text-xs text-[#8191A8] max-w-sm mx-auto">
                Choose an article from the queue on the left to begin reviewing evidence and recording editorial verdicts.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

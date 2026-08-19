import Link from "next/link";
import { notFound } from "next/navigation";

import { StickyHeader } from "@/components/StickyHeader";
import {
  getCredibilityAssessment,
  getNewsArticle,
  type AssessmentStatus,
  type ConfidenceLevel,
  type CredibilityRating,
} from "@/lib/api";

interface EvidencePageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<AssessmentStatus, string> = {
  supported:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  disputed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
  mixed:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  unverified:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  medium:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  low: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

const RATING_STYLES: Record<CredibilityRating, string> = {
  very_high:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  high: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  very_low: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const barColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-950 dark:text-white">
          {score}/100
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceCount({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-3xl font-black text-slate-950 dark:text-white">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
        {label}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default async function EvidencePage({
  params,
}: EvidencePageProps) {
  const { id } = await params;
  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId <= 0) {
    notFound();
  }

  const [article, assessment] = await Promise.all([
    getNewsArticle(articleId),
    getCredibilityAssessment(articleId),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <StickyHeader />

      <main className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
        >
          <span aria-hidden="true">←</span>
          Back to news
        </Link>

        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {article.category}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {article.region}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl font-serif text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {article.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <a
              href={article.source_url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-red-600 dark:text-slate-200 dark:hover:text-red-400"
            >
              {article.source_name}
            </a>
            <span>Published {formatDate(article.published_at)} UTC</span>
            <span>Article #{article.id}</span>
          </div>
        </header>

        {!assessment ? (
          <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Assessment pending
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              No credibility assessment is available yet
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              This article exists in the news feed, but its evidence has not yet
              been evaluated. Treat its claims as unverified until an assessment
              is published.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Credibility score
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-6xl font-black text-slate-950 dark:text-white">
                    {assessment.credibility_score}
                  </span>
                  <span className="pb-2 text-lg font-semibold text-slate-400">
                    /100
                  </span>
                </div>

                <span
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${RATING_STYLES[assessment.credibility_rating]}`}
                >
                  {formatLabel(assessment.credibility_rating)}
                </span>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                    style={{
                      width: `${assessment.credibility_score}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Evidence conclusion
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${STATUS_STYLES[assessment.assessment_status]}`}
                  >
                    {formatLabel(assessment.assessment_status)}
                  </span>

                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${CONFIDENCE_STYLES[assessment.confidence_level]}`}
                  >
                    {formatLabel(assessment.confidence_level)} confidence
                  </span>

                  {assessment.is_evolving && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                      Evolving story
                    </span>
                  )}
                </div>

                <p className="mt-6 leading-7 text-slate-700 dark:text-slate-300">
                  {assessment.explanation}
                </p>

                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  This assessment summarizes available evidence. It supports
                  informed review but does not guarantee that every claim is
                  true or final.
                </p>
              </div>
            </section>

            <section className="mt-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
                  Evidence inventory
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  What the assessment found
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <EvidenceCount
                  label="Supporting evidence"
                  value={assessment.supporting_evidence_count}
                  description="Items that support the central claim."
                />
                <EvidenceCount
                  label="Contradicting evidence"
                  value={assessment.contradicting_evidence_count}
                  description="Items that challenge or conflict with the claim."
                />
                <EvidenceCount
                  label="Independent sources"
                  value={assessment.independent_source_count}
                  description="Sources operating independently from one another."
                />
                <EvidenceCount
                  label="Primary sources"
                  value={assessment.primary_source_count}
                  description="Direct records, statements, or original evidence."
                />
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Component scores
                </h2>

                <div className="mt-6 space-y-6">
                  <ScoreBar
                    label="Source reliability"
                    score={assessment.source_reliability_score}
                  />
                  <ScoreBar
                    label="Evidence quality"
                    score={assessment.evidence_quality_score}
                  />
                  <ScoreBar
                    label="Corroboration"
                    score={assessment.corroboration_score}
                  />
                  <ScoreBar
                    label="Content quality"
                    score={assessment.content_quality_score}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Why it received this result
                </h2>

                <ul className="mt-5 space-y-4">
                  {assessment.credibility_reasons.map((reason) => (
                    <li
                      key={reason.code}
                      className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60"
                    >
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatLabel(reason.code)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {reason.message}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Assessment transparency
              </h2>

              <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                    Method
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">
                    {assessment.method_version}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                    Assessed
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">
                    {formatDate(assessment.assessed_at)} UTC
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                    Last updated
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">
                    {formatDate(assessment.updated_at)} UTC
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Engagement
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            Reach is not credibility
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Comments and reposts describe audience activity. High engagement
            does not prove that an article is accurate.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <EvidenceCount
              label="Comments"
              value={article.comment_count}
              description="Recorded discussion activity for this article."
            />
            <EvidenceCount
              label="Reposts"
              value={article.repost_count}
              description="Recorded sharing activity for this article."
            />
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-600">
        © 2026 TrueFact News · Evidence before engagement
      </footer>
    </div>
  );
}

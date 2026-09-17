import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getEditorialFactCheck,
  type EditorialFactCheckItem,
} from "@/lib/api";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ShareReportButton } from "@/components/editorial/ShareReportButton";
import { getVerdictStyle, getCredibilityTier } from "@/lib/credibilityTokens";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) return { title: "Fact Check Not Found — TrueFact News" };

  const factCheck = await getEditorialFactCheck(numId).catch(() => null);
  if (
    !factCheck ||
    factCheck.review_status !== "published" ||
    !factCheck.verdict ||
    !factCheck.reviewer_name ||
    !factCheck.reviewed_at ||
    !factCheck.review_published_at ||
    !factCheck.claim ||
    !factCheck.conclusion
  ) {
    return { title: "Fact Check Not Found — TrueFact News" };
  }

  const claimText = factCheck.claim;

  return {
    title: `Fact Check: “${claimText}” — TrueFact News`,
    description: factCheck.conclusion,
    openGraph: {
      title: `Fact Check: ${claimText}`,
      description: factCheck.conclusion,
      type: "article",
    },
  };
}

export default async function FactCheckReportPage({ params }: Props) {
  const { id } = await params;
  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();

  let factCheck: EditorialFactCheckItem | null = null;
  try {
    const fc = await getEditorialFactCheck(numId).catch(() => null);

    // Strict validation: automated assessments must NEVER become fact check reports
    if (
      fc &&
      fc.review_status === "published" &&
      fc.verdict &&
      fc.reviewer_name &&
      fc.reviewed_at &&
      fc.review_published_at &&
      fc.claim &&
      fc.conclusion
    ) {
      factCheck = fc;
    } else {
      notFound();
    }
  } catch (err) {
    console.error("Failed to load fact check:", err);
    notFound();
  }

  if (!factCheck) notFound();

  const verdictStyle = getVerdictStyle(factCheck.verdict);
  const tier = getCredibilityTier(factCheck.credibility_score);

  const reviewDate = factCheck.review_published_at
    ? new Date(factCheck.review_published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  // Schema.org ClaimReview JSON-LD structured data (strictly for human-reviewed fact checks)
  const claimReviewJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    datePublished: factCheck.review_published_at || factCheck.published_at,
    url: `https://truefactnews.com/fact-check/${factCheck.article_id}`,
    claimReviewed: factCheck.claim,
    itemReviewed: {
      "@type": "Claim",
      author: {
        "@type": "Organization",
        name: factCheck.claimant || factCheck.source_name,
      },
      datePublished: factCheck.claim_date || factCheck.published_at,
      appearance: {
        "@type": "WebPage",
        url: factCheck.source_url,
      },
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: verdictStyle.label,
      bestRating: "True",
      worstRating: "False",
      alternateName: verdictStyle.label,
    },
    author: {
      "@type": "Organization",
      name: "TrueFact News",
      url: "https://truefactnews.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      {/* Structured ClaimReview JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(claimReviewJsonLd) }}
      />

      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#E5242A] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/fact-check" className="hover:text-[#E5242A] transition-colors">Fact Checks</Link>
          <span>/</span>
          <span className="text-gray-400">Report #{factCheck.article_id}</span>
        </nav>

        {/* Fact-Check Investigation Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#E5242A] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Fact Check Report
            </span>
            <span className="rounded-md border border-gray-300 dark:border-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Version {factCheck.review_version}.0
            </span>
            <span className="text-xs text-gray-400">Published {reviewDate}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            Fact Check: “{factCheck.claim}”
          </h1>
        </div>

        {/* ── Prominent Verdict Hero Box ── */}
        <div className={`rounded-3xl border-2 p-6 sm:p-8 ${verdictStyle.borderColor} ${verdictStyle.bgColor}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block mb-1">
                Official Editorial Finding
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${verdictStyle.textColor}`}>
                  {verdictStyle.icon} {verdictStyle.label}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <span>Reviewed by: <strong className="text-gray-900 dark:text-white">{factCheck.reviewer_name}</strong></span>
              <span>Investigation Status: <strong className="uppercase font-bold text-gray-900 dark:text-white">{factCheck.review_status}</strong></span>
              <span>Credibility Calculation: <strong className="font-mono text-gray-900 dark:text-white">{factCheck.credibility_score}/100 ({tier.badgeLabel})</strong></span>
            </div>
          </div>

          {/* Concise Editorial Conclusion */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Concise Editorial Conclusion:
            </h3>
            <p className="font-serif text-lg sm:text-xl font-bold text-gray-950 dark:text-white leading-relaxed">
              {factCheck.conclusion}
            </p>
          </div>
        </div>

        {/* Claim Context Table */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Claim Origin &amp; Appearance Details
          </h3>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exact Claim</dt>
              <dd className="mt-1 font-semibold text-gray-900 dark:text-white text-sm">“{factCheck.claim}”</dd>
            </div>
            <div>
              <dt className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Claimant / Circulated By</dt>
              <dd className="mt-1 font-semibold text-gray-900 dark:text-white text-sm">{factCheck.claimant || factCheck.source_name}</dd>
            </div>
            <div>
              <dt className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Original Context</dt>
              <dd className="mt-1 text-gray-700 dark:text-gray-300">{factCheck.summary}</dd>
            </div>
            <div>
              <dt className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Traceable Source Reference</dt>
              <dd className="mt-1">
                <a
                  href={factCheck.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {factCheck.source_url} ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Evidence Analysis Breakdown */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Evidence Evaluation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supporting Evidence */}
            <div className="rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
                <span>✓</span>
                <span>Supporting Evidence ({factCheck.supporting_evidence_count})</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Elements corroborated by documented official records, press releases, or recognized institutional research.
              </p>
              <div className="pt-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
                Primary Sources Cited: {factCheck.primary_source_count}
              </div>
            </div>

            {/* Contradicting Evidence */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-base">
                <span>✕</span>
                <span>Contradicting Records ({factCheck.contradicting_evidence_count})</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Inconsistencies, official rebuttals, mathematical discrepancies, or misleading selective context identified during investigation.
              </p>
              <div className="pt-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
                Independent Corroborating Outlets: {factCheck.independent_source_count}
              </div>
            </div>
          </div>
        </div>

        {/* Investigation Methodology & Audit Trail */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 sm:p-8 space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
            Research Method &amp; Investigation Steps
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <li><strong>Claim Identification:</strong> Detected via continuous feed ingestion and automated viral velocity signals.</li>
            <li><strong>Primary Source Examination:</strong> Checked direct archives, legal filings, and official institutional announcements.</li>
            <li><strong>Independent Corroboration:</strong> Cross-referenced with multiple independent verified news bureaus and regional fact-checkers.</li>
            <li><strong>Peer Review &amp; Verdict Assignment:</strong> Staff fact-checker reviewed evidence and published final verdict badge.</li>
          </ol>

          {factCheck.correction_summary && (
            <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-300">
              <strong>Correction Log (v{factCheck.review_version}): </strong>
              {factCheck.correction_summary}
            </div>
          )}
        </div>

        {/* Actions, Share, and Citations */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700 dark:text-gray-300">Share Report:</span>
            <ShareReportButton />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/article/${factCheck.article_id}`}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full News Article →
            </Link>
            <Link
              href="/verify"
              className="rounded-lg bg-[#E5242A] px-4 py-1.5 font-bold text-white hover:bg-[#c9181e] transition-colors"
            >
              Verify Another Claim
            </Link>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

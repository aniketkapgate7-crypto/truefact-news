import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Editorial Independence & Standards — TrueFact News",
  description:
    "Review our strict journalistic standards, multi-source corroboration requirements, and editorial independence guidelines.",
};

export default function EditorialStandardsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Journalistic Code &amp; Ethics
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Editorial Independence &amp; Standards
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            TrueFact News adheres to rigorous standards of accuracy, impartiality, source transparency, and fairness across both automated processing and human reporting.
          </p>
        </div>

        <section className="space-y-6 editorial-prose">
          <h2>1. Multi-Source Corroboration Requirement</h2>
          <p>
            We do not publish unsubstantiated single-source assertions as established fact. When a developing report originates from a single outlet, our platform flags the corroboration score accordingly and documents the single-source limitation until secondary verification arrives.
          </p>

          <h2>2. Traceable Primary Sourcing</h2>
          <p>
            Every claim, statistic, or regulatory development featured on TrueFact must be linked to verifiable documentation—such as court filings, academic research, legislative transcripts, or on-the-record statements. We avoid blind reliance on anonymous or unattributed rumors.
          </p>

          <h2>3. Impartiality &amp; Fairness</h2>
          <p>
            We apply the exact same evaluation metrics and verification standards regardless of political affiliation, nationality, commercial prominence, or corporate ownership. When investigating controversial claims, we present direct quotes from all involved parties.
          </p>

          <h2>4. Distinguishing Opinion from Fact</h2>
          <p>
            Commentary, opinion essays, and analytical conjecture are distinctly distinguished from straight factual news. Opinion columns are excluded from automated factual scoring.
          </p>

          <h2>5. Algorithmic Integrity &amp; Oversight</h2>
          <p>
            Our automated credibility engine operates under regular human audits. If algorithmic edge cases produce anomalies or biased clustering, our engineering and editorial leads review the heuristics and log adjustments transparently.
          </p>
        </section>

        {/* Navigation */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <Link href="/methodology" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← View Scoring Methodology
          </Link>
          <Link href="/contact" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Contact Editorial Desk →
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

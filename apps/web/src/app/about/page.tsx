import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "About TrueFact News — Transparent Journalism & Evidence",
  description:
    "Learn about TrueFact News, our mission to bring transparent credibility scoring to digital news, and our verifiable journalism philosophy.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            About TrueFact News
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Read the news. See the evidence. Check the claim.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            TrueFact News is a modern news and verification platform built on a simple principle: readers deserve transparent credibility information and traceable evidence for every story they consume.
          </p>
        </div>

        {/* Mission & Philosophy */}
        <section className="space-y-6 editorial-prose">
          <h2>Our Core Mission</h2>
          <p>
            In an era of viral misinformation, engagement algorithms frequently amplify sensational or misleading content at the expense of verified reporting. TrueFact News was founded to bridge the gap between fast-moving news cycles and rigorous evidence standards.
          </p>
          <p>
            Instead of presenting information as an unquestionable truth or an opaque AI summary, we break down every article into observable, auditable components: domain reliability history, direct primary citations, multi-source corroboration, and neutral language tone.
          </p>

          <h2>A Strict Truth Distinction</h2>
          <p>
            We maintain an uncompromising separation between:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Automated Credibility Assessments:</strong> Algorithmic scores calculated from multi-source cross-referencing, citation counts, and domain history. These provide an instant signal but are never labelled as &ldquo;fact-checked&rdquo; or &ldquo;true.&rdquo;
            </li>
            <li>
              <strong>Human-Reviewed Fact-Check Verdicts:</strong> Deep investigations performed by professional fact-checkers who examine primary documents, contact involved parties, and attach accredited verdicts.
            </li>
          </ol>

          <h2>Open Architecture &amp; Methodology</h2>
          <p>
            Our credibility calculations use open, weighted criteria that do not favor any political bias, commercial entity, or publishing house. We believe the future of news literacy requires open methodologies and permanent correction archives.
          </p>
        </section>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/methodology"
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 hover:border-[#E5242A] transition-colors"
          >
            <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base mb-1">
              Methodology →
            </h3>
            <p className="text-xs text-gray-500">
              See the exact mathematical formula and 4 scoring dimensions.
            </p>
          </Link>

          <Link
            href="/ratings"
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 hover:border-[#E5242A] transition-colors"
          >
            <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base mb-1">
              Rating System →
            </h3>
            <p className="text-xs text-gray-500">
              Definitions of credibility tiers and fact-checking verdicts.
            </p>
          </Link>

          <Link
            href="/corrections"
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 hover:border-[#E5242A] transition-colors"
          >
            <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base mb-1">
              Corrections Policy →
            </h3>
            <p className="text-xs text-gray-500">
              How we handle errors, updates, and public correction logs.
            </p>
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

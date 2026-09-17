import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Methodology & Credibility Scoring — TrueFact News",
  description:
    "Explore how TrueFact News calculates credibility scores, evaluates evidence quality, and verifies news claims across independent sources.",
};

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            TrueFact Standards &amp; Architecture
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Credibility Scoring Methodology
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Our multi-factor scoring model combines historical domain track records, citation verification, and cross-source corroboration into a transparent 0–100 credibility index.
          </p>
        </div>

        {/* Four Dimensions Breakdown */}
        <section className="space-y-6 editorial-prose">
          <h2>The Four Scoring Dimensions (Method: rules-v2)</h2>
          <p>
            Every story ingested by TrueFact undergoes algorithmic inspection across four core dimensions, weighted according to journalistic importance:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base">
                  1. Source Reliability
                </h3>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">30% Weight</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Evaluates the publisher’s historical correction track record, editorial masthead transparency, domain longevity, and regulatory compliance.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base">
                  2. Evidence Quality
                </h3>
                <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">30% Weight</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Analyzes the presence of direct on-the-record quotes, official document links, primary data filings, and audio/visual provenance.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base">
                  3. Cross Corroboration
                </h3>
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">25% Weight</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Scans independent news agencies and wire services to confirm whether multiple unrelated outlets have independently verified the central assertions.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-bold text-gray-900 dark:text-white text-base">
                  4. Content Neutrality
                </h3>
                <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">15% Weight</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Inspects headline sensationalism, emotionally charged adjectives, clickbait phrasing, and adherence to objective journalistic style.
              </p>
            </div>
          </div>

          <h2>The Mathematical Calculation</h2>
          <p>
            The overall credibility score is computed using the integer-rounded weighted sum formula:
          </p>
          <blockquote className="not-prose rounded-xl bg-gray-100 dark:bg-gray-900 p-4 font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 border-l-4 border-[#E5242A]">
            Score = Math.round( (Source × 0.30) + (Evidence × 0.30) + (Corroboration × 0.25) + (Content × 0.15) )
          </blockquote>

          <h2>Automated Scores vs. Human Fact-Checks</h2>
          <p>
            An automated credibility score is a rapid heuristic designed to help readers assess evidence density at a glance. It does not replace human fact-checking.
          </p>
          <p>
            When a claim is escalated for human fact-checking, a dedicated investigative reporter contacts the source, validates official government or institutional records, and publishes a formal verdict (e.g. <em>True, Mostly True, Mixed, Misleading, Mostly False, False</em>).
          </p>

          <h2>Limitations &amp; Non-Guarantee Notice</h2>
          <p>
            Credibility scores represent an evidence quality rating, not a metaphysical certificate of truth. Breaking stories with limited initial reporting may temporarily reflect lower corroboration scores until secondary confirmation arrives.
          </p>
        </section>

        {/* CTA */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Link href="/ratings" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← Explore Rating System &amp; Score Tiers
          </Link>
          <Link href="/verify" className="rounded-lg bg-[#E5242A] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors">
            Verify a Claim
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Corrections Policy & Public Log — TrueFact News",
  description:
    "Review our transparent corrections policy, version tracking process, and public log of editorial updates.",
};

const CORRECTION_LOG = [
  {
    date: "August 2026",
    article: "Quarterly Clean Energy Grid Integration Report",
    type: "Factual Clarification",
    summary: "Updated regional transmission capacity figures to reflect revised grid operator data from state regulator.",
    version: "v2.0",
  },
  {
    date: "July 2026",
    article: "Global Semiconductor Supply Chain Analysis",
    type: "Source Attribution",
    summary: "Clarified distinction between fab construction approvals and equipment installation schedules.",
    version: "v1.1",
  },
];

export default function CorrectionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Editorial Standards &amp; Accountability
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Corrections Policy &amp; Public Log
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            TrueFact News is committed to complete factual accountability. When an error or ambiguity occurs in our reporting or automated evidence parsing, we correct it promptly and visibly.
          </p>
        </div>

        {/* Policy Section */}
        <section className="space-y-6 editorial-prose">
          <h2>Our Policy on Errors &amp; Corrections</h2>
          <p>
            We believe that acknowledging mistakes transparently is essential to maintaining public trust. We do not quietly overwrite errors or change headlines without an accompanying note.
          </p>

          <h2>Version Increments &amp; Audit Trail</h2>
          <p>
            Whenever an article or published fact check is amended:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Minor typographical edits:</strong> Corrected without version change if factual meaning is unaffected.</li>
            <li><strong>Clarifications:</strong> A clarification note is appended with updated context (e.g. Version 1.1).</li>
            <li><strong>Material corrections:</strong> The article or fact-check review version increments (e.g. Version 2.0) with an explicit box detailing what was originally stated and how it was corrected.</li>
            <li><strong>Retractions:</strong> If a report is fundamentally flawed, the verdict is marked as <em>Retracted</em> with a prominent banner explaining the investigation breakdown.</li>
          </ul>

          <h2>Submit a Correction Request</h2>
          <p>
            If you have identified a factual inaccuracy, misleading context, or a broken citation on TrueFact News, please notify our editorial desk immediately.
          </p>
        </section>

        {/* Submit Form Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-6 sm:p-8 space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
            Request an Editorial Review or Correction
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Provide the article URL and supporting evidence (official records, press links, or primary documents).
          </p>
          <Link
            href="/contact?type=correction"
            className="inline-block rounded-lg bg-[#E5242A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
          >
            Submit Correction Notice →
          </Link>
        </div>

        {/* Public Correction Log */}
        <section className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Recent Public Corrections &amp; Updates Log
          </h2>

          <div className="space-y-3">
            {CORRECTION_LOG.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#E5242A]">{item.type}</span>
                  <span className="font-mono text-gray-400">{item.version} · {item.date}</span>
                </div>
                <h4 className="font-serif font-bold text-gray-900 dark:text-white text-sm">
                  {item.article}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}

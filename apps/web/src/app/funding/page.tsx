import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Funding & Ownership Transparency — TrueFact News",
  description:
    "Review TrueFact News funding structure, ownership disclosure, and our strict non-influence policy on credibility ratings.",
};

export default function FundingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Financial &amp; Governance Transparency
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Funding &amp; Ownership Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            TrueFact News operates as an independent news platform dedicated to objective, evidence-backed reporting and automated credibility assessments.
          </p>
        </div>

        <section className="space-y-6 editorial-prose">
          <h2>Ownership Disclosure</h2>
          <p>
            TrueFact News is operated as an independent digital journalism and research initiative. Our engineering and editorial teams maintain full autonomous control over our algorithms, editorial selection, and published reports.
          </p>

          <h2>Strict Non-Influence Policy</h2>
          <blockquote className="not-prose rounded-2xl bg-red-50/80 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/60 p-6 text-sm text-red-950 dark:text-red-200 space-y-2">
            <strong className="block font-serif text-base font-bold text-[#E5242A]">
              Our Non-Negotiable Independence Rule:
            </strong>
            <p>
              Advertisers, sponsors, commercial partners, financial donors, or political organizations have zero influence over credibility scores, algorithm weights, story rankings, or fact-checking verdicts.
            </p>
          </blockquote>

          <h2>Monetization &amp; Revenue Architecture</h2>
          <p>
            To sustain our high-throughput verification infrastructure and newsroom investigations, TrueFact is structured around:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Reader Support &amp; Memberships:</strong> Voluntary contributions from readers who value transparent, verified news.</li>
            <li><strong>Institutional API Licensing:</strong> Enterprise and research licensing for automated credibility metrics and evidence feeds.</li>
            <li><strong>Transparent Sponsorships:</strong> Any future commercial sponsorships will be clearly separated and labelled, with no impact on editorial scoring.</li>
          </ul>

          <h2>Conflict of Interest Safeguards</h2>
          <p>
            Our journalists and technical staff are prohibited from accepting gifts, sponsored travel, or financial incentives from entities whose claims they investigate.
          </p>
        </section>

        {/* Navigation */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <Link href="/editorial-standards" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← Editorial Independence &amp; Standards
          </Link>
          <Link href="/contact" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Contact Newsroom →
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

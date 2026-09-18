import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getVerdictStyle, getCredibilityTier } from "@/lib/credibilityTokens";

export const metadata = {
  title: "Rating System & Verdict Definitions — TrueFact News",
  description:
    "Learn about TrueFact News credibility tiers (80–100 Teal, 60–79 Blue, 40–59 Amber, 0–39 Red) and standardized human fact-check verdicts.",
};

const TIERS = [
  {
    score: 90,
    range: "80 – 100",
    name: "High Credibility",
    desc: "Exhaustively verified stories with documented primary citations, on-the-record sources, and consistent corroboration across major independent bureaus.",
  },
  {
    score: 70,
    range: "60 – 79",
    name: "Moderate Credibility",
    desc: "Generally reliable reporting with clear attribution, but may rely on secondary sources or partial cross-verification across agencies.",
  },
  {
    score: 50,
    range: "40 – 59",
    name: "Needs Review",
    desc: "Single-source claims, anonymous leaks, or evolving news scenarios where key assertions lack independent confirmation or primary data.",
  },
  {
    score: 25,
    range: "0 – 39",
    name: "Low Credibility",
    desc: "Uncorroborated, retracted, heavily sensationalized, or contradicted reporting with significant evidence discrepancies.",
  },
];

const VERDICTS = [
  { verdict: "true", desc: "The primary claim is completely accurate with no material omissions or distortions." },
  { verdict: "mostly_true", desc: "The statement is accurate overall but needs minor clarification or additional context." },
  { verdict: "mixed", desc: "The claim contains an equal mix of accurate facts and inaccurate or unverified interpretations." },
  { verdict: "misleading", desc: "Contains a grain of truth but takes facts out of context to present a false impression." },
  { verdict: "mostly_false", desc: "Contains significant inaccuracies or is based on flawed logic, with only minor accurate elements." },
  { verdict: "false", desc: "The statement is wholly inaccurate and contradicted by verified factual and primary evidence." },
  { verdict: "unverified", desc: "Insufficient public evidence exists to definitively confirm or debunk the claim." },
];

export default function RatingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Rating System Reference
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Credibility Tiers &amp; Fact-Check Verdicts
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            TrueFact News employs standardized color palettes and clear definitions so readers can instantly understand the verification level of every piece of content.
          </p>
        </div>

        {/* Credibility Tiers */}
        <section className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Automated Credibility Tiers (0–100)
            </h2>
            <p className="text-xs text-gray-500">
              Calculated on every news article via multi-source algorithm inspection.
            </p>
          </div>

          <div className="space-y-3">
            {TIERS.map((tier) => {
              const style = getCredibilityTier(tier.score);
              return (
                <div
                  key={tier.name}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${style.dotColor}`} />
                      <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                        {tier.name}
                      </h3>
                      <span className="font-mono text-xs text-gray-400 font-semibold">({tier.range})</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {tier.desc}
                    </p>
                  </div>

                  <div className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-bold ${style.borderColor} ${style.bgColor} ${style.textColor} self-start sm:self-auto`}>
                    Score {tier.range}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fact-Check Verdicts */}
        <section className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Human-Reviewed Fact-Check Verdicts
            </h2>
            <p className="text-xs text-gray-500">
              Published exclusively after formal review by TrueFact editorial journalists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VERDICTS.map((item) => {
              const vStyle = getVerdictStyle(item.verdict);
              return (
                <div
                  key={item.verdict}
                  className={`rounded-2xl border p-5 space-y-2 ${vStyle.borderColor} ${vStyle.bgColor}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-black uppercase ${vStyle.textColor}`}>
                      {vStyle.icon} {vStyle.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Navigation */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <Link href="/methodology" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            ← View Scoring Methodology
          </Link>
          <Link href="/corrections" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Corrections Policy →
          </Link>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
export const metadata = {
  title: "Subscriptions & Productivity — TrueFact News",
  description:
    "Explore TrueFact News subscription tiers. Public truth, credibility scores, and evidence dossiers remain 100% free forever.",
};

export default function PricingPage() {

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A]">
            Editorial Standards &amp; Subscriptions
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 mb-4">
            Truth Is Free. Productivity Is Pro.
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            At TrueFact News, we believe public access to verified facts, transparent credibility assessments, and evidence dossiers should never be behind a paywall. Subscriptions power personal organization tools for power readers and researchers.
          </p>
        </div>

        {/* Free Truth Guarantee Callout */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 mb-12 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-2 text-emerald-600 dark:text-emerald-400 shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                100% Free Truth Guarantee
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                All readers receive full, unhindered access to our live news feed, four-factor automated credibility assessments, evidence breakdown dossiers, published human fact checks, and claim verification search. We never charge for higher scores, favorable verdicts, or access to public truth.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Free Reader Tier Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Public Tier
                </span>
                <span className="rounded bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Default
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Free Reader
              </h2>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
                ₹0 <span className="text-xs font-normal text-gray-500">forever</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Live Verified News Feed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 4-Factor Credibility Analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Published Human Fact Checks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Evidence Dossiers &amp; Search
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Saved Stories (Authenticated)
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="w-full text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Browse News Feed
            </Link>
          </div>

          {/* Pro Monthly Card */}
          <div className="rounded-xl border-2 border-[#E5242A] bg-white dark:bg-[#0D121F] p-8 shadow-md flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E5242A] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Recommended
            </span>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
                  Pro Productivity
                </span>
                <span className="rounded bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-xs font-semibold text-[#E5242A]">
                  Monthly
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
                TrueFact Pro Monthly
              </h2>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
                Pro <span className="text-xs font-normal text-gray-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[#E5242A] font-bold">✓</span> Everything in Free Reader
                </li>
                <li className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <span className="text-[#E5242A] font-bold">✓</span> Source Publisher Watchlists
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#E5242A] font-bold">✓</span> Priority Domain Alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#E5242A] font-bold">✓</span> Advanced Evidence Exports
                </li>
              </ul>
            </div>

            <Link
              href="/account/billing"
              className="w-full text-center rounded-lg bg-[#E5242A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
            >
              Manage in Account
            </Link>
          </div>

          {/* Pro Annual Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Annual Pass
                </span>
                <span className="rounded bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Annual
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
                TrueFact Pro Annual
              </h2>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
                Pro <span className="text-xs font-normal text-gray-500">/ year</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">✓</span> Full Pro Productivity Suite
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">✓</span> Source Publisher Watchlists
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">✓</span> Saved Stories &amp; Personal Notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">✓</span> Dedicated Editorial Support
                </li>
              </ul>
            </div>

            <Link
              href="/account/billing"
              className="w-full text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Manage in Account
            </Link>
          </div>
        </div>

        {/* Technical Safety Note */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Note:</strong> TrueFact News operates local entitlement authorization for productivity features. No payment scripts or checkout windows execute in client browsers without explicit configuration.
          </p>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

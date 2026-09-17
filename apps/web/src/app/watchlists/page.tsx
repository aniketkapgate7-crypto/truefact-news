import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getBillingMe, getSourceWatchlists } from "@/lib/api";
import { WatchlistsList } from "@/components/user/WatchlistsList";
import { isAuthEnabled } from "@/lib/authConfig";

export const metadata = {
  title: "Source Publisher Watchlists — TrueFact News",
  description: "Monitor news publisher domains and track credibility trends across sources.",
};

export default async function WatchlistsPage() {
  if (!isAuthEnabled()) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Source Watchlists
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Authentication is currently disabled in this environment. All news, credibility assessments, and public claim tools are freely accessible.
            </p>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  const { userId, getToken } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In to Access Watchlists
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Sign in to monitor publisher domains and receive source credibility alerts.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c9181e] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  const token = await getToken();
  const billingMe = token ? await getBillingMe(token) : null;
  const isPro = billingMe?.effective_tier === "pro";

  if (!isPro) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          {/* Pro Lock Card */}
          <div className="rounded-xl border-2 border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#0D121F] p-8 text-center shadow-md">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#E5242A] mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A] block mb-1">
              Pro Entitlement Required
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Source Publisher Watchlists
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
              Source Watchlists enable power readers and researchers to track news publishers, monitor domain credibility scores, and flag evolving sources. Upgrade to TrueFact Pro to activate watchlists.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#E5242A] px-6 py-3 text-sm font-bold text-white hover:bg-[#c9181e] transition-colors"
              >
                Explore Pro Subscriptions
              </Link>
              <Link
                href="/account/billing"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                View Account Billing
              </Link>
            </div>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  const watchlists = token ? await getSourceWatchlists(token) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header Title */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A]">
              Pro Productivity
            </span>
            <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              Active Pro
            </span>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Source Publisher Watchlists
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitored publisher domains and source credibility tracking.
          </p>
        </div>

        <WatchlistsList initialWatchlists={watchlists?.items ?? []} token={token ?? ""} />
      </main>

      <EditorialFooter />
    </div>
  );
}

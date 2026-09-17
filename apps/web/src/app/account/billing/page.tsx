import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getBillingMe } from "@/lib/api";

export const metadata = {
  title: "Billing & Subscriptions — TrueFact News",
  description: "Manage your TrueFact News billing, entitlement tier, and subscription history.",
};

export default async function AccountBillingPage() {
  const isClerkConfigured =
    typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim().length > 0;

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
        <EditorialHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Billing Management
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
            <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In to View Billing
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Sign in to manage your subscription tier and productivity features.
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
  const billingData = token ? await getBillingMe(token) : null;

  const effectiveTier = billingData?.effective_tier ?? "free";
  const capabilities = billingData?.capabilities ?? ["saved_stories"];
  const subscriptions = billingData?.subscriptions ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070A10]">
      <EditorialHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header Title */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5242A]">
              Account &amp; Entitlements
            </span>
            <h1 className="font-serif text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Billing &amp; Subscriptions
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Backend-authoritative subscription status and productivity entitlements.
            </p>
          </div>

          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Account Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Entitlement Status */}
          <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Current Entitlement Status
            </h2>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 mb-6">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
                  Effective Tier
                </span>
                <span className="text-xl font-serif font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                  {effectiveTier} Reader
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                effectiveTier === "pro"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}>
                <span className={`h-2 w-2 rounded-full ${effectiveTier === "pro" ? "bg-emerald-500" : "bg-gray-500"}`} />
                {effectiveTier === "pro" ? "Active Pro" : "Free Public Tier"}
              </span>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Active Productivity Capabilities
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <span className="text-emerald-500 font-bold">✓</span> Saved Stories (Available to all signed-in users)
              </li>
              <li className={`flex items-center gap-2 ${
                capabilities.includes("source_watchlists")
                  ? "text-gray-800 dark:text-gray-200"
                  : "text-gray-400 dark:text-gray-600"
              }`}>
                <span className={capabilities.includes("source_watchlists") ? "text-emerald-500 font-bold" : "text-gray-300 dark:text-gray-700"}>
                  {capabilities.includes("source_watchlists") ? "✓" : "🔒"}
                </span>
                Source Watchlists {capabilities.includes("source_watchlists") ? "(Enabled)" : "(Requires Pro)"}
              </li>
            </ul>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                Subscription Plan
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Explore TrueFact Pro features or review productivity options.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full text-center rounded-lg bg-[#E5242A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
            >
              View Subscription Offerings
            </Link>
          </div>
        </div>

        {/* Subscription History */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Subscription History
          </h2>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                No active or historical subscriptions found for this account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Subscription Reference</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Access Until</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {subscriptions.map((sub) => (
                    <tr key={sub.internal_subscription_id}>
                      <td className="py-3 font-mono text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                        {sub.internal_subscription_id}
                      </td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white uppercase">
                        {sub.plan_slug}
                      </td>
                      <td className="py-3">
                        <span className="capitalize font-medium text-gray-800 dark:text-gray-200">
                          {sub.local_status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {sub.access_until
                          ? new Date(sub.access_until).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

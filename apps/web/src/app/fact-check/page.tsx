import Link from "next/link";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { FactCheckCard } from "@/components/editorial/FactCheckCard";
import { DualScreenChecker } from "@/components/DualScreenChecker";
import { OfficialPortals } from "@/components/OfficialPortals";
import { getPublishedFactChecks, type EditorialFactCheckItem } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fact Checks Hub & Dual-Screen Verification — TrueFact News",
  description:
    "Explore human-reviewed fact checks and verify claims across official portals and international fact-checking databases.",
};

export default async function FactCheckHubPage() {
  let publishedFactChecks: EditorialFactCheckItem[] = [];

  try {
    const factCheckRes = await getPublishedFactChecks(12).catch(() => null);
    if (factCheckRes && Array.isArray(factCheckRes.items)) {
      publishedFactChecks = factCheckRes.items;
    }
  } catch (err) {
    console.error("Failed to load fact checks:", err);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 space-y-12">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5242A]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
                Human-Reviewed Fact Checks &amp; Evidence
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
              Fact Checks Hub &amp; Verification Desk
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Every published fact check below was reviewed by an accredited journalist with primary citations, independent corroboration, and traceable sources.
            </p>
          </div>

          <Link
            href="/verify"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E5242A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#c9181e] self-start md:self-auto transition-all"
          >
            <span>⚡ Verify a New Claim</span>
          </Link>
        </div>

        {/* Published Fact-Checks Grid */}
        <section aria-label="Published Fact Checks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#102A43] dark:text-white">
              Published Fact-Check Investigations
            </h2>
            <span className="text-xs text-gray-400">
              {publishedFactChecks.length} reports published
            </span>
          </div>

          {publishedFactChecks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedFactChecks.map((item) => (
                <FactCheckCard key={item.article_id} factCheck={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-8 text-center space-y-3">
              <span className="text-3xl">🔍</span>
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                No Human-Reviewed Fact Checks Published Yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                TrueFact separates automated credibility scores from human-reviewed fact checks. Submit a viral claim to prompt our editorial desk for verification.
              </p>
              <Link
                href="/verify"
                className="inline-block rounded-lg bg-[#E5242A] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9181e] transition-colors"
              >
                Submit a Claim
              </Link>
            </div>
          )}
        </section>

        {/* Dual-Screen Fact Checker Tool */}
        <section aria-label="Dual-Screen Corroboration Engine" className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Parallel Verification Workspace
            </span>
            <h2 className="font-serif text-2xl font-bold text-gray-950 dark:text-white">
              Dual-Screen Fact Checker &amp; Live Search
            </h2>
            <p className="text-xs text-gray-500 max-w-2xl">
              Inspect claims side-by-side against global databases including Snopes, Boom Live, Alt News, and PIB India.
            </p>
          </div>
          <DualScreenChecker />
        </section>

        {/* Official Portals Directory */}
        <section aria-label="Official Portals" className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <OfficialPortals />
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}

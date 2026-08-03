import { StickyHeader } from "@/components/StickyHeader";
import { BulletTicker } from "@/components/BulletTicker";
import { DualScreenChecker } from "@/components/DualScreenChecker";
import { OfficialPortals } from "@/components/OfficialPortals";
import { tickerItems } from "@/data/mockNews";

export const metadata = {
  title: "Dual-Screen Fact-Checker & Regulatory Verification — TrueFact News",
  description:
    "Verify news claims, quotes, and social media posts using our dual-screen instant corroboration engine across Snopes, Boom Live, Alt News, PolitiFact, and PIB.",
};

export default function FactCheckPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5] dark:bg-[#0d1117]">
      <StickyHeader />
      <BulletTicker items={tickerItems} />

      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Interactive Truth Verification Engine
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
            Dual-Screen Fact-Checker & Multi-Portal Verification
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Paste any text, headline, or claim below to run parallel verification against top global and regional fact-checking databases.
          </p>
        </div>

        {/* Dual-Screen Checker Tool */}
        <DualScreenChecker />

        {/* Official Portals Directory */}
        <OfficialPortals />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 TrueFact News · Multi-Portal Fact Checking Engine Active
      </footer>
    </div>
  );
}

import { StickyHeader } from "@/components/StickyHeader";
import { BulletTicker } from "@/components/BulletTicker";
import { LiveStreamSection } from "@/components/LiveStreamSection";
import { OfficialPortals } from "@/components/OfficialPortals";
import { tickerItems } from "@/data/mockNews";

export const metadata = {
  title: "Live Broadcasts & Real-Time Stream Analysis — TrueFact News",
  description:
    "Watch 24/7 live news streams integrated with real-time automated transcript matching, on-screen red flag scanning, and IFCN fact checks.",
};

export default function LiveNewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5] dark:bg-[#0d1117]">
      <StickyHeader />
      <BulletTicker items={tickerItems} />

      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-500">
              Live Broadcast Center
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
            Live News Streams & Real-Time Verification
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Watch live coverage from major global news networks with automated transcript cross-referencing and claim verification.
          </p>
        </div>

        {/* Live Video Embed Section */}
        <LiveStreamSection />

        {/* Official Portals Directory */}
        <OfficialPortals />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 TrueFact News · Live Broadcast & OCR Analysis Engine Active
      </footer>
    </div>
  );
}

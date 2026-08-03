"use client";

import { useState } from "react";
import { officialPortalDirectory } from "@/data/mockNews";

interface DualScreenCheckerProps {
  initialText?: string;
  headline?: string;
}

export function DualScreenChecker({
  initialText = "World leaders convened an emergency UN session late Tuesday to negotiate ceasefire terms following maritime boundary disputes.",
  headline = "UN Emergency Session Verification",
}: DualScreenCheckerProps) {
  const [inputText, setInputText] = useState(initialText);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "factcheckers" | "official">("all");
  const [verifications, setVerifications] = useState([
    {
      source: "Snopes",
      status: "TRUE",
      confidence: 99,
      detail: "Official record confirms UN Security Council emergency session convened on 2026-07-30.",
      link: "https://www.snopes.com",
    },
    {
      source: "Boom Live",
      status: "TRUE",
      confidence: 96,
      detail: "Press release matched verbatim against UN Secretariat archive.",
      link: "https://www.boomlive.in",
    },
    {
      source: "Alt News",
      status: "VERIFIED",
      confidence: 95,
      detail: "Dual-source verification confirmed no deepfake or misleading audio in video feed.",
      link: "https://www.altnews.in",
    },
    {
      source: "PolitiFact",
      status: "MOSTLY TRUE",
      confidence: 92,
      detail: "Economic impact projections match IMF warning statement.",
      link: "https://www.politifact.com",
    },
    {
      source: "PIB Govt Fact Check",
      status: "OFFICIAL RECORD",
      confidence: 100,
      detail: "Diplomatic registry records show active delegation participation.",
      link: "https://factcheck.pib.gov.in",
    },
  ]);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-gray-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-serif text-lg font-bold tracking-tight">
            Dual-Screen Real-Time Fact-Checker
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-600 text-white uppercase tracking-wider">
            Live Dual Engine
          </span>
        </div>
      </div>

      {/* Dual Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800 min-h-[460px]">
        {/* Screen 1: Original Source Article Text / Input */}
        <div className="p-6 flex flex-col justify-between bg-gray-50/50 dark:bg-gray-950/40">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>📄</span> Left Screen: Source Text / Claim Under Test
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {inputText.length} chars
              </span>
            </div>

            <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white mb-2">
              {headline}
            </h4>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-48 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none leading-relaxed resize-none font-sans"
              placeholder="Paste article claims, quotes, or social media statements here to run instant dual-screen verification..."
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() =>
                setInputText(
                  "World leaders convened an emergency UN session late Tuesday to negotiate ceasefire terms following maritime boundary disputes."
                )
              }
              className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
            >
              Reset to Original Article
            </button>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying Across Portals...
                </>
              ) : (
                <>
                  <span>⚡</span> Run Dual-Screen Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screen 2: Real-time Multi-Portal Corroboration Engine */}
        <div className="p-6 flex flex-col justify-between bg-white dark:bg-gray-900">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>🔍</span> Right Screen: Verified External Results
              </span>
              <div className="flex gap-1">
                {(["all", "factcheckers", "official"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      activeTab === tab
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-10 w-10 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Cross-referencing Snopes, PolitiFact, Boom Live, Alt News & PIB...
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {verifications.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {item.source}
                      </span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.status} ({item.confidence}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Powered by IFCN-Certified Fact Check API</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Dual-Engine Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

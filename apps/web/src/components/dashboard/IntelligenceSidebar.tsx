"use client";

import { useState } from "react";
import Link from "next/link";

export type NavSection = "overview" | "feed" | "watchlist" | "saved" | "sources" | "settings";

interface IntelligenceSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  savedCount: number;
  totalArticlesCount: number;
}

export function IntelligenceSidebar({
  activeSection,
  onSelectSection,
  savedCount,
  totalArticlesCount,
}: IntelligenceSidebarProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <aside className="w-[216px] flex-shrink-0 flex flex-col border-r border-[#1E334A] bg-[#091625] min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1E334A]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DC2626] text-white font-black text-xs">
            TF
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-sans font-bold text-sm tracking-tight text-[#E8EEF8]">
                TRUE<span className="text-[#DC2626]">FACT</span>
              </span>
              <span className="rounded bg-[#38BDF8]/15 px-1 py-0.2 text-[8px] font-mono font-bold text-[#38BDF8]">
                AI
              </span>
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8191A8]">
              News Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#506176]">
          Workspace
        </div>

        {/* Overview */}
        <button
          type="button"
          onClick={() => onSelectSection("overview")}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSection === "overview"
              ? "bg-[#38BDF8]/10 text-[#38BDF8] border-l-2 border-[#38BDF8]"
              : "text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#0D1B2A]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">⚡</span>
            <span>Overview</span>
          </div>
        </button>

        {/* Live Feed */}
        <button
          type="button"
          onClick={() => onSelectSection("feed")}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSection === "feed"
              ? "bg-[#38BDF8]/10 text-[#38BDF8] border-l-2 border-[#38BDF8]"
              : "text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#0D1B2A]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">📡</span>
            <span>Live Feed</span>
          </div>
          {totalArticlesCount > 0 && (
            <span className="rounded bg-[#1E334A] px-1.5 py-0.2 font-mono text-[10px] text-[#8191A8]">
              {totalArticlesCount}
            </span>
          )}
        </button>

        {/* Saved Stories */}
        <button
          type="button"
          onClick={() => onSelectSection("saved")}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSection === "saved"
              ? "bg-[#38BDF8]/10 text-[#38BDF8] border-l-2 border-[#38BDF8]"
              : "text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#0D1B2A]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">📑</span>
            <span>Saved Stories</span>
          </div>
          {savedCount > 0 && (
            <span className="rounded bg-[#38BDF8]/15 px-1.5 py-0.2 font-mono text-[10px] text-[#38BDF8] font-bold">
              {savedCount}
            </span>
          )}
        </button>

        <div className="pt-3 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#506176]">
          Verification Tools
        </div>

        {/* Dual Screen Checker Link */}
        <Link
          href="/fact-check"
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#0D1B2A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">⚖️</span>
            <span>Dual-Screen Verify</span>
          </div>
          <span className="text-[10px] text-[#506176]">↗</span>
        </Link>

        {/* Live Streams Link */}
        <Link
          href="/live"
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-[#8191A8] hover:text-[#E8EEF8] hover:bg-[#0D1B2A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs">🔴</span>
            <span>Live Streams</span>
          </div>
          <span className="text-[10px] text-[#506176]">↗</span>
        </Link>

        {/* Collapsible Secondary "More" Tools */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium text-[#506176] hover:text-[#8191A8] transition-colors"
          >
            <span>Additional modules</span>
            <span className="text-[10px]">{showMore ? "▴" : "▾"}</span>
          </button>

          {showMore && (
            <div className="mt-1 space-y-1 pl-2 border-l border-[#1E334A]/60">
              <div className="px-2 py-1.5 text-[11px] text-[#506176] flex items-center justify-between">
                <span>Source Monitor</span>
                <span className="text-[9px] text-[#506176]">Preview</span>
              </div>
              <div className="px-2 py-1.5 text-[11px] text-[#506176] flex items-center justify-between">
                <span>Review Watchlist</span>
                <span className="text-[9px] text-[#506176]">Preview</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Clean Footer */}
      <div className="p-3 border-t border-[#1E334A] text-[11px] text-[#506176]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px]">FastAPI Ingestion</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" title="Pipeline Active" />
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import type { TruthAnalysis } from "@/data/mockNews";
import { TruthMeter } from "./TruthMeter";
import { SourceVerificationGrid } from "./SourceVerificationGrid";
import { RedFlagsPanel } from "./RedFlagsPanel";
import { BiasAnalysis } from "./BiasAnalysis";
import { DualScreenChecker } from "./DualScreenChecker";
import { OfficialPortals } from "./OfficialPortals";

interface AnalysisDashboardProps {
  truthAnalysis: TruthAnalysis;
  headline?: string;
  bodySnippet?: string;
}

export function AnalysisDashboard({
  truthAnalysis,
  headline,
  bodySnippet,
}: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sources" | "redflags" | "bias" | "dualscreen" | "portals"
  >("overview");

  return (
    <div className="space-y-8 my-8">
      {/* Dashboard Section Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">
              TrueFact Deep Verification Suite
            </span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20">
            Truthiness Baseline Engine v2.4
          </span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight mb-2">
          Comprehensive Credibility & Multi-Source Truth Analysis
        </h2>
        <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
          Cross-referenced against global wire services, Snopes, PolitiFact, Boom Live, Alt News, official government registers, and visual red flag detectors.
        </p>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/10 scrollbar-none">
          {[
            { id: "overview", label: "📊 Truth Meter Overview" },
            { id: "sources", label: "🌐 Multi-Source Grid" },
            { id: "redflags", label: "🚩 Visual Red Flags" },
            { id: "bias", label: "⚖️ Bias & Anchoring" },
            { id: "dualscreen", label: "🖥️ Dual-Screen Checker" },
            { id: "portals", label: "🏛️ Regulatory Portals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6 fade-in">
          <TruthMeter truthAnalysis={truthAnalysis} size="lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RedFlagsPanel redFlags={truthAnalysis.redFlags} />
            <BiasAnalysis biasAnalysis={truthAnalysis.biasAnalysis} />
          </div>
        </div>
      )}

      {activeTab === "sources" && (
        <div className="fade-in">
          <SourceVerificationGrid verifications={truthAnalysis.sourceVerifications} />
        </div>
      )}

      {activeTab === "redflags" && (
        <div className="fade-in">
          <RedFlagsPanel redFlags={truthAnalysis.redFlags} />
        </div>
      )}

      {activeTab === "bias" && (
        <div className="fade-in">
          <BiasAnalysis biasAnalysis={truthAnalysis.biasAnalysis} />
        </div>
      )}

      {activeTab === "dualscreen" && (
        <div className="fade-in">
          <DualScreenChecker
            headline={headline}
            initialText={bodySnippet}
          />
        </div>
      )}

      {activeTab === "portals" && (
        <div className="fade-in">
          <OfficialPortals />
        </div>
      )}
    </div>
  );
}

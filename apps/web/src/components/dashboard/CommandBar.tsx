"use client";

import { useState } from "react";
import { DarkModeToggle } from "../DarkModeToggle";

interface CommandBarProps {
  breadcrumbSection: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  userInitials?: string;
}

export function CommandBar({
  breadcrumbSection,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  userInitials = "TF",
}: CommandBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-13 w-full items-center justify-between border-b border-[#1E334A] bg-[#091625]/95 px-5 backdrop-blur-md">
      {/* Left: Breadcrumbs & Section Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#8191A8] font-medium">Workspace</span>
        <span className="text-[#506176]">/</span>
        <span className="text-[#E8EEF8] font-semibold tracking-tight">
          {breadcrumbSection}
        </span>
      </div>

      {/* Center: Search Field */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className={`flex items-center gap-2 rounded-lg border bg-[#0D1B2A] px-3 py-1.5 transition-colors ${
            isFocused
              ? "border-[#38BDF8] bg-[#112337]"
              : "border-[#1E334A] hover:border-[#2D4A6B]"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 text-[#8191A8] flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search news, topics, or publishers..."
            className="w-full bg-transparent text-xs text-[#E8EEF8] placeholder-[#506176] outline-none"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-[#8191A8] hover:text-[#E8EEF8] text-xs font-bold px-1"
            >
              ✕
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-[#1E334A] bg-[#112337] px-1 py-0.2 font-mono text-[9px] text-[#506176]">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Subtle API Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#8191A8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
          <span>Live API</span>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Reload latest news feed"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E334A] bg-[#0D1B2A] text-[#8191A8] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors disabled:opacity-50"
        >
          <svg
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#38BDF8]" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Theme Toggle */}
        <DarkModeToggle />

        {/* User Badge */}
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1E334A] bg-[#112337] text-[11px] font-bold text-[#38BDF8] select-none">
          {userInitials}
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { DarkModeToggle } from "../DarkModeToggle";
import { UserNavControl } from "../auth/UserNavControl";

const NAV_ITEMS = [
  { label: "Latest", href: "/?category=all" },
  { label: "India", href: "/?region=India" },
  { label: "World", href: "/?region=Global" },
  { label: "Politics", href: "/?category=politics" },
  { label: "Business", href: "/?category=business" },
  { label: "Technology", href: "/?category=tech" },
  { label: "Fact Checks", href: "/fact-check" },
  { label: "Saved", href: "/saved" },
  { label: "Watchlists", href: "/watchlists" },
  { label: "Pricing", href: "/pricing" },
];

export function EditorialHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-[#0B0F17]/95 transition-colors">
      {/* Top utility bar */}
      <div className="border-b border-[#F0F2F5] dark:border-gray-800/80 px-4 py-1.5 text-xs text-[#667085] dark:text-gray-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[#102A43] dark:text-gray-300">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="hidden md:inline text-gray-300 dark:text-gray-700">|</span>
            <span className="hidden md:inline italic">
              Read the news. See the evidence. Check the claim.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/methodology"
              className="hover:text-[#102A43] dark:hover:text-white transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/corrections"
              className="hover:text-[#102A43] dark:hover:text-white transition-colors"
            >
              Corrections
            </Link>
            <Link
              href="/about"
              className="hover:text-[#102A43] dark:hover:text-white transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-baseline gap-2 group select-none">
          <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#102A43] dark:text-white group-hover:text-[#E5242A] transition-colors">
            TRUE<span className="text-[#E5242A]">FACT</span>
          </span>
          <span className="hidden lg:inline text-[11px] font-bold uppercase tracking-widest text-[#667085] dark:text-gray-400 border-l border-gray-300 dark:border-gray-700 pl-2">
            NEWS • EVIDENCE • CREDIBILITY
          </span>
        </Link>

        {/* Action controls & Search */}
        <div className="flex items-center gap-3">
          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search stories"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Theme Toggle */}
          <DarkModeToggle />

          {/* Authentication Controls */}
          <UserNavControl />

          {/* Prominent Verify a Claim CTA */}
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E5242A] px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#c9181e] active:scale-[0.98] transition-all min-h-[38px]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verify a Claim</span>
          </Link>

          {/* Mobile hamburger button (min 44px touch area) */}
          <button
            id="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden transition-colors"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] px-4 py-2.5">
          <form onSubmit={handleSearchSubmit} className="mx-auto max-w-3xl flex items-center gap-2">
            <input
              type="search"
              placeholder="Search verified news by keyword, headline, or claim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5242A]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xs"
            >
              ✕
            </button>
          </form>
        </div>
      )}

      {/* Primary Category Navigation (Desktop) */}
      <nav className="hidden md:block border-t border-[#E5E7EB] dark:border-gray-800">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`inline-flex items-center px-3.5 py-2.5 text-xs lg:text-sm font-bold tracking-tight transition-colors ${
                  item.label === "Fact Checks"
                    ? "text-[#E5242A] hover:text-[#c9181e] font-extrabold"
                    : "text-[#111827] hover:text-[#E5242A] dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {item.label === "Fact Checks" && <span className="mr-1.5">⚡</span>}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Drawer (Accessible with 44px targets) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-[#0B0F17] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <span className="font-serif text-xl font-black text-[#102A43] dark:text-white">
                  TRUE<span className="text-[#E5242A]">FACT</span>
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 mb-4">
                <Link
                  href="/verify"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#E5242A] py-3 text-sm font-bold text-white min-h-[44px]"
                >
                  <span>⚡ Verify a Claim</span>
                </Link>
              </div>

              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center rounded-lg px-3 py-3 text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 space-y-2">
              <Link href="/methodology" onClick={() => setMenuOpen(false)} className="block py-1">
                Methodology &amp; Scoring
              </Link>
              <Link href="/corrections" onClick={() => setMenuOpen(false)} className="block py-1">
                Corrections Policy
              </Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="block py-1">
                About TrueFact News
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

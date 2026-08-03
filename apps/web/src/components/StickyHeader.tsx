"use client";

import Link from "next/link";
import { useState } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

const CATEGORIES = [
  "Breaking",
  "Politics",
  "World",
  "Business",
  "Tech",
  "Science",
  "Sports",
  "Entertainment",
  "Lifestyle",
] as const;

export function StickyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
        {/* Top bar */}
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-2 select-none group">
            <span className="font-serif text-2xl font-black tracking-tight text-gray-950 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
              TRUE<span className="text-red-600">FACT</span>
            </span>
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Truthiness % & Country News Filter
            </span>
          </Link>

          {/* Center feature links (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/live"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Streams
            </Link>

            <Link
              href="/fact-check"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <span>⚡</span>
              Dual-Screen Fact Checker
            </Link>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search icon */}
            <Link
              href="/fact-check"
              aria-label="Search and Verify Claims"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </Link>

            <DarkModeToggle />

            {/* Hamburger (mobile) */}
            <button
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Category nav — desktop */}
        <nav className="hidden md:block border-t border-gray-100 dark:border-gray-800">
          <ul className="mx-auto flex max-w-screen-xl items-center gap-1 overflow-x-auto px-4 sm:px-6 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/?category=${cat.toLowerCase()}`}
                  className={`group inline-flex items-center px-3 py-2.5 text-sm font-semibold tracking-wide transition-colors ${
                    cat === "Breaking"
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {cat === "Breaking" && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {cat}
                  <span className="ml-1 block h-0.5 w-0 bg-red-600 transition-all duration-200 group-hover:w-full rounded-full" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer */}
        <nav
          className={`absolute top-0 right-0 h-full w-72 bg-white dark:bg-gray-950 shadow-2xl transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <span className="font-serif font-black text-lg text-gray-950 dark:text-white">
              TRUE<span className="text-red-600">FACT</span>
            </span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <Link
              href="/live"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Live Broadcast Streams
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/fact-check"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <span>⚡</span> Dual-Screen Fact Checker
              </span>
              <span>→</span>
            </Link>
          </div>

          <ul className="px-4 py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/?category=${cat.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    cat === "Breaking"
                      ? "text-red-600 bg-red-50 dark:bg-red-950/30"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat === "Breaking" && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
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

type StickyHeaderProps = {
  activeCategory?: string | null;
  initialSearchQuery?: string;
};

export function StickyHeader({
  activeCategory = null,
  initialSearchQuery = "",
}: StickyHeaderProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const normalizedActiveCategory =
    CATEGORIES.find(
      (category) =>
        category.toLowerCase() === activeCategory?.toLowerCase(),
    ) ?? null;

  const displayedActiveCategory =
    normalizedActiveCategory ?? "Breaking";

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (!searchOpen) return;

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  const createCategoryHref = (category: (typeof CATEGORIES)[number]) => {
    const params = new URLSearchParams();

    params.set("category", category.toLowerCase());

    if (initialSearchQuery.trim()) {
      params.set("q", initialSearchQuery.trim());
    }

    return `/?${params.toString()}`;
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedQuery = searchQuery.trim();

    if (normalizedActiveCategory) {
      params.set("category", normalizedActiveCategory.toLowerCase());
    }

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    const queryString = params.toString();

    router.push(queryString ? `/?${queryString}` : "/");
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery("");

    const params = new URLSearchParams();

    if (normalizedActiveCategory) {
      params.set("category", normalizedActiveCategory.toLowerCase());
    }

    const queryString = params.toString();

    router.push(queryString ? `/?${queryString}` : "/");
    searchInputRef.current?.focus();
  };

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="group flex select-none items-baseline gap-2"
          >
            <span className="font-serif text-2xl font-black tracking-tight text-gray-950 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-500">
              TRUE<span className="text-red-600">FACT</span>
            </span>

            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:inline">
              Truthiness % &amp; Country News Filter
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/live"
              className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/10 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white dark:text-red-400"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live Streams
            </Link>

            <Link
              href="/fact-check"
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white dark:text-emerald-400"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"
                />
              </svg>
              Dual-Screen Fact Checker
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={
                searchOpen ? "Close news search" : "Search news"
              }
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                searchOpen
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
            >
              {searchOpen ? (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>

            <DarkModeToggle />

            <button
              id="mobile-menu-toggle"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
            >
              {menuOpen ? (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div
            id="site-search-panel"
            className="border-t border-gray-100 bg-white/95 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/95 sm:px-6"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="mx-auto flex max-w-screen-xl gap-2"
            >
              <div className="relative flex-1">
                <svg
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>

                <label htmlFor="site-news-search" className="sr-only">
                  Search news
                </label>

                <input
                  id="site-news-search"
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  maxLength={120}
                  placeholder="Search headlines, topics, sources or countries..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  onChange={(event) => setSearchQuery(event.target.value)}
                />

                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-red-600"
                    onClick={clearSearch}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Search
              </button>
            </form>
          </div>
        )}

        <nav className="hidden border-t border-gray-100 dark:border-gray-800 md:block">
          <ul className="scrollbar-none mx-auto flex max-w-screen-xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
            {CATEGORIES.map((category) => {
              const isActive =
                category === displayedActiveCategory;

              return (
                <li key={category}>
                  <Link
                    href={createCategoryHref(category)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative inline-flex items-center px-3 py-2.5 text-sm font-semibold tracking-wide transition-colors ${
                      isActive
                        ? "text-red-600 dark:text-red-500"
                        : "text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {category === "Breaking" && (
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    )}

                    {category}

                    <span
                      className={`absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full bg-red-600 transition-transform duration-200 ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-40 transition-all duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobileMenu}
        />

        <nav
          aria-label="Mobile navigation"
          className={`absolute right-0 top-0 h-full w-72 transform bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-950 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <span className="font-serif text-lg font-black text-gray-950 dark:text-white">
              TRUE<span className="text-red-600">FACT</span>
            </span>

            <button
              type="button"
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={closeMobileMenu}
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-2 border-b border-gray-100 p-4 dark:border-gray-800">
            <Link
              href="/live"
              onClick={closeMobileMenu}
              className="flex items-center justify-between rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live Broadcast Streams
              </span>

              <span aria-hidden="true">&rarr;</span>
            </Link>

            <Link
              href="/fact-check"
              onClick={closeMobileMenu}
              className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <span className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"
                  />
                </svg>
                Dual-Screen Fact Checker
              </span>

              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <ul className="max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto px-4 py-3">
            {CATEGORIES.map((category) => {
              const isActive =
                category === displayedActiveCategory;

              return (
                <li key={category}>
                  <Link
                    href={createCategoryHref(category)}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-red-50 text-red-600 dark:bg-red-950/30"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {category === "Breaking" && (
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    )}

                    {category}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}

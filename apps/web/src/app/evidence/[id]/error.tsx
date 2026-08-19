"use client";

import Link from "next/link";

import { StickyHeader } from "@/components/StickyHeader";

interface EvidenceErrorProps {
  reset: () => void;
}

export default function EvidenceError({
  reset,
}: EvidenceErrorProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <StickyHeader />

      <main className="mx-auto flex w-full max-w-screen-xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <section className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-950 dark:bg-slate-900 sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700 dark:bg-red-950 dark:text-red-300">
            !
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
            Connection problem
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            We could not load this evidence assessment
          </h1>

          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            The news API may be temporarily unavailable. You can try the
            request again or return to the news dashboard.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>

            <Link
              href="/"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back to news
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
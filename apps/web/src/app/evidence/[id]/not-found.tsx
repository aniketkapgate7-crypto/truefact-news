import Link from "next/link";

import { StickyHeader } from "@/components/StickyHeader";

export default function EvidenceNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <StickyHeader />

      <main className="mx-auto flex w-full max-w-screen-xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-600 dark:text-red-400">
            404
          </p>

          <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
            Evidence page not found
          </h1>

          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            The requested article does not exist, or its identifier is invalid.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Return to news
          </Link>
        </section>
      </main>
    </div>
  );
}
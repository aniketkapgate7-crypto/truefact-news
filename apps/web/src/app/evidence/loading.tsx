import { StickyHeader } from "@/components/StickyHeader";

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export default function LoadingEvidencePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <StickyHeader />

      <main
        className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8"
        aria-busy="true"
      >
        <span className="sr-only">Loading evidence assessment</span>

        <SkeletonBlock className="h-5 w-28" />

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex gap-3">
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-6 w-20" />
          </div>

          <SkeletonBlock className="mt-6 h-12 w-full max-w-4xl" />
          <SkeletonBlock className="mt-3 h-12 w-4/5 max-w-3xl" />

          <div className="mt-6 space-y-3">
            <SkeletonBlock className="h-4 w-full max-w-3xl" />
            <SkeletonBlock className="h-4 w-3/4 max-w-2xl" />
          </div>

          <SkeletonBlock className="mt-7 h-5 w-72" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-5 h-16 w-40" />
            <SkeletonBlock className="mt-5 h-7 w-24" />
            <SkeletonBlock className="mt-7 h-3 w-full" />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <SkeletonBlock className="h-4 w-36" />
            <div className="mt-5 flex gap-3">
              <SkeletonBlock className="h-9 w-28" />
              <SkeletonBlock className="h-9 w-36" />
            </div>
            <SkeletonBlock className="mt-7 h-5 w-full" />
            <SkeletonBlock className="mt-3 h-5 w-5/6" />
            <SkeletonBlock className="mt-6 h-20 w-full" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <SkeletonBlock className="h-9 w-14" />
              <SkeletonBlock className="mt-4 h-5 w-32" />
              <SkeletonBlock className="mt-3 h-4 w-full" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
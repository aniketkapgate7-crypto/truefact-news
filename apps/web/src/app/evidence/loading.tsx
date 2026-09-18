import Link from "next/link";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#112337] border border-[#1E334A]/50 ${className}`}
    />
  );
}

export default function LoadingEvidencePage() {
  return (
    <div className="min-h-screen bg-[#07111F] text-[#E8EEF8]">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1E334A] bg-[#091625]/95 px-6 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-[#8191A8] hover:text-[#38BDF8]"
        >
          <span>←</span>
          <span>Back to Intelligence Dashboard</span>
        </Link>
        <span className="font-mono text-xs text-[#506176]">Loading dossier…</span>
      </header>

      <main
        className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
        aria-busy="true"
      >
        <section className="rounded-2xl border border-[#1E334A] bg-[#0D1B2A] p-6 sm:p-8 space-y-4">
          <div className="flex gap-2">
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-6 w-20" />
          </div>

          <SkeletonBlock className="h-10 w-full max-w-2xl" />
          <SkeletonBlock className="h-4 w-3/4 max-w-xl" />
          <SkeletonBlock className="h-4 w-1/2 max-w-md" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-[#1E334A] bg-[#0D1B2A] p-6 flex flex-col items-center justify-center space-y-4">
            <SkeletonBlock className="h-32 w-32 rounded-full" />
            <SkeletonBlock className="h-6 w-28" />
          </div>

          <div className="rounded-2xl border border-[#1E334A] bg-[#0D1B2A] p-6 sm:p-8 space-y-4">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1E334A] bg-[#0D1B2A] p-5 space-y-2"
            >
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
import Link from "next/link";
import { ReadingProgress } from "@/components/ReadingProgress";
import { StickyHeader } from "@/components/StickyHeader";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill, CredibilityBadge } from "@/components/CredibilityBadge";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { TruthMeter } from "@/components/TruthMeter";
import { ArticleContextSetter } from "@/components/ArticleContextSetter";
import {
  allNewsArticles,
  timeAgo,
  type NewsArticle,
} from "@/data/mockNews";

const TOC = [
  { id: "background", label: "Background" },
  { id: "analysts", label: "What Analysts Say" },
  { id: "economy", label: "Economic Fallout" },
  { id: "next", label: "What Comes Next" },
  { id: "verification-suite", label: "Truth & Verification Suite" },
];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article: NewsArticle =
    allNewsArticles.find((a) => String(a.id) === id) ?? allNewsArticles[0];

  const related = allNewsArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  const bodyParagraphs = (article.body ?? article.summary)
    .split("\n\n")
    .filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5] dark:bg-[#0d1117]">
      {/* Set Active On-Screen Article Context for AI Assistant */}
      <ArticleContextSetter article={article} />

      {/* Reading progress bar — must be before StickyHeader */}
      <ReadingProgress />

      <StickyHeader />

      <main className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to home
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-12 xl:gap-16">
          {/* ── Article Body & Deep Verification ──────────────── */}
          <article>
            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CategoryPill category={article.category} size="md" />
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                {article.countryFlag} {article.region}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {article.readTime} min read
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl xl:text-5xl font-black text-gray-950 dark:text-white leading-tight tracking-tight mb-6">
              {article.headline}
            </h1>

            {/* By-line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white text-xs font-bold">
                  {article.author.charAt(0)}
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {article.author}
                </span>
              </div>
              <span>·</span>
              <span>{article.source}</span>
              <span>·</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <span>·</span>
              <time className="text-xs">{timeAgo(article.publishedAt)}</time>

              <div className="ml-auto">
                <CredibilityBadge score={article.credibilityScore} size="md" />
              </div>
            </div>

            {/* Hero Image */}
            <div className="w-full rounded-2xl bg-gray-900 aspect-[16/7] mb-8 relative overflow-hidden">
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.headline}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${article.imageBg}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 text-xs text-gray-300 font-medium">
                Photo: {article.source} / Getty Images
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-1">
                Share:
              </span>
              {[
                { label: "Twitter / X", color: "hover:bg-black hover:text-white" },
                { label: "LinkedIn", color: "hover:bg-blue-700 hover:text-white" },
                { label: "Copy link", color: "hover:bg-gray-200 dark:hover:bg-gray-700" },
              ].map(({ label, color }) => (
                <button
                  key={label}
                  className={`rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 transition-all ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Article Prose Content */}
            <div className="article-prose">
              {bodyParagraphs.map((block, i) => {
                if (block.startsWith("## ")) {
                  const tocId =
                    TOC.find((t) => block.includes(t.label))?.id ?? `section-${i}`;
                  return (
                    <h2 key={i} id={tocId}>
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                return <p key={i}>{block}</p>;
              })}
            </div>

            {/* ── Comprehensive Truth & Verification Suite ── */}
            <div id="verification-suite" className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <AnalysisDashboard
                truthAnalysis={article.truthAnalysis}
                headline={article.headline}
                bodySnippet={article.summary}
              />
            </div>
          </article>

          {/* ── Sticky Sidebar ───────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[5.5rem] space-y-6">
              {/* Truthiness % Compact Widget */}
              <TruthMeter truthAnalysis={article.truthAnalysis} size="sm" />

              {/* Table of Contents */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                  In this article
                </h3>
                <ul className="space-y-1.5">
                  {TOC.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors py-1 group"
                      >
                        <span className="h-px w-3 bg-gray-300 dark:bg-gray-600 group-hover:bg-red-500 group-hover:w-5 transition-all" />
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Credibility Score Widget */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  Credibility Score
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl font-black font-serif text-gray-950 dark:text-white">
                    {article.credibilityScore}
                    <span className="text-lg text-gray-400 dark:text-gray-500 font-sans font-normal">
                      /100
                    </span>
                  </span>
                  <CredibilityBadge score={article.credibilityScore} size="md" />
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      article.credibilityScore >= 75
                        ? "bg-emerald-500"
                        : article.credibilityScore >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${article.credibilityScore}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  Calculated from 14 global bureaus & fact-checker databases.
                </p>
              </div>

              {/* Related Articles */}
              {related.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 px-1">
                    Related Stories
                  </h3>
                  <div className="space-y-1">
                    {related.map((a) => (
                      <NewsCard key={a.id} article={a} variant="horizontal" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 TrueFact News · Multi-Source Verified Journalism
      </footer>
    </div>
  );
}

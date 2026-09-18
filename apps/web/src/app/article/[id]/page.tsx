import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCredibilityAssessment,
  getNewsArticle,
  getNewsFeed,
  type ApiCredibilityAssessment,
  type ApiNewsArticle,
} from "@/lib/api";
import { normalizeLiveCategory, normalizeRegion } from "@/lib/liveUtils";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { CredibilitySummaryBox } from "@/components/editorial/CredibilitySummaryBox";
import { EditorialNewsCard } from "@/components/editorial/EditorialNewsCard";
import { EditorialArticleImage } from "@/components/editorial/EditorialArticleImage";
import { ReadingProgress } from "@/components/ReadingProgress";
import { getCredibilityTier } from "@/lib/credibilityTokens";
import { ArticleActions } from "@/components/user/ArticleActions";
import type { LiveArticle } from "@/types/news";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return { title: "Article Not Found — TrueFact News" };
  }

  const article = await getNewsArticle(numId).catch(() => null);
  if (!article) {
    return { title: "Article Not Found — TrueFact News" };
  }

  return {
    title: `${article.title} — TrueFact News`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.published_at,
      authors: [article.source_name],
      images: article.image_url ? [{ url: article.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const numId = Number.parseInt(id, 10);

  if (Number.isNaN(numId)) {
    notFound();
  }

  let article: ApiNewsArticle | null = null;
  let assessment: ApiCredibilityAssessment | null = null;
  let relatedArticles: LiveArticle[] = [];

  try {
    const [fetchedArticle, fetchedAssessment] = await Promise.all([
      getNewsArticle(numId),
      getCredibilityAssessment(numId).catch(() => null),
    ]);

    if (!fetchedArticle) {
      notFound();
    }

    article = fetchedArticle;
    assessment = fetchedAssessment;

    // Fetch related stories from the same category
    const feed = await getNewsFeed({
      category: article.category,
      page_size: 4,
    }).catch(() => []);
    relatedArticles = feed
      .filter((a) => a.id !== article!.id)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        source_name: item.source_name,
        source_url: item.source_url,
        image_url: item.image_url ?? null,
        category: normalizeLiveCategory(item.category),
        region: normalizeRegion(item.region),
        published_at: item.published_at,
        evidence_score: item.evidence_score ?? 0,
        credibility_score: item.credibility_score ?? null,
      }));
  } catch (err) {
    console.error("Error fetching article page:", err);
    notFound();
  }

  const tier = getCredibilityTier(article.credibility_score ?? assessment?.credibility_score);
  const formattedDate = new Date(article.published_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Structured Data (JSON-LD) for Google & Search Engines (NewsArticle)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.image_url ? [article.image_url] : [],
    datePublished: article.published_at,
    author: {
      "@type": "Organization",
      name: article.source_name,
    },
    publisher: {
      "@type": "Organization",
      name: "TrueFact News",
      logo: {
        "@type": "ImageObject",
        url: "https://truefactnews.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://truefactnews.com/article/${article.id}`,
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ReadingProgress />
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#E5242A] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href={`/?category=${article.category.toLowerCase()}`} className="hover:text-[#E5242A] transition-colors">
            {article.category}
          </Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">Story #{article.id}</span>
        </nav>

        {/* 1. Category & Region badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#102A43] dark:bg-gray-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {article.category}
          </span>
          <span className="rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {article.region}
          </span>
        </div>

        {/* 2. Editorial Headline (Serif) */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] dark:text-white leading-[1.15] tracking-tight">
          {article.title}
        </h1>

        {/* 3. Standfirst / Summary */}
        <p className="text-lg sm:text-xl font-normal text-[#4B5563] dark:text-gray-300 leading-relaxed border-l-2 border-[#E5242A] pl-4 py-1 italic">
          {article.summary}
        </p>

        {/* 4. Byline, Source, and Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">Source:</span>
            <span className="font-bold text-[#102A43] dark:text-blue-400">{article.source_name}</span>
            <span>·</span>
            <time dateTime={article.published_at}>{formattedDate}</time>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Compact Credibility Tag */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-bold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}>
              <span className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
              <span>{article.credibility_score ? `Credibility ${article.credibility_score}` : "Pending Assessment"}</span>
            </div>

            {/* Authenticated Save / Watch Actions */}
            <ArticleActions articleId={article.id} />
          </div>
        </div>

        {/* 5. Main Article Hero Image */}
        <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 relative">
          <EditorialArticleImage
            src={article.image_url}
            alt={article.title}
            sourceName={article.source_name}
            aspectRatioClass="aspect-[16/9]"
            priority={true}
          />
          <div className="absolute bottom-3 right-3 rounded bg-black/70 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white z-10">
            Photo / Media via {article.source_name}
          </div>
        </div>

        {/* 6. Original Article Link */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-blue-900 dark:text-blue-300">
            <strong className="block font-semibold">Original Publisher Reference</strong>
            <span>This story was originally published by {article.source_name}.</span>
          </div>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] dark:bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors self-start sm:self-auto"
          >
            <span>Read Original Publication</span>
            <span>↗</span>
          </a>
        </div>

        {/* 7. Transparent Credibility Summary Component */}
        <div className="space-y-3 pt-4">
          <h2 className="font-serif text-xl font-bold text-[#102A43] dark:text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Credibility Evaluation &amp; Verification</span>
          </h2>
          <CredibilitySummaryBox assessment={assessment} />
        </div>

        {/* 8. Why this score & Score Rationale with Correct Factor Semantics */}
        {assessment?.explanation && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Why this score?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {assessment.explanation}
            </p>

            {assessment.credibility_reasons && assessment.credibility_reasons.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Key Evaluation Factors:
                </span>
                <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  {assessment.credibility_reasons.map((r, i) => {
                    const msg = (r.message || "").toLowerCase();
                    const code = (r.code || "").toLowerCase();
                    const isNegative =
                      code.includes("contradict") ||
                      code.includes("retract") ||
                      code.includes("dispute") ||
                      code.includes("low") ||
                      code.includes("unreliable") ||
                      msg.includes("contradict") ||
                      msg.includes("retract") ||
                      msg.includes("disputed");
                    const isWarning =
                      code.includes("single") ||
                      code.includes("warn") ||
                      code.includes("lack") ||
                      code.includes("pending") ||
                      code.includes("mixed") ||
                      msg.includes("no independent") ||
                      msg.includes("little supporting") ||
                      msg.includes("lacks") ||
                      msg.includes("single-source") ||
                      msg.includes("pending");

                    const icon = isNegative ? "✕" : isWarning ? "⚠️" : "✓";
                    const colorClass = isNegative
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : isWarning
                      ? "text-amber-600 dark:text-amber-400 font-bold"
                      : "text-teal-600 dark:text-teal-400 font-bold";

                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`flex-shrink-0 text-sm leading-none mt-0.5 ${colorClass}`}>
                          {icon}
                        </span>
                        <span className="leading-relaxed">{r.message}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 9. Supporting & Contradicting Evidence Breakdown with Honest Zero States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supporting Evidence Card */}
          {(assessment?.supporting_evidence_count ?? 0) > 0 ? (
            <div className="rounded-xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
                <span>✓</span>
                <span>Supporting Evidence ({assessment?.supporting_evidence_count})</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Primary documents, verified statements, and multi-agency reporting corroborating key claims.
              </p>
              <Link
                href={`/evidence/${article.id}`}
                className="inline-block pt-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Inspect supporting evidence citations →
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold text-sm">
                <span className="text-amber-500">⏳</span>
                <span>No supporting citations linked yet</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Automated ingestion has not yet connected verified primary citations to this specific story.
              </p>
            </div>
          )}

          {/* Contradicting Records Card */}
          {(assessment?.contradicting_evidence_count ?? 0) > 0 ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <span>⚠️</span>
                <span>Contradicting Records ({assessment?.contradicting_evidence_count})</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Disputed figures, retractions, or conflicting reports identified during automated cross-check.
              </p>
              <Link
                href={`/evidence/${article.id}`}
                className="inline-block pt-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline"
              >
                Inspect conflicting records →
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold text-sm">
                <span className="text-teal-600">✓</span>
                <span>No contradicting records linked</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                No disputed figures or conflicting reports detected across monitored sources. <em className="block text-[11px] mt-1 text-gray-400">*Zero contradicting records does not prove the claim is definitively true.</em>
              </p>
            </div>
          )}
        </div>

        {/* 10. Independent Sources & Citations Action */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
              Full Evidence &amp; Corroboration Suite
            </h4>
            <p className="text-xs text-gray-500">
              Explore primary source documents, citation archives, and algorithmic factor breakdown for this story.
            </p>
          </div>
          <Link
            href={`/evidence/${article.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors self-start sm:self-auto"
          >
            <span>Deep Evidence Breakdown</span>
            <span>→</span>
          </Link>
        </div>

        {/* 11. Corrections or Updates Policy */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 text-xs text-gray-500 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Corrections &amp; Editorial Standards
            </span>
            <Link href="/corrections" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Request a correction
            </Link>
          </div>
          <p className="leading-relaxed">
            TrueFact News is committed to accuracy. If you notice an error in factual details, source attribution, or evidence counts, please submit a correction notice. All updates are logged transparently.
          </p>
        </div>

        {/* 12. Related Stories */}
        {relatedArticles.length > 0 && (
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#102A43] dark:text-white">
              Related Stories in {article.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <EditorialNewsCard key={rel.id} article={rel} variant="standard" />
              ))}
            </div>
          </div>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}

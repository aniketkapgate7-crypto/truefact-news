import Link from "next/link";
import { getCredibilityTier } from "@/lib/credibilityTokens";
import { EditorialArticleImage } from "./EditorialArticleImage";
import type { LiveArticle } from "@/types/news";

interface EditorialNewsCardProps {
  article: LiveArticle;
  variant?: "standard" | "compact" | "lead" | "horizontal";
  featured?: boolean;
}

function timeAgo(dateString: string): string {
  try {
    const published = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return published.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

export function EditorialNewsCard({
  article,
  variant = "standard",
}: EditorialNewsCardProps) {
  const tier = getCredibilityTier(article.credibility_score);
  const formattedTime = timeAgo(article.published_at);
  const isLowScore = typeof article.credibility_score === "number" && article.credibility_score < 60;

  if (variant === "lead") {
    return (
      <article className="group relative flex flex-col md:grid md:grid-cols-12 gap-6 rounded-2xl border border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all">
        {/* Hero Image */}
        <div className="md:col-span-7 aspect-[16/10] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 relative">
          <EditorialArticleImage
            src={article.image_url}
            alt={article.title}
            sourceName={article.source_name}
            aspectRatioClass="aspect-[16/10]"
            priority={true}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="rounded-md bg-[#102A43]/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              {article.category}
            </span>
            <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-1 text-[11px] font-medium text-gray-200">
              {article.region}
            </span>
          </div>
        </div>

        {/* Content Column */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-xs text-[#E5242A]">LEAD STORY</span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <time className="text-xs text-[#667085] dark:text-gray-400">{formattedTime}</time>
            </div>

            <Link href={`/article/${article.id}`} className="block group-hover:text-[#E5242A] transition-colors">
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#111827] dark:text-white leading-tight mb-3">
                {article.title}
              </h2>
            </Link>

            <p className="text-sm text-[#4B5563] dark:text-gray-300 line-clamp-3 leading-relaxed mb-4">
              {article.summary}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col text-xs text-[#667085] dark:text-gray-400">
              <span className="font-semibold text-[#111827] dark:text-gray-200">{article.source_name}</span>
              <span className="text-[10px] text-gray-400">Automated assessment</span>
            </div>

            {/* Compact Credibility Score */}
            <div className="flex items-center gap-2">
              {isLowScore && (
                <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Needs verification
                </span>
              )}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}
                title={
                  article.credibility_score !== null && article.credibility_score !== undefined
                    ? `Automated Credibility Assessment: ${article.credibility_score}/100`
                    : "Credibility assessment pending"
                }
              >
                <span className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
                <span>
                  {article.credibility_score !== null && article.credibility_score !== undefined
                    ? `Credibility ${Math.round(article.credibility_score)}`
                    : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group flex gap-4 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all">
        <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
          <EditorialArticleImage
            src={article.image_url}
            alt={article.title}
            sourceName={article.source_name}
            aspectRatioClass="h-full w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
            <span className="font-bold text-[#102A43] dark:text-gray-300">{article.category}</span>
            <span>·</span>
            <span>{formattedTime}</span>
          </div>
          <Link href={`/article/${article.id}`} className="block">
            <h3 className="font-serif text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#E5242A] transition-colors">
              {article.title}
            </h3>
          </Link>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">{article.source_name}</span>
            {article.credibility_score !== null && article.credibility_score !== undefined ? (
              <span className={`text-[10px] font-bold ${tier.textColor}`}>
                Credibility {Math.round(article.credibility_score)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">Automated</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col rounded-xl border border-[#E5E7EB] dark:border-gray-800 bg-white dark:bg-[#0E131F] overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Image Banner */}
      <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        <EditorialArticleImage
          src={article.image_url}
          alt={article.title}
          sourceName={article.source_name}
          aspectRatioClass="aspect-[16/9]"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
          <span className="rounded bg-black/75 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {article.category}
          </span>
          <span className="rounded bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-800 dark:text-gray-200">
            {article.region}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-[#667085] dark:text-gray-400 mb-2">
            <span className="font-semibold text-[#111827] dark:text-gray-200">{article.source_name}</span>
            <time>{formattedTime}</time>
          </div>

          <Link href={`/article/${article.id}`} className="block group-hover:text-[#E5242A] transition-colors">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#111827] dark:text-white leading-snug mb-2">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">
            {article.summary}
          </p>
        </div>

        {/* Footer info & Compact Credibility */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Automated assessment
          </span>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tier.borderColor} ${tier.bgColor} ${tier.textColor}`}
            title={
              article.credibility_score !== null && article.credibility_score !== undefined
                ? `Automated Credibility Score: ${article.credibility_score}/100`
                : "Assessment pending"
            }
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tier.dotColor}`} />
            <span>
              {article.credibility_score !== null && article.credibility_score !== undefined
                ? `Credibility ${Math.round(article.credibility_score)}`
                : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

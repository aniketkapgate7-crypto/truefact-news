import Link from "next/link";
import { getVerdictStyle } from "@/lib/credibilityTokens";
import type { EditorialFactCheckItem } from "@/lib/api";

interface FactCheckCardProps {
  factCheck: EditorialFactCheckItem;
}

export function FactCheckCard({ factCheck }: FactCheckCardProps) {
  const verdictStyle = getVerdictStyle(factCheck.verdict);
  const formattedDate = factCheck.review_published_at
    ? new Date(factCheck.review_published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : factCheck.published_at
    ? new Date(factCheck.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently verified";

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-5 shadow-sm hover:shadow-md transition-all">
      <div>
        {/* Top metadata & Verdict Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5242A]">
              Fact Check
            </span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>

          {/* Published Verdict Pill */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wide ${verdictStyle.borderColor} ${verdictStyle.bgColor} ${verdictStyle.textColor}`}
          >
            <span>{verdictStyle.icon}</span>
            <span>{verdictStyle.label}</span>
          </span>
        </div>

        {/* Claim Quote */}
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
            Claim Investigated:
          </span>
          <Link href={`/fact-check/${factCheck.article_id}`} className="block mt-1 group-hover:text-[#E5242A] transition-colors">
            <h3 className="font-serif text-base sm:text-lg font-bold text-gray-950 dark:text-white leading-snug line-clamp-2">
              “{factCheck.claim}”
            </h3>
          </Link>
        </div>

        {/* Claim Origin */}
        {factCheck.claimant && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <strong className="text-gray-700 dark:text-gray-300">Origin / Shared by:</strong> {factCheck.claimant}
          </p>
        )}

        {/* Concise Conclusion */}
        {factCheck.conclusion && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed bg-[#F6F7F9] dark:bg-gray-900/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800 mb-4">
            <strong className="text-gray-900 dark:text-white font-semibold">Our Conclusion: </strong>
            {factCheck.conclusion}
          </p>
        )}
      </div>

      {/* Reviewer Attribution and Traceable link */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Reviewed by <strong className="text-gray-700 dark:text-gray-300">{factCheck.reviewer_name}</strong>
        </span>

        <Link
          href={`/fact-check/${factCheck.article_id}`}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          <span>Full Evidence</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

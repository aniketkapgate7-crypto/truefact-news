import Link from "next/link";
import { type NewsArticle } from "@/data/mockNews";
import { NewsCard } from "./NewsCard";

interface CategorySectionProps {
  title: string;
  articles: NewsArticle[];
  viewAllHref?: string;
}

export function CategorySection({ title, articles, viewAllHref }: CategorySectionProps) {
  return (
    <section aria-labelledby={`section-${title}`} className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-red-600" />
          <h2
            id={`section-${title}`}
            className="font-serif text-xl font-bold text-gray-900 dark:text-white tracking-tight"
          >
            {title}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            View all
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    </section>
  );
}

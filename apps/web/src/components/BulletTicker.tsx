import { type TickerItem } from "@/data/mockNews";

interface BulletTickerProps {
  items: TickerItem[];
}

const categoryDots: Record<string, string> = {
  Breaking:  "bg-red-500",
  Politics:  "bg-blue-500",
  World:     "bg-teal-500",
  Business:  "bg-emerald-500",
  Tech:      "bg-violet-500",
  Lifestyle: "bg-rose-500",
};

export function BulletTicker({ items }: BulletTickerProps) {
  // Duplicate items so the seamless loop works
  const doubled = [...items, ...items];

  return (
    <div className="relative flex items-stretch overflow-hidden border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* LIVE label */}
      <div className="flex shrink-0 items-center gap-2 bg-red-600 px-4 py-2.5 z-10">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-widest text-white whitespace-nowrap">
          Live
        </span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden py-2">
        <div className="ticker-track gap-0">
          {doubled.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2.5 px-6 text-sm text-gray-700 dark:text-gray-300">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${categoryDots[item.category] ?? "bg-gray-400"}`} />
              {item.text}
              <span className="mx-2 text-gray-300 dark:text-gray-600 select-none">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute left-[88px] top-0 h-full w-12 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10" />
    </div>
  );
}

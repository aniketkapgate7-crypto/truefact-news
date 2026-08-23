"use client";

import { LIVE_REGION_LIST } from "@/types/news";
import type { LiveRegion } from "@/types/news";

interface RegionFilterBarProps {
  selectedRegion: LiveRegion | "All";
  onSelectRegion: (region: LiveRegion | "All") => void;
}

export function RegionFilterBar({
  selectedRegion,
  onSelectRegion,
}: RegionFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0 mr-1 flex items-center gap-1">
        <span>📍</span> Filter by Country:
      </span>

      {LIVE_REGION_LIST.map((item) => {
        const isSelected = selectedRegion === item.code;

        return (
          <button
            key={item.id}
            onClick={() => onSelectRegion(item.code)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isSelected
                ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
            }`}
          >
            <span className="text-sm leading-none">{item.flag}</span>
            <span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { officialPortalDirectory } from "@/data/mockNews";

export function OfficialPortals() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5 gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Official Regulatory & Fact-Checking Portals Directory
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Direct access to IFCN-certified independent checkers, government bureaus, and global health authorities.
          </p>
        </div>

        {/* Quick Query Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search claim across portals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officialPortalDirectory.map((portal, idx) => {
          const finalSearchUrl = searchQuery.trim()
            ? `${portal.searchUrl}${encodeURIComponent(searchQuery.trim())}`
            : portal.url;

          return (
            <div
              key={idx}
              className="flex flex-col justify-between p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 hover:border-red-500/50 transition-all hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-7 w-7 rounded-lg ${portal.color} text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0`}
                    >
                      {portal.logoText.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {portal.name}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {portal.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {portal.badge}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  {portal.description}
                </p>
              </div>

              <a
                href={finalSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
              >
                <span>{searchQuery.trim() ? `Search "${searchQuery.slice(0, 15)}..."` : "Open Portal"}</span>
                <span>↗</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

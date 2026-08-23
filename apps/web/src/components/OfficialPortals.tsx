"use client";

import { useState } from "react";

/** Static portal directory — no mock-news dependency */
const officialPortalDirectory = [
  {
    name: "Snopes",
    type: "Fact-Checker Portal",
    url: "https://www.snopes.com",
    searchUrl: "https://www.snopes.com/?s=",
    logoText: "Snopes",
    color: "bg-red-600",
    badge: "IFCN Certified",
    description: "Oldest and largest online fact-checking site.",
  },
  {
    name: "Boom Live",
    type: "Fact-Checker Portal",
    url: "https://www.boomlive.in",
    searchUrl: "https://www.boomlive.in/search?q=",
    logoText: "BOOM",
    color: "bg-amber-600",
    badge: "IFCN Certified",
    description:
      "Independent digital fact-checking organization combating misinformation.",
  },
  {
    name: "Alt News",
    type: "Fact-Checker Portal",
    url: "https://www.altnews.in",
    searchUrl: "https://www.altnews.in/?s=",
    logoText: "Alt News",
    color: "bg-blue-600",
    badge: "IFCN Certified",
    description:
      "Dedicated to debunking fake news, viral claims, and media bias.",
  },
  {
    name: "PolitiFact",
    type: "Fact-Checker Portal",
    url: "https://www.politifact.com",
    searchUrl: "https://www.politifact.com/search/?q=",
    logoText: "PolitiFact",
    color: "bg-indigo-600",
    badge: "Pulitzer Winner",
    description: "Truth-O-Meter rating scale for political statements.",
  },
  {
    name: "Google Fact Check Explorer",
    type: "Aggregator API",
    url: "https://toolbox.google.com/factcheck/explorer",
    searchUrl:
      "https://toolbox.google.com/factcheck/explorer/search/",
    logoText: "Google FC",
    color: "bg-emerald-600",
    badge: "Global Index",
    description: "Search claims indexed by Google Fact Check Markup.",
  },
  {
    name: "PIB Fact Check (Government)",
    type: "Official Regulatory",
    url: "https://factcheck.pib.gov.in",
    searchUrl: "https://factcheck.pib.gov.in",
    logoText: "PIB Govt",
    color: "bg-purple-600",
    badge: "Official Govt",
    description:
      "Official press bureau fact-checking unit for government policies.",
  },
  {
    name: "WHO Mythbusters",
    type: "Health & Official",
    url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
    searchUrl:
      "https://www.who.int/home/search?indexCatalog=genericsearch&searchQuery=",
    logoText: "WHO",
    color: "bg-sky-600",
    badge: "UN Health",
    description: "Official World Health Organization health verification.",
  },
];

export function OfficialPortals() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5 gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Official Regulatory &amp; Fact-Checking Portals Directory
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Direct access to IFCN-certified independent checkers, government
            bureaus, and global health authorities.
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
                <span>
                  {searchQuery.trim()
                    ? `Search "${searchQuery.slice(0, 15)}..."`
                    : "Open Portal"}
                </span>
                <span>↗</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export function ShareReportButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {copied ? "Link Copied! ✓" : "Copy Link 🔗"}
    </button>
  );
}

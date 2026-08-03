"use client";

import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    const isDark = current === "dark";
    requestAnimationFrame(() => {
      setDark(isDark);
    });
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("tf-theme", next); } catch { /* ignore */ }
    setDark(!dark);
  }

  return (
    <button
      id="dark-mode-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
    >
      {/* Sun icon */}
      <svg
        className={`absolute h-5 w-5 transition-all duration-300 ${dark ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <circle cx="12" cy="12" r="5" />
        <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon icon */}
      <svg
        className={`absolute h-5 w-5 transition-all duration-300 ${dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"}`}
        fill="currentColor" viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

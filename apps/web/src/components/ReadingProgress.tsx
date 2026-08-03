"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const bar = barRef.current;
      if (!bar) return;

      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      bar.style.width = `${pct}%`;
      bar.style.opacity = scrollTop > 80 ? "1" : "0";
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      id="reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      style={{ opacity: 0, transition: "width 0.08s linear, opacity 0.3s ease" }}
    />
  );
}

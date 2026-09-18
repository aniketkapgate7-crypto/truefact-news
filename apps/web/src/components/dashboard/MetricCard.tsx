"use client";

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext: string;
  icon?: string;
  trend?: string;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
}: MetricCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value || "—";

  return (
    <div className="rounded-xl border border-[#1E334A] bg-[#0D1B2A] p-3.5 transition-colors hover:border-[#2D4A6B]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#8191A8]">
          {label}
        </span>
        {trend && (
          <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.2 rounded">
            {trend}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-[#E8EEF8]">
          {displayValue}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-[#506176] truncate">
        {subtext}
      </p>
    </div>
  );
}

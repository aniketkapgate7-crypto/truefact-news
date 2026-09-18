/**
 * Design system credibility tokens and color mappings for TrueFact News Web.
 */

export interface CredibilityTier {
  label: string;
  badgeLabel: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
  hexColor: string;
  barColor: string;
}

export function getCredibilityTier(score: number | null | undefined): CredibilityTier {
  if (score === null || score === undefined || score < 0) {
    return {
      label: "Pending Assessment",
      badgeLabel: "Pending",
      textColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-gray-300 dark:border-gray-700",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      dotColor: "bg-gray-400",
      hexColor: "#667085",
      barColor: "bg-gray-400",
    };
  }

  if (score >= 80) {
    return {
      label: "High Credibility",
      badgeLabel: "High",
      textColor: "text-teal-700 dark:text-teal-400",
      borderColor: "border-teal-300 dark:border-teal-700/60",
      bgColor: "bg-teal-50 dark:bg-teal-950/40",
      dotColor: "bg-teal-600 dark:bg-teal-400",
      hexColor: "#0D9488",
      barColor: "bg-teal-600 dark:bg-teal-500",
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate Credibility",
      badgeLabel: "Moderate",
      textColor: "text-blue-700 dark:text-blue-400",
      borderColor: "border-blue-300 dark:border-blue-700/60",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      dotColor: "bg-blue-600 dark:bg-blue-400",
      hexColor: "#2563EB",
      barColor: "bg-blue-600 dark:bg-blue-500",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Review",
      badgeLabel: "Needs Review",
      textColor: "text-amber-700 dark:text-amber-400",
      borderColor: "border-amber-300 dark:border-amber-700/60",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      dotColor: "bg-amber-600 dark:bg-amber-400",
      hexColor: "#D97706",
      barColor: "bg-amber-500 dark:bg-amber-500",
    };
  }

  return {
    label: "Low Credibility",
    badgeLabel: "Low",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-300 dark:border-red-700/60",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    dotColor: "bg-red-600 dark:bg-red-400",
    hexColor: "#E5242A",
    barColor: "bg-red-600 dark:bg-red-500",
  };
}

export function getConfidenceBadgeClass(confidence: string | null | undefined): string {
  switch (confidence?.toLowerCase()) {
    case "high":
      return "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700/50 dark:bg-teal-950/40 dark:text-teal-400";
    case "medium":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-950/40 dark:text-blue-400";
    case "low":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-400";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

export interface VerdictStyle {
  label: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  icon: string;
}

export function getVerdictStyle(verdict: string | null | undefined): VerdictStyle {
  const norm = verdict?.toLowerCase().replaceAll("-", "_").trim();

  switch (norm) {
    case "true":
      return {
        label: "True",
        textColor: "text-emerald-800 dark:text-emerald-300",
        borderColor: "border-emerald-300 dark:border-emerald-700",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        icon: "✓",
      };
    case "mostly_true":
      return {
        label: "Mostly True",
        textColor: "text-teal-800 dark:text-teal-300",
        borderColor: "border-teal-300 dark:border-teal-700",
        bgColor: "bg-teal-50 dark:bg-teal-950/50",
        icon: "✓",
      };
    case "mixed":
      return {
        label: "Mixed",
        textColor: "text-amber-800 dark:text-amber-300",
        borderColor: "border-amber-300 dark:border-amber-700",
        bgColor: "bg-amber-50 dark:bg-amber-950/50",
        icon: "⚖",
      };
    case "misleading":
      return {
        label: "Misleading",
        textColor: "text-orange-800 dark:text-orange-300",
        borderColor: "border-orange-300 dark:border-orange-700",
        bgColor: "bg-orange-50 dark:bg-orange-950/50",
        icon: "⚠️",
      };
    case "mostly_false":
      return {
        label: "Mostly False",
        textColor: "text-rose-800 dark:text-rose-300",
        borderColor: "border-rose-300 dark:border-rose-700",
        bgColor: "bg-rose-50 dark:bg-rose-950/50",
        icon: "✕",
      };
    case "false":
      return {
        label: "False",
        textColor: "text-red-800 dark:text-red-300",
        borderColor: "border-red-300 dark:border-red-700",
        bgColor: "bg-red-50 dark:bg-red-950/50",
        icon: "✕",
      };
    case "unverified":
    default:
      return {
        label: "Unverified",
        textColor: "text-gray-800 dark:text-gray-300",
        borderColor: "border-gray-300 dark:border-gray-700",
        bgColor: "bg-gray-100 dark:bg-gray-800",
        icon: "?",
      };
  }
}

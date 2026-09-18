/**
 * TrueFact News Mobile Theme Tokens
 * Futuristic AI Intelligence Dashboard Palette
 */

export const COLORS = {
  bgMain: "#07111F",
  bgHeader: "#091625",
  bgPanel: "#0D1B2A",
  bgRaised: "#112337",
  borderSubtle: "#1E334A",
  borderHover: "#2D4A6B",

  // Accents
  accentCyan: "#38BDF8",
  accentBlue: "#0284C7",

  // Credibility Tiers
  credTeal: "#2DD4BF",
  credCyan: "#38BDF8",
  credAmber: "#F59E0B",
  credRed: "#FB7185",
  credPending: "#64748B",

  // Brand
  brandRed: "#DC2626",

  // Typography
  textPrimary: "#E8EEF8",
  textMuted: "#8191A8",
  textDim: "#506176",
};

export function getCredibilityColor(score: number | null | undefined): string {
  if (score == null || score <= 0) return COLORS.credPending;
  if (score >= 80) return COLORS.credTeal;
  if (score >= 60) return COLORS.credCyan;
  if (score >= 40) return COLORS.credAmber;
  return COLORS.credRed;
}

export function getCredibilityLabel(score: number | null | undefined): string {
  if (score == null || score <= 0) return "Pending";
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Needs Review";
  return "Low";
}

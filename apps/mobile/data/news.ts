import type { NewsStory } from "@/types/news";

export const NEWS_STORIES: NewsStory[] = [
  {
    id: "story-1",
    headline: "New AI research initiative announced",
    summary:
      "Researchers introduced a collaborative program focused on safer and more transparent artificial intelligence.",
    source: "Technology Daily",
    sourceUrl: "https://example.com/ai-research",
    category: "Tech",
    region: "Global",
    publishedAt: "2026-07-25T10:30:00Z",
    credibilityScore: 92,
    credibilityLabel: "Highly credible",
    comments: 128,
    reposts: 347,
    platforms: ["YouTube", "X"],
  },
  {
    id: "story-2",
    headline: "Clean-energy project enters testing phase",
    summary:
      "A large renewable-energy project has started its first public testing phase.",
    source: "World Report",
    sourceUrl: "https://example.com/clean-energy",
    category: "Science",
    region: "Europe",
    publishedAt: "2026-07-25T08:15:00Z",
    credibilityScore: 81,
    credibilityLabel: "Credible",
    comments: 74,
    reposts: 196,
    platforms: ["Instagram", "YouTube"],
  },
  {
    id: "story-3",
    headline: "Unconfirmed technology claim spreads online",
    summary:
      "A viral post is gaining attention, but independent sources have not confirmed its main claim.",
    source: "Social Media",
    sourceUrl: "https://example.com/unconfirmed-claim",
    category: "Tech",
    region: "North America",
    publishedAt: "2026-07-25T06:45:00Z",
    credibilityScore: 38,
    credibilityLabel: "Unverified",
    comments: 512,
    reposts: 1043,
    platforms: ["X", "Instagram"],
  },
];

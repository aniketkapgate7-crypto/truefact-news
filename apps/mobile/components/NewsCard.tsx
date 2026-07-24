import { StyleSheet, Text, View } from "react-native";

import type { NewsStory } from "@/types/news";

type NewsCardProps = {
  story: NewsStory;
};

function getScoreColor(score: number) {
  if (score >= 85) return "#20E3B2";
  if (score >= 65) return "#FACC15";
  return "#FB7185";
}

export function NewsCard({ story }: NewsCardProps) {
  const scoreColor = getScoreColor(story.credibilityScore);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.source}>{story.source}</Text>
          <Text style={styles.time}>
            {new Date(story.publishedAt).toLocaleString()}
          </Text>
        </View>

        <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
          <Text style={[styles.score, { color: scoreColor }]}>
            {story.credibilityScore}%
          </Text>
        </View>
      </View>

      <Text style={[styles.credibilityLabel, { color: scoreColor }]}>
        {story.credibilityLabel}
      </Text>

      <Text style={styles.headline}>{story.headline}</Text>
      <Text style={styles.summary}>{story.summary}</Text>

      <View style={styles.platformRow}>
        {story.platforms.map((platform) => (
          <View key={platform} style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform}</Text>
          </View>
        ))}
      </View>

      <View style={styles.engagementRow}>
        <Text style={styles.engagement}>
          💬 {story.comments.toLocaleString()} comments
        </Text>

        <Text style={styles.engagement}>
          ↗ {story.reposts.toLocaleString()} reposts
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0E1D30",
    borderColor: "#1D3855",
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  source: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  time: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  score: {
    fontSize: 12,
    fontWeight: "900",
  },
  credibilityLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 18,
    textTransform: "uppercase",
  },
  headline: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: 8,
  },
  summary: {
    color: "#9AABC0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  platformBadge: {
    backgroundColor: "#132A43",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  platformText: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "700",
  },
  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: "#1D3855",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  engagement: {
    color: "#7F91A8",
    fontSize: 11,
    fontWeight: "600",
  },
});

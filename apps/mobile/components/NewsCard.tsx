import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { COLORS, getCredibilityColor, getCredibilityLabel } from "@/constants/theme";
import type { NewsStory } from "@/types/news";

type NewsCardProps = {
  story: NewsStory;
};

function formatRelativeTime(dateString: string): string {
  try {
    const published = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - published.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recent";
  }
}

export function NewsCard({ story }: NewsCardProps) {
  const scoreColor = getCredibilityColor(story.credibilityScore);
  const scoreLabel = getCredibilityLabel(story.credibilityScore);
  const timeAgo = formatRelativeTime(story.publishedAt);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      onPress={() => router.push(`/article/${story.id}`)}
      style={styles.pressWrapper}
    >
      <Animated.View
        style={[
          styles.card,
          animStyle,
        ]}
      >
        {/* Top Header: Source, Time, Score */}
        <View style={styles.topRow}>
          <View style={styles.sourceGroup}>
            <Text style={styles.sourceName}>{story.source}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>

          {/* Credibility Score Badge */}
          <View
            style={[
              styles.scoreBadge,
              { borderColor: `${scoreColor}50`, backgroundColor: `${scoreColor}15` },
            ]}
          >
            <View style={[styles.scoreDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {story.credibilityScore != null && story.credibilityScore > 0
                ? `${Math.round(story.credibilityScore)}% ${scoreLabel}`
                : "Pending"}
            </Text>
          </View>
        </View>

        {/* Thumbnail Preview + Headline Row */}
        <View style={styles.middleRow}>
          {story.imageUrl ? (
            <Image
              source={{ uri: story.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackThumbnail}>
              <Text style={styles.fallbackIcon}>📰</Text>
              <Text style={styles.fallbackText}>{story.category}</Text>
            </View>
          )}

          <View style={styles.headlineBlock}>
            <Text style={styles.headline} numberOfLines={3}>
              {story.headline}
            </Text>
          </View>
        </View>

        {/* Summary Snippet */}
        {story.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {story.summary}
          </Text>
        ) : null}

        {/* Bottom Metadata & Actions */}
        <View style={styles.bottomRow}>
          <View style={styles.metaPills}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{story.category}</Text>
            </View>
            {story.region ? (
              <View style={styles.regionBadge}>
                <Text style={styles.regionBadgeText}>{story.region}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionPrompt}>
            <Text style={styles.actionPromptText}>Inspect Evidence →</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrapper: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 14,
    padding: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sourceGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  sourceName: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: "700",
  },
  dot: {
    color: COLORS.textDim,
    fontSize: 11,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
  },
  scoreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  middleRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  thumbnail: {
    width: 76,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.bgMain,
  },
  fallbackThumbnail: {
    width: 76,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  fallbackIcon: {
    fontSize: 16,
  },
  fallbackText: {
    color: COLORS.textDim,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  headlineBlock: {
    flex: 1,
  },
  headline: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  summary: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 51, 74, 0.5)",
    marginTop: 8,
    paddingTop: 6,
  },
  metaPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  categoryBadge: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  categoryBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  regionBadge: {
    backgroundColor: COLORS.bgRaised,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  regionBadgeText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  actionPrompt: {
    paddingVertical: 2,
  },
  actionPromptText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: "700",
  },
});

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/theme";
import type { NewsCategory } from "@/types/news";

export type MobileFeedMode = "all" | "high_credibility" | "needs_review" | "pending";

interface IntelligenceFilterBarProps {
  feedMode: MobileFeedMode;
  onSelectFeedMode: (mode: MobileFeedMode) => void;
  selectedCategory: NewsCategory | "All";
  onSelectCategory: (cat: NewsCategory | "All") => void;
}

const FEED_MODES: { id: MobileFeedMode; label: string }[] = [
  { id: "all", label: "All Stories" },
  { id: "high_credibility", label: "High Confidence (80%+)" },
  { id: "needs_review", label: "Needs Review" },
  { id: "pending", label: "Pending" },
];

const CATEGORIES: (NewsCategory | "All")[] = [
  "All",
  "Breaking",
  "Politics",
  "World",
  "Business",
  "Tech",
  "Science",
  "Sports",
  "Entertainment",
  "Lifestyle",
];

export function IntelligenceFilterBar({
  feedMode,
  onSelectFeedMode,
  selectedCategory,
  onSelectCategory,
}: IntelligenceFilterBarProps) {
  return (
    <View style={styles.container}>
      {/* 1. Feed Mode Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FEED_MODES.map((mode) => {
          const isActive = feedMode === mode.id;
          return (
            <Pressable
              key={mode.id}
              style={[
                styles.modeTab,
                isActive && styles.modeTabActive,
              ]}
              onPress={() => onSelectFeedMode(mode.id)}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.modeLabel,
                  isActive && styles.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 2. Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, styles.categoryRow]}
      >
        {CATEGORIES.map((cat) => {
          const isCatActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.catPill,
                isCatActive && styles.catPillActive,
              ]}
              onPress={() => onSelectCategory(cat)}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.catText,
                  isCatActive && styles.catTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  row: {
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryRow: {
    marginTop: 6,
    gap: 6,
  },
  modeTab: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
    justifyContent: "center",
  },
  modeTabActive: {
    backgroundColor: COLORS.accentCyan,
    borderColor: COLORS.accentCyan,
  },
  modeLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  modeLabelActive: {
    color: COLORS.bgMain,
    fontWeight: "800",
  },
  catPill: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 28,
    justifyContent: "center",
  },
  catPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: COLORS.accentCyan,
  },
  catText: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  catTextActive: {
    color: COLORS.accentCyan,
    fontWeight: "800",
  },
});

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/theme";

interface MetricCardsStripProps {
  totalStories: number;
  highConfidenceCount: number;
  needsReviewCount: number;
  activeSourcesCount: number;
}

export function MetricCardsStrip({
  totalStories,
  highConfidenceCount,
  needsReviewCount,
  activeSourcesCount,
}: MetricCardsStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 1. Live Stories */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>LIVE STORIES</Text>
        </View>
        <Text style={[styles.cardValue, { color: COLORS.textPrimary }]}>
          {totalStories > 0 ? totalStories : "—"}
        </Text>
        <Text style={styles.cardSubtext}>Active in feed</Text>
      </View>

      {/* 2. High Confidence */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>HIGH CONFIDENCE</Text>
        </View>
        <Text style={[styles.cardValue, { color: COLORS.credTeal }]}>
          {highConfidenceCount > 0 ? highConfidenceCount : "—"}
        </Text>
        <Text style={styles.cardSubtext}>Score 80%+</Text>
      </View>

      {/* 3. Needs Review */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>NEEDS REVIEW</Text>
        </View>
        <Text style={[styles.cardValue, { color: COLORS.credAmber }]}>
          {needsReviewCount > 0 ? needsReviewCount : "—"}
        </Text>
        <Text style={styles.cardSubtext}>Score 40–59%</Text>
      </View>

      {/* 4. Active Sources */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>SOURCES</Text>
        </View>
        <Text style={[styles.cardValue, { color: "#A5B4FC" }]}>
          {activeSourcesCount > 0 ? activeSourcesCount : "—"}
        </Text>
        <Text style={styles.cardSubtext}>Publishers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  card: {
    width: 120,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    padding: 11,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  cardSubtext: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
});

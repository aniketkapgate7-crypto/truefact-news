import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TopCommandBar } from "@/components/TopCommandBar";
import { MetricCardsStrip } from "@/components/MetricCardsStrip";
import {
  IntelligenceFilterBar,
  type MobileFeedMode,
} from "@/components/IntelligenceFilterBar";
import { NewsCard } from "@/components/NewsCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { COLORS } from "@/constants/theme";

type BottomNavTab = "overview" | "feed" | "verify" | "saved";

export default function HomeScreen() {
  const {
    stories,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    selectedCategory,
    setSelectedCategory,
    setHighCredibilityOnly,
    reload,
    loadMore,
  } = useNewsFeed();

  const [activeTab, setActiveTab] = useState<BottomNavTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMode, setFeedMode] = useState<MobileFeedMode>("all");

  const handleSelectFeedMode = (mode: MobileFeedMode) => {
    setFeedMode(mode);
    if (mode === "high_credibility") {
      setHighCredibilityOnly(true);
    } else {
      setHighCredibilityOnly(false);
    }
  };

  // 1. Exclude test fixtures (id 1 "string")
  const validStories = useMemo(() => {
    return stories.filter(
      (s) =>
        s.id !== "1" &&
        s.headline.toLowerCase().trim() !== "string" &&
        !s.sourceUrl.includes("example.com")
    );
  }, [stories]);

  // 2. Real Derived Metrics
  const totalStoriesCount = validStories.length;
  const highConfidenceCount = useMemo(() => {
    return validStories.filter(
      (s) => typeof s.credibilityScore === "number" && s.credibilityScore >= 80
    ).length;
  }, [validStories]);

  const needsReviewCount = useMemo(() => {
    return validStories.filter(
      (s) =>
        typeof s.credibilityScore === "number" &&
        s.credibilityScore >= 40 &&
        s.credibilityScore < 60
    ).length;
  }, [validStories]);

  const activeSourcesCount = useMemo(() => {
    const unique = new Set(validStories.map((s) => s.source).filter(Boolean));
    return unique.size;
  }, [validStories]);

  // 3. Search & Feed Mode Filter
  const filteredStories = useMemo(() => {
    let list = validStories;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.headline.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Secondary Feed Mode Filter
    if (feedMode === "needs_review") {
      list = list.filter(
        (s) =>
          typeof s.credibilityScore === "number" &&
          s.credibilityScore >= 40 &&
          s.credibilityScore < 60
      );
    } else if (feedMode === "pending") {
      list = list.filter(
        (s) => s.credibilityScore == null || s.credibilityScore <= 0
      );
    }

    return list;
  }, [validStories, searchQuery, feedMode]);

  const isInitialLoading = isLoading && validStories.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Command Bar with Brand, Live Indicator, & Search */}
      <TopCommandBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => void reload()}
      />

      <FlatList
        data={isInitialLoading ? [] : filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsCard story={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && validStories.length > 0}
            onRefresh={() => void reload()}
            colors={[COLORS.accentCyan]}
            tintColor={COLORS.accentCyan}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Horizontally Scrollable Real Derived Metrics */}
            <MetricCardsStrip
              totalStories={totalStoriesCount}
              highConfidenceCount={highConfidenceCount}
              needsReviewCount={needsReviewCount}
              activeSourcesCount={activeSourcesCount}
            />

            {/* Filter Tabs & Category Pills */}
            <IntelligenceFilterBar
              feedMode={feedMode}
              onSelectFeedMode={handleSelectFeedMode}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Section Count Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {feedMode === "high_credibility"
                    ? "High Confidence Stories"
                    : selectedCategory === "All"
                      ? "Stories"
                      : `${selectedCategory} Stories`}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredStories.length}
                  </Text>
                </View>
              </View>

              <Text style={styles.syncStatusText}>
                {isLoading ? "Syncing..." : "Real-time"}
              </Text>
            </View>

            {/* Skeleton Loaders */}
            {isInitialLoading && (
              <View style={styles.skeletonContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isInitialLoading ? (
            <View style={styles.emptyCard}>
              {error ? (
                <>
                  <Text style={styles.emptyIcon}>⚠️</Text>
                  <Text style={styles.emptyTitle}>Unable to Reach Feed</Text>
                  <Text style={styles.emptyMessage}>{error}</Text>
                  <Pressable
                    style={styles.retryBtn}
                    onPress={() => void reload()}
                  >
                    <Text style={styles.retryBtnText}>Retry Ingestion</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>📡</Text>
                  <Text style={styles.emptyTitle}>No Stories Found</Text>
                  <Text style={styles.emptyMessage}>
                    No articles match your current filter settings. Try switching category or viewing all stories.
                  </Text>
                  <Pressable
                    style={styles.resetBtn}
                    onPress={() => {
                      setSelectedCategory("All");
                      handleSelectFeedMode("all");
                      setSearchQuery("");
                    }}
                  >
                    <Text style={styles.resetBtnText}>Reset Filters</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          filteredStories.length > 0 ? (
            <View style={styles.footer}>
              {isFetchingMore ? (
                <View style={styles.fetchMoreRow}>
                  <ActivityIndicator color={COLORS.accentCyan} size="small" />
                  <Text style={styles.fetchMoreText}>Loading more records…</Text>
                </View>
              ) : !hasMore ? (
                <Text style={styles.footerText}>
                  All caught up · TrueFact Intelligence
                </Text>
              ) : null}
            </View>
          ) : null
        }
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab("overview")}
          hitSlop={6}
        >
          <Text style={[styles.navIcon, activeTab === "overview" && styles.navIconActive]}>
            ⚡
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === "overview" && styles.navLabelActive,
            ]}
          >
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab("feed")}
          hitSlop={6}
        >
          <Text style={[styles.navIcon, activeTab === "feed" && styles.navIconActive]}>
            📡
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === "feed" && styles.navLabelActive,
            ]}
          >
            Live Feed
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab("verify")}
          hitSlop={6}
        >
          <Text style={[styles.navIcon, activeTab === "verify" && styles.navIconActive]}>
            🛡️
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === "verify" && styles.navLabelActive,
            ]}
          >
            Verify
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => setActiveTab("saved")}
          hitSlop={6}
        >
          <Text style={[styles.navIcon, activeTab === "saved" && styles.navIconActive]}>
            📑
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === "saved" && styles.navLabelActive,
            ]}
          >
            Saved
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    paddingBottom: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.bgRaised,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  countBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: "900",
  },
  syncStatusText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  emptyMessage: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  retryBtnText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: "800",
  },
  resetBtn: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  resetBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  fetchMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fetchMoreText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  footerText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.bgHeader,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    minHeight: 44,
  },
  navIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.accentCyan,
    fontWeight: "900",
  },
});

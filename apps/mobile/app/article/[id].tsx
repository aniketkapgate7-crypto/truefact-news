import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchArticle } from "@/services/newsApi";
import {
  fetchCredibilityAssessment,
  type CredibilityAssessment,
} from "@/services/credibilityApi";
import { mapApiArticleToNewsStory } from "@/services/newsMapper";
import { COLORS, getCredibilityColor, getCredibilityLabel } from "@/constants/theme";
import type { NewsStory } from "@/types/news";

function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const color = getCredibilityColor(value);
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <View style={styles.scoreBarLabelRow}>
          <Text style={styles.scoreBarLabel}>{label}</Text>
          <Text style={styles.scoreBarWeight}>({weight})</Text>
        </View>
        <Text style={[styles.scoreBarValue, { color }]}>
          {Math.round(value)}
          <Text style={styles.scoreBarMax}>/100</Text>
        </Text>
      </View>

      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            { width: `${clamped}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<NewsStory | null>(null);
  const [credibility, setCredibility] = useState<CredibilityAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    (async () => {
      try {
        const [article, cred] = await Promise.all([
          fetchArticle(id, controller.signal),
          fetchCredibilityAssessment(id, controller.signal),
        ]);
        setStory(mapApiArticleToNewsStory(article));
        setCredibility(cred);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load article.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  const handleShare = async () => {
    if (!story) return;
    try {
      await Share.share({
        title: story.headline,
        message: `${story.headline} — Verified via TrueFact News Intelligence: ${story.sourceUrl || ""}`,
      });
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Syncing intelligence dossier…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navBar}>
          <Pressable style={styles.navBtn} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.navBtnText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load Dossier</Text>
          <Text style={styles.errorMsg}>{error ?? "Article not found."}</Text>
          <Pressable style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Return to Feed</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const score = credibility ? credibility.credibility_score : story.credibilityScore;
  const scoreColor = getCredibilityColor(score);
  const scoreLabel = getCredibilityLabel(score);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top App Header */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.navBtn}
          hitSlop={8}
        >
          <Text style={styles.navBtnText}>← Feed</Text>
        </Pressable>

        <View style={styles.navRightGroup}>
          <Pressable
            onPress={handleShare}
            style={styles.shareBtn}
            hitSlop={8}
          >
            <Text style={styles.shareBtnText}>Share</Text>
          </Pressable>

          <View
            style={[
              styles.headerScoreBadge,
              { borderColor: scoreColor, backgroundColor: `${scoreColor}15` },
            ]}
          >
            <View style={[styles.headerScoreDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.headerScoreText, { color: scoreColor }]}>
              {score != null && score > 0 ? `${Math.round(score)}%` : "Pending"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Image / Header Visual */}
        <View style={styles.imageContainer}>
          {story.imageUrl ? (
            <Image
              source={{ uri: story.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackIcon}>📰</Text>
              <Text style={styles.heroFallbackSource}>{story.source}</Text>
            </View>
          )}

          <View style={styles.imageCategoryBadge}>
            <Text style={styles.imageCategoryText}>{story.category}</Text>
          </View>

          {story.region ? (
            <View style={styles.imageRegionBadge}>
              <Text style={styles.imageRegionText}>{story.region}</Text>
            </View>
          ) : null}
        </View>

        {/* Source & Timestamp */}
        <View style={styles.metaRow}>
          <Text style={styles.sourceText}>{story.source}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.timeText}>
            {new Date(story.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>{story.headline}</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ARTICLE SUMMARY</Text>
          <Text style={styles.summaryText}>{story.summary}</Text>
        </View>

        {/* Credibility Dossier Overview */}
        <View style={styles.dossierCard}>
          <View style={styles.dossierHeader}>
            <View style={styles.dossierTitleRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.dossierTitle}>CREDIBILITY SIGNALS</Text>
            </View>
            <View
              style={[
                styles.tierBadge,
                { borderColor: `${scoreColor}60`, backgroundColor: `${scoreColor}15` },
              ]}
            >
              <Text style={[styles.tierBadgeText, { color: scoreColor }]}>
                {scoreLabel.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* 4-Dimension Breakdown */}
          {credibility ? (
            <View style={styles.dimensionsBlock}>
              <ScoreBar
                label="Source Reliability"
                value={credibility.source_reliability_score}
                weight="30%"
              />
              <ScoreBar
                label="Evidence Quality"
                value={credibility.evidence_quality_score}
                weight="30%"
              />
              <ScoreBar
                label="Independent Corroboration"
                value={credibility.corroboration_score}
                weight="25%"
              />
              <ScoreBar
                label="Content Quality"
                value={credibility.content_quality_score}
                weight="15%"
              />
            </View>
          ) : (
            <Text style={styles.pendingText}>
              Awaiting automated multi-source verification.
            </Text>
          )}

          {/* Evidence Inventory Stats */}
          {credibility && (
            <View style={styles.evidenceGrid}>
              <View style={styles.evidenceBox}>
                <Text style={[styles.evidenceCount, { color: COLORS.credTeal }]}>
                  {credibility.supporting_evidence_count}
                </Text>
                <Text style={styles.evidenceLabel}>Supporting</Text>
              </View>

              <View style={styles.evidenceBox}>
                <Text style={[styles.evidenceCount, { color: COLORS.credRed }]}>
                  {credibility.contradicting_evidence_count}
                </Text>
                <Text style={styles.evidenceLabel}>Contradicting</Text>
              </View>

              <View style={styles.evidenceBox}>
                <Text style={[styles.evidenceCount, { color: COLORS.accentCyan }]}>
                  {credibility.independent_source_count}
                </Text>
                <Text style={styles.evidenceLabel}>Sources</Text>
              </View>
            </View>
          )}

          {/* Explanation Text */}
          {credibility?.explanation ? (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationTitle}>ASSESSMENT FINDINGS</Text>
              <Text style={styles.explanationText}>
                {credibility.explanation}
              </Text>
            </View>
          ) : null}

          {/* Status & Confidence Chips */}
          {credibility && (
            <View style={styles.chipsRow}>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>
                  STATUS: {credibility.assessment_status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>
                  {credibility.confidence_level.toUpperCase()} CONFIDENCE
                </Text>
              </View>
              {credibility.is_evolving && (
                <View style={[styles.statusChip, { borderColor: COLORS.accentCyan }]}>
                  <Text style={[styles.statusChipText, { color: COLORS.accentCyan }]}>
                    ⚡ EVOLVING
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Read Original Source Button */}
        {story.sourceUrl ? (
          <Pressable
            style={styles.readOriginalBtn}
            onPress={() => void Linking.openURL(story.sourceUrl)}
          >
            <Text style={styles.readOriginalText}>
              Read Original on {story.source} ↗
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  errorMsg: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: "700",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    minHeight: 48,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navBtnText: {
    color: COLORS.accentCyan,
    fontSize: 13,
    fontWeight: "700",
  },
  navRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareBtn: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shareBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  headerScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  headerScoreDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  headerScoreText: {
    fontSize: 11,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  imageContainer: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgRaised,
  },
  heroFallbackIcon: {
    fontSize: 32,
  },
  heroFallbackSource: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
  },
  imageCategoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(7, 17, 31, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCategoryText: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  imageRegionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(7, 17, 31, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageRegionText: {
    color: COLORS.textPrimary,
    fontSize: 9,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sourceText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: "700",
  },
  metaDot: {
    color: COLORS.textDim,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  headline: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  dossierCard: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  dossierHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingBottom: 8,
  },
  dossierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.credTeal,
  },
  dossierTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  dimensionsBlock: {
    gap: 8,
  },
  scoreBarContainer: {
    gap: 3,
  },
  scoreBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreBarLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreBarLabel: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  scoreBarWeight: {
    color: COLORS.textDim,
    fontSize: 9,
  },
  scoreBarValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  scoreBarMax: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: "normal",
  },
  scoreBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.bgRaised,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  pendingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
  evidenceGrid: {
    flexDirection: "row",
    gap: 8,
  },
  evidenceBox: {
    flex: 1,
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  evidenceCount: {
    fontSize: 15,
    fontWeight: "800",
  },
  evidenceLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    padding: 10,
  },
  explanationTitle: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  explanationText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  statusChip: {
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusChipText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  readOriginalBtn: {
    backgroundColor: COLORS.accentCyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  readOriginalText: {
    color: COLORS.bgMain,
    fontSize: 13,
    fontWeight: "800",
  },
});

import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  submitClaimVerification,
  type VerifyClaimResponse,
} from "@/services/verifyApi";
import { COLORS, getCredibilityColor } from "@/constants/theme";

export default function VerifyScreen() {
  const [claimText, setClaimText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [supportingContext, setSupportingContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<VerifyClaimResponse | null>(null);

  const handleVerify = async () => {
    const trimmedClaim = claimText.trim();
    if (!trimmedClaim || trimmedClaim.length < 3) {
      setValidationError("Please enter a claim with at least 3 characters.");
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsLoading(true);
    setResponse(null);

    try {
      const data = await submitClaimVerification(
        trimmedClaim,
        articleUrl.trim() || undefined,
        supportingContext.trim() || undefined
      );
      setResponse(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to verification service. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setClaimText("");
    setArticleUrl("");
    setSupportingContext("");
    setValidationError(null);
    setErrorMessage(null);
    setResponse(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top App Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          hitSlop={8}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Claim Verification</Text>
          <Text style={styles.headerSubtitle}>LIVE FACT-CHECK ENGINE</Text>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>PUBLIC API</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionBadge}>PUBLIC AUDIT INTERFACE</Text>
              <Text style={styles.sourceCountText}>Real-time Ingestion</Text>
            </View>
            <Text style={styles.cardTitle}>Verify Any News Claim or Statement</Text>
            <Text style={styles.cardDescription}>
              Cross-reference viral statements, articles, and rumors against published
              IFCN fact-checks and our algorithmic credibility assessment engine.
            </Text>
          </View>

          {/* Verification Form */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>
              Claim or Statement <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                validationError ? styles.inputError : null,
              ]}
              placeholder="e.g. WHO declares new pandemic guidelines, or paste an excerpt..."
              placeholderTextColor={COLORS.textDim}
              value={claimText}
              onChangeText={(text) => {
                setClaimText(text);
                if (validationError && text.trim().length >= 3) {
                  setValidationError(null);
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
              accessibilityLabel="Claim or statement input field"
              accessibilityHint="Enter the statement or news claim you want to verify"
            />
            {validationError ? (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLabel={validationError}
              >
                ⚠️ {validationError}
              </Text>
            ) : null}

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
              Article URL (Optional)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://example.com/news-story..."
              placeholderTextColor={COLORS.textDim}
              value={articleUrl}
              onChangeText={setArticleUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!isLoading}
              accessibilityLabel="Article URL input field"
              accessibilityHint="Optional web address of the original story"
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
              Supporting Context (Optional)
            </Text>
            <TextInput
              style={[styles.textInput, styles.contextInput]}
              placeholder="Additional background, claimed speaker, or platform..."
              placeholderTextColor={COLORS.textDim}
              value={supportingContext}
              onChangeText={setSupportingContext}
              editable={!isLoading}
              accessibilityLabel="Supporting context input field"
              accessibilityHint="Optional additional background information"
            />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.submitButton,
                  (!claimText.trim() || isLoading) && styles.submitButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={!claimText.trim() || isLoading}
                accessibilityRole="button"
                accessibilityLabel="Submit claim for verification"
                accessibilityState={{ disabled: !claimText.trim() || isLoading }}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Verifying Claim…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>⚡ Run Verification Check</Text>
                )}
              </Pressable>

              {(claimText || response || errorMessage) && !isLoading ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={handleReset}
                  accessibilityRole="button"
                  accessibilityLabel="Clear form and results"
                  hitSlop={8}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Network or Service Error State */}
          {errorMessage ? (
            <View style={styles.errorCard} accessibilityRole="alert">
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorCardTitle}>Verification Request Failed</Text>
              <Text style={styles.errorCardMessage}>{errorMessage}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={handleVerify}
                accessibilityRole="button"
                accessibilityLabel="Retry verification"
              >
                <Text style={styles.retryButtonText}>Retry Verification</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Verification Results Display */}
          {response ? (
            <VerificationResultView response={response} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function VerificationResultView({ response }: { response: VerifyClaimResponse }) {
  const { status, message, result, submitted_at } = response;
  const matchedType = result?.matched_type;

  // Differentiate Result Types Clearly
  const isHumanReview =
    matchedType === "human_verdict" ||
    (status === "existing_fact_check" && Boolean(result?.verdict));
  const isAutomated =
    matchedType === "automated_assessment" ||
    status === "automated_assessment_available";
  const isExternalFactCheck = matchedType === "external_fact_check";
  const isInsufficient = status === "insufficient_evidence";
  const isSubmittedReview = status === "submitted_for_review";

  return (
    <View style={styles.resultContainer} accessibilityRole="summary" accessibilityLabel="Verification Results">
      <View style={styles.resultHeaderRow}>
        <Text style={styles.resultSectionTitle}>Verification Report</Text>
        <Text style={styles.resultTimestamp}>
          {new Date(submitted_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Case 1: Human-Reviewed Fact-Check Verdict */}
      {isHumanReview ? (
        <View style={[styles.card, styles.humanVerdictCard]}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.humanBadge]}>
              <Text style={styles.humanBadgeText}>HUMAN-REVIEWED VERDICT</Text>
            </View>
            {result?.reviewer ? (
              <Text style={styles.reviewerText}>Signatory: {result.reviewer}</Text>
            ) : null}
          </View>

          {result?.verdict ? (
            <View style={styles.verdictContainer}>
              <Text style={styles.verdictLabel}>OFFICIAL VERDICT:</Text>
              <Text style={styles.verdictValue}>{result.verdict.toUpperCase()}</Text>
            </View>
          ) : null}

          {result?.title ? (
            <Text style={styles.resultTitle}>{result.title}</Text>
          ) : null}

          <Text style={styles.resultSummary}>
            {result?.summary || message}
          </Text>

          {result?.url ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => void Linking.openURL(result.url!)}
              accessibilityRole="link"
              accessibilityLabel={`Open source report: ${result.url}`}
            >
              <Text style={styles.linkText}>Read full published fact-check ↗</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Case 2: Automated Algorithmic Credibility Assessment */}
      {isAutomated ? (
        <View style={[styles.card, styles.automatedCard]}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.automatedBadge]}>
              <Text style={styles.automatedBadgeText}>AUTOMATED ASSESSMENT</Text>
            </View>
            <Text style={styles.methodText}>Algorithmic Corroboration</Text>
          </View>

          {result?.score !== null && result?.score !== undefined ? (
            <View style={styles.scoreRow}>
              <View
                style={[
                  styles.scoreCircle,
                  { borderColor: getCredibilityColor(result.score) },
                ]}
              >
                <Text
                  style={[
                    styles.scoreText,
                    { color: getCredibilityColor(result.score) },
                  ]}
                >
                  {result.score}
                </Text>
                <Text style={styles.scoreScale}>/100</Text>
              </View>
              <View style={styles.scoreDetails}>
                <Text style={styles.scoreHeading}>Corroboration Score</Text>
                <Text style={styles.scoreSubtext}>
                  Evaluated across multi-domain newsroom coverage and source reliability.
                </Text>
              </View>
            </View>
          ) : null}

          {result?.title ? (
            <Text style={styles.resultTitle}>{result.title}</Text>
          ) : null}

          <Text style={styles.resultSummary}>
            {result?.summary || message}
          </Text>

          {result?.url ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => void Linking.openURL(result.url!)}
              accessibilityRole="link"
              accessibilityLabel={`Open reference article: ${result.url}`}
            >
              <Text style={styles.linkText}>View matched source record ↗</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Case 3: External Fact-Check Portal */}
      {isExternalFactCheck ? (
        <View style={[styles.card, styles.externalCard]}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.externalBadge]}>
              <Text style={styles.externalBadgeText}>EXTERNAL FACT-CHECK</Text>
            </View>
            {result?.reviewer ? (
              <Text style={styles.reviewerText}>Publisher: {result.reviewer}</Text>
            ) : null}
          </View>

          {result?.verdict ? (
            <View style={styles.verdictContainer}>
              <Text style={styles.verdictLabel}>CLAIM RATING:</Text>
              <Text style={styles.verdictValue}>{result.verdict.toUpperCase()}</Text>
            </View>
          ) : null}

          {result?.title ? (
            <Text style={styles.resultTitle}>{result.title}</Text>
          ) : null}

          <Text style={styles.resultSummary}>
            {result?.summary || message}
          </Text>

          {result?.url ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => void Linking.openURL(result.url!)}
              accessibilityRole="link"
              accessibilityLabel={`Open external report: ${result.url}`}
            >
              <Text style={styles.linkText}>View external investigation ↗</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Case 4: Insufficient Evidence (Honest Unverified State) */}
      {isInsufficient ? (
        <View
          style={[styles.card, styles.insufficientCard]}
          accessibilityRole="alert"
        >
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.insufficientBadge]}>
              <Text style={styles.insufficientBadgeText}>INSUFFICIENT EVIDENCE</Text>
            </View>
            <Text style={styles.unverifiedTag}>STATUS: UNVERIFIED</Text>
          </View>

          <Text style={styles.resultTitle}>No Corroborating Evidence Found</Text>

          <Text style={styles.insufficientExplanation}>
            {message ||
              "No published fact-check or corroborating reporting exists in our database for this specific claim."}
          </Text>

          <View style={styles.truthIntegrityNotice}>
            <Text style={styles.truthNoticeIcon}>ℹ️</Text>
            <Text style={styles.truthNoticeText}>
              <strong>Truth Integrity Principle:</strong> This claim remains{" "}
              <strong>unverified</strong> due to lack of evidence. An unverified
              assessment is NOT an indicator that the statement is false.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Case 5: Submitted for Editorial Review */}
      {isSubmittedReview ? (
        <View style={[styles.card, styles.submittedCard]}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.submittedBadge]}>
              <Text style={styles.submittedBadgeText}>QUEUED FOR REVIEW</Text>
            </View>
          </View>

          <Text style={styles.resultTitle}>Submitted to Editorial Queue</Text>
          <Text style={styles.resultSummary}>
            {message ||
              "Your query has been logged and queued for investigation by human fact-checking teams."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: COLORS.accentCyan,
    fontSize: 22,
    fontWeight: "bold",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.bgPanel,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionBadge: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sourceCountText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "600",
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: COLORS.credRed,
  },
  textInput: {
    backgroundColor: COLORS.bgRaised,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 100,
  },
  contextInput: {
    height: 60,
  },
  inputError: {
    borderColor: COLORS.credRed,
  },
  errorText: {
    color: COLORS.credRed,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.accentBlue,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "rgba(251, 113, 133, 0.08)",
    borderColor: "rgba(251, 113, 133, 0.4)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  errorIcon: {
    fontSize: 24,
  },
  errorCardTitle: {
    color: COLORS.credRed,
    fontSize: 14,
    fontWeight: "800",
  },
  errorCardMessage: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: "rgba(251, 113, 133, 0.15)",
    borderWidth: 1,
    borderColor: COLORS.credRed,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: COLORS.credRed,
    fontSize: 11,
    fontWeight: "800",
  },
  resultContainer: {
    gap: 12,
  },
  resultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  resultSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  resultTimestamp: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "600",
  },
  humanVerdictCard: {
    borderColor: "rgba(45, 212, 191, 0.4)",
  },
  automatedCard: {
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  externalCard: {
    borderColor: "rgba(129, 140, 248, 0.4)",
  },
  insufficientCard: {
    borderColor: "rgba(245, 158, 11, 0.4)",
    backgroundColor: "rgba(245, 158, 11, 0.05)",
  },
  submittedCard: {
    borderColor: COLORS.borderSubtle,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  humanBadge: {
    backgroundColor: "rgba(45, 212, 191, 0.15)",
    borderColor: COLORS.credTeal,
  },
  humanBadgeText: {
    color: COLORS.credTeal,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  automatedBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: COLORS.accentCyan,
  },
  automatedBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  externalBadge: {
    backgroundColor: "rgba(129, 140, 248, 0.15)",
    borderColor: "#818CF8",
  },
  externalBadgeText: {
    color: "#818CF8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  insufficientBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: COLORS.credAmber,
  },
  insufficientBadgeText: {
    color: COLORS.credAmber,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  submittedBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    borderColor: COLORS.credPending,
  },
  submittedBadgeText: {
    color: COLORS.credPending,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  reviewerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  methodText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: "700",
  },
  unverifiedTag: {
    color: COLORS.credAmber,
    fontSize: 10,
    fontWeight: "800",
  },
  verdictContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.bgRaised,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  verdictLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verdictValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    backgroundColor: COLORS.bgRaised,
    padding: 10,
    borderRadius: 10,
  },
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgPanel,
  },
  scoreText: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20,
  },
  scoreScale: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: "700",
  },
  scoreDetails: {
    flex: 1,
  },
  scoreHeading: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  scoreSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  resultSummary: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  insufficientExplanation: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  truthIntegrityNotice: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  truthNoticeIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  truthNoticeText: {
    flex: 1,
    color: COLORS.credAmber,
    fontSize: 11,
    lineHeight: 16,
  },
  linkRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  linkText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: "700",
  },
});

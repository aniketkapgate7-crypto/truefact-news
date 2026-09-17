const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export interface VerifyClaimResult {
  title: string;
  summary: string;
  matched_type: "human_verdict" | "automated_assessment" | "external_fact_check" | "submission_receipt" | string;
  url?: string | null;
  score?: number | null;
  verdict?: string | null;
  reviewer?: string | null;
  evidence_count?: number | null;
  extra?: Record<string, unknown> | null;
}

export interface VerifyClaimResponse {
  query: string;
  status:
    | "existing_fact_check"
    | "automated_assessment_available"
    | "submitted_for_review"
    | "insufficient_evidence"
    | "verification_unavailable";
  message: string;
  submitted_at: string;
  result?: VerifyClaimResult | null;
}

export async function submitClaimVerification(
  claimText: string,
  articleUrl?: string,
  supportingContext?: string,
  signal?: AbortSignal
): Promise<VerifyClaimResponse> {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  const trimmedClaim = claimText.trim();
  if (trimmedClaim.length < 3) {
    throw new Error("Claim must be at least 3 characters long.");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      claim_text: trimmedClaim,
      article_url: articleUrl?.trim() ? articleUrl.trim() : null,
      supporting_context: supportingContext?.trim() ? supportingContext.trim() : null,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Verification service error (${response.status})`);
  }

  return response.json();
}

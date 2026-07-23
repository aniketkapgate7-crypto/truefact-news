from enum import StrEnum

SOURCE_RELIABILITY_WEIGHT = 30
EVIDENCE_QUALITY_WEIGHT = 30
CORROBORATION_WEIGHT = 25
CONTENT_QUALITY_WEIGHT = 15


class CredibilityRating(StrEnum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class CredibilityReasonCode(StrEnum):
    SOURCE_RELIABILITY_HIGH = "source_reliability_high"
    SOURCE_RELIABILITY_MODERATE = "source_reliability_moderate"
    SOURCE_RELIABILITY_LOW = "source_reliability_low"

    EVIDENCE_QUALITY_HIGH = "evidence_quality_high"
    EVIDENCE_QUALITY_MODERATE = "evidence_quality_moderate"
    EVIDENCE_QUALITY_LOW = "evidence_quality_low"

    CORROBORATION_HIGH = "corroboration_high"
    CORROBORATION_MODERATE = "corroboration_moderate"
    CORROBORATION_LOW = "corroboration_low"

    CONTENT_QUALITY_HIGH = "content_quality_high"
    CONTENT_QUALITY_MODERATE = "content_quality_moderate"
    CONTENT_QUALITY_LOW = "content_quality_low"


def calculate_credibility_score(
    *,
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
) -> int:
    scores = (
        source_reliability_score,
        evidence_quality_score,
        corroboration_score,
        content_quality_score,
    )

    if any(score < 0 or score > 100 for score in scores):
        raise ValueError("Credibility component scores must be between 0 and 100")

    weighted_total = (
        source_reliability_score * SOURCE_RELIABILITY_WEIGHT
        + evidence_quality_score * EVIDENCE_QUALITY_WEIGHT
        + corroboration_score * CORROBORATION_WEIGHT
        + content_quality_score * CONTENT_QUALITY_WEIGHT
    )

    return (weighted_total + 50) // 100


def get_credibility_rating(
    credibility_score: int,
) -> CredibilityRating:
    if credibility_score < 0 or credibility_score > 100:
        raise ValueError("Credibility score must be between 0 and 100")

    if credibility_score < 20:
        return CredibilityRating.VERY_LOW

    if credibility_score < 40:
        return CredibilityRating.LOW

    if credibility_score < 60:
        return CredibilityRating.MEDIUM

    if credibility_score < 80:
        return CredibilityRating.HIGH

    return CredibilityRating.VERY_HIGH


def _select_reason_code(
    score: int,
    *,
    high: CredibilityReasonCode,
    moderate: CredibilityReasonCode,
    low: CredibilityReasonCode,
) -> CredibilityReasonCode:
    if score >= 80:
        return high

    if score >= 60:
        return moderate

    return low


def generate_credibility_reason_codes(
    *,
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
) -> tuple[CredibilityReasonCode, ...]:
    scores = (
        source_reliability_score,
        evidence_quality_score,
        corroboration_score,
        content_quality_score,
    )

    if any(score < 0 or score > 100 for score in scores):
        raise ValueError("Credibility component scores must be between 0 and 100")

    return (
        _select_reason_code(
            source_reliability_score,
            high=CredibilityReasonCode.SOURCE_RELIABILITY_HIGH,
            moderate=CredibilityReasonCode.SOURCE_RELIABILITY_MODERATE,
            low=CredibilityReasonCode.SOURCE_RELIABILITY_LOW,
        ),
        _select_reason_code(
            evidence_quality_score,
            high=CredibilityReasonCode.EVIDENCE_QUALITY_HIGH,
            moderate=CredibilityReasonCode.EVIDENCE_QUALITY_MODERATE,
            low=CredibilityReasonCode.EVIDENCE_QUALITY_LOW,
        ),
        _select_reason_code(
            corroboration_score,
            high=CredibilityReasonCode.CORROBORATION_HIGH,
            moderate=CredibilityReasonCode.CORROBORATION_MODERATE,
            low=CredibilityReasonCode.CORROBORATION_LOW,
        ),
        _select_reason_code(
            content_quality_score,
            high=CredibilityReasonCode.CONTENT_QUALITY_HIGH,
            moderate=CredibilityReasonCode.CONTENT_QUALITY_MODERATE,
            low=CredibilityReasonCode.CONTENT_QUALITY_LOW,
        ),
    )

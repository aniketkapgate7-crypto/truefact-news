from enum import StrEnum

SOURCE_RELIABILITY_WEIGHT = 30
EVIDENCE_QUALITY_WEIGHT = 30
CORROBORATION_WEIGHT = 25
CONTENT_QUALITY_WEIGHT = 15
MINIMUM_SCORE = 0
MAXIMUM_SCORE = 100
MODERATE_REASON_THRESHOLD = 60
HIGH_REASON_THRESHOLD = 80


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


CREDIBILITY_REASON_MESSAGES: dict[CredibilityReasonCode, str] = {
    CredibilityReasonCode.SOURCE_RELIABILITY_HIGH: (
        "The source has a strong reliability record."
    ),
    CredibilityReasonCode.SOURCE_RELIABILITY_MODERATE: (
        "The source has a mixed or partially verified reliability record."
    ),
    CredibilityReasonCode.SOURCE_RELIABILITY_LOW: (
        "The source has a weak or unverified reliability record."
    ),
    CredibilityReasonCode.EVIDENCE_QUALITY_HIGH: (
        "The article provides strong, verifiable supporting evidence."
    ),
    CredibilityReasonCode.EVIDENCE_QUALITY_MODERATE: (
        "The article provides some supporting evidence, but verification is limited."
    ),
    CredibilityReasonCode.EVIDENCE_QUALITY_LOW: (
        "The article provides little or no verifiable supporting evidence."
    ),
    CredibilityReasonCode.CORROBORATION_HIGH: (
        "Multiple independent sources support the same claim."
    ),
    CredibilityReasonCode.CORROBORATION_MODERATE: (
        "Some independent sources support the claim."
    ),
    CredibilityReasonCode.CORROBORATION_LOW: (
        "Few or no independent sources support the claim."
    ),
    CredibilityReasonCode.CONTENT_QUALITY_HIGH: (
        "The content is clear, consistent, and professionally presented."
    ),
    CredibilityReasonCode.CONTENT_QUALITY_MODERATE: (
        "The content is generally clear but has some quality concerns."
    ),
    CredibilityReasonCode.CONTENT_QUALITY_LOW: (
        "The content contains major clarity or quality concerns."
    ),
}


def get_credibility_reason_message(
    reason_code: CredibilityReasonCode,
) -> str:
    return CREDIBILITY_REASON_MESSAGES[reason_code]


def _validate_component_scores(scores: tuple[int, ...]) -> None:
    if any(score < MINIMUM_SCORE or score > MAXIMUM_SCORE for score in scores):
        raise ValueError("Credibility component scores must be between 0 and 100")


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

    _validate_component_scores(scores)

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
    if credibility_score < MINIMUM_SCORE or credibility_score > MAXIMUM_SCORE:
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
    if score >= HIGH_REASON_THRESHOLD:
        return high

    if score >= MODERATE_REASON_THRESHOLD:
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

    _validate_component_scores(scores)

    return (
        _select_reason_code(
            source_reliability_score,
            high=CredibilityReasonCode.SOURCE_RELIABILITY_HIGH,
            moderate=(CredibilityReasonCode.SOURCE_RELIABILITY_MODERATE),
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

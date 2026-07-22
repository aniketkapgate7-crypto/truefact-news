SOURCE_RELIABILITY_WEIGHT = 30
EVIDENCE_QUALITY_WEIGHT = 30
CORROBORATION_WEIGHT = 25
CONTENT_QUALITY_WEIGHT = 15


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

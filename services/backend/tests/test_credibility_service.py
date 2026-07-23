import pytest

from app.services.credibility import (
    CredibilityRating,
    CredibilityReasonCode,
    calculate_credibility_score,
    generate_credibility_reason_codes,
    get_credibility_rating,
    get_credibility_reason_message,
)


def _calculate_score(
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
) -> int:
    return calculate_credibility_score(
        source_reliability_score=source_reliability_score,
        evidence_quality_score=evidence_quality_score,
        corroboration_score=corroboration_score,
        content_quality_score=content_quality_score,
    )


def _generate_reason_codes(
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
) -> tuple[CredibilityReasonCode, ...]:
    return generate_credibility_reason_codes(
        source_reliability_score=source_reliability_score,
        evidence_quality_score=evidence_quality_score,
        corroboration_score=corroboration_score,
        content_quality_score=content_quality_score,
    )


def test_calculate_credibility_score_uses_expected_weights() -> None:
    score = _calculate_score(80, 90, 70, 60)

    assert score == 78


@pytest.mark.parametrize(
    ("component_score", "expected_score"),
    [
        (0, 0),
        (100, 100),
    ],
)
def test_calculate_credibility_score_handles_extremes(
    component_score: int,
    expected_score: int,
) -> None:
    score = _calculate_score(
        component_score,
        component_score,
        component_score,
        component_score,
    )

    assert score == expected_score


@pytest.mark.parametrize(
    (
        "source_reliability_score",
        "evidence_quality_score",
        "corroboration_score",
        "content_quality_score",
        "expected_score",
    ),
    [
        (1, 1, 1, 0, 1),
        (1, 1, 0, 1, 1),
    ],
)
def test_calculate_credibility_score_rounds_to_nearest_integer(
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
    expected_score: int,
) -> None:
    score = _calculate_score(
        source_reliability_score,
        evidence_quality_score,
        corroboration_score,
        content_quality_score,
    )

    assert score == expected_score


@pytest.mark.parametrize(
    (
        "source_reliability_score",
        "evidence_quality_score",
        "corroboration_score",
        "content_quality_score",
    ),
    [
        (-1, 50, 50, 50),
        (101, 50, 50, 50),
        (50, -1, 50, 50),
        (50, 101, 50, 50),
        (50, 50, -1, 50),
        (50, 50, 101, 50),
        (50, 50, 50, -1),
        (50, 50, 50, 101),
    ],
)
def test_calculate_credibility_score_rejects_invalid_components(
    source_reliability_score: int,
    evidence_quality_score: int,
    corroboration_score: int,
    content_quality_score: int,
) -> None:
    with pytest.raises(
        ValueError,
        match="Credibility component scores must be between 0 and 100",
    ):
        _calculate_score(
            source_reliability_score,
            evidence_quality_score,
            corroboration_score,
            content_quality_score,
        )


@pytest.mark.parametrize(
    ("credibility_score", "expected_rating"),
    [
        (0, CredibilityRating.VERY_LOW),
        (19, CredibilityRating.VERY_LOW),
        (20, CredibilityRating.LOW),
        (39, CredibilityRating.LOW),
        (40, CredibilityRating.MEDIUM),
        (59, CredibilityRating.MEDIUM),
        (60, CredibilityRating.HIGH),
        (79, CredibilityRating.HIGH),
        (80, CredibilityRating.VERY_HIGH),
        (99, CredibilityRating.VERY_HIGH),
        (100, CredibilityRating.VERY_HIGH),
    ],
)
def test_get_credibility_rating_uses_expected_boundaries(
    credibility_score: int,
    expected_rating: CredibilityRating,
) -> None:
    assert get_credibility_rating(credibility_score) is expected_rating


@pytest.mark.parametrize("credibility_score", [-1, 101])
def test_get_credibility_rating_rejects_invalid_score(
    credibility_score: int,
) -> None:
    with pytest.raises(
        ValueError,
        match="Credibility score must be between 0 and 100",
    ):
        get_credibility_rating(credibility_score)


def test_generate_credibility_reason_codes_returns_ordered_codes() -> None:
    reason_codes = _generate_reason_codes(80, 90, 70, 60)

    assert reason_codes == (
        CredibilityReasonCode.SOURCE_RELIABILITY_HIGH,
        CredibilityReasonCode.EVIDENCE_QUALITY_HIGH,
        CredibilityReasonCode.CORROBORATION_MODERATE,
        CredibilityReasonCode.CONTENT_QUALITY_MODERATE,
    )


@pytest.mark.parametrize(
    ("component_score", "expected_suffix"),
    [
        (59, "low"),
        (60, "moderate"),
        (79, "moderate"),
        (80, "high"),
    ],
)
def test_generate_credibility_reason_codes_uses_expected_boundaries(
    component_score: int,
    expected_suffix: str,
) -> None:
    reason_codes = _generate_reason_codes(
        component_score,
        component_score,
        component_score,
        component_score,
    )

    assert reason_codes == (
        CredibilityReasonCode(f"source_reliability_{expected_suffix}"),
        CredibilityReasonCode(f"evidence_quality_{expected_suffix}"),
        CredibilityReasonCode(f"corroboration_{expected_suffix}"),
        CredibilityReasonCode(f"content_quality_{expected_suffix}"),
    )


@pytest.mark.parametrize("invalid_score", [-1, 101])
def test_generate_credibility_reason_codes_rejects_invalid_score(
    invalid_score: int,
) -> None:
    with pytest.raises(
        ValueError,
        match="Credibility component scores must be between 0 and 100",
    ):
        _generate_reason_codes(invalid_score, 50, 50, 50)


def test_get_source_reliability_high_message() -> None:
    message = get_credibility_reason_message(
        CredibilityReasonCode.SOURCE_RELIABILITY_HIGH
    )

    assert message == "The source has a strong reliability record."

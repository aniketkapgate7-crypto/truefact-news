import pytest

from app.services.credibility import (
    CredibilityRating,
    calculate_credibility_score,
    get_credibility_rating,
)


def test_calculates_weighted_credibility_score() -> None:
    result = calculate_credibility_score(
        source_reliability_score=80,
        evidence_quality_score=90,
        corroboration_score=70,
        content_quality_score=60,
    )

    assert result == 78


@pytest.mark.parametrize(
    ("scores", "expected"),
    [
        (
            {
                "source_reliability_score": 0,
                "evidence_quality_score": 0,
                "corroboration_score": 0,
                "content_quality_score": 0,
            },
            0,
        ),
        (
            {
                "source_reliability_score": 100,
                "evidence_quality_score": 100,
                "corroboration_score": 100,
                "content_quality_score": 100,
            },
            100,
        ),
        (
            {
                "source_reliability_score": 1,
                "evidence_quality_score": 0,
                "corroboration_score": 0,
                "content_quality_score": 0,
            },
            0,
        ),
        (
            {
                "source_reliability_score": 0,
                "evidence_quality_score": 0,
                "corroboration_score": 2,
                "content_quality_score": 0,
            },
            1,
        ),
    ],
)
def test_handles_boundaries_and_rounding(
    scores: dict[str, int],
    expected: int,
) -> None:
    result = calculate_credibility_score(**scores)

    assert result == expected


@pytest.mark.parametrize(
    ("field_name", "invalid_score"),
    [
        ("source_reliability_score", -1),
        ("source_reliability_score", 101),
        ("evidence_quality_score", -1),
        ("evidence_quality_score", 101),
        ("corroboration_score", -1),
        ("corroboration_score", 101),
        ("content_quality_score", -1),
        ("content_quality_score", 101),
    ],
)
def test_rejects_scores_outside_valid_range(
    field_name: str,
    invalid_score: int,
) -> None:
    scores = {
        "source_reliability_score": 50,
        "evidence_quality_score": 50,
        "corroboration_score": 50,
        "content_quality_score": 50,
    }
    scores[field_name] = invalid_score

    with pytest.raises(
        ValueError,
        match=("Credibility component scores must be between 0 and 100"),
    ):
        calculate_credibility_score(**scores)


@pytest.mark.parametrize(
    ("score", "expected_rating"),
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
        (100, CredibilityRating.VERY_HIGH),
    ],
)
def test_returns_correct_credibility_rating(
    score: int,
    expected_rating: CredibilityRating,
) -> None:
    result = get_credibility_rating(score)

    assert result is expected_rating


@pytest.mark.parametrize("invalid_score", [-1, 101])
def test_rejects_invalid_credibility_rating_score(
    invalid_score: int,
) -> None:
    with pytest.raises(
        ValueError,
        match="Credibility score must be between 0 and 100",
    ):
        get_credibility_rating(invalid_score)

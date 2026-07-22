import pytest

from app.services.credibility import calculate_credibility_score


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

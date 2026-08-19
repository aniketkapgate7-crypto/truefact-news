from uuid import uuid4

from fastapi import status
from fastapi.testclient import TestClient

ASSESSMENT_PAYLOAD = {
    "source_reliability_score": 80,
    "evidence_quality_score": 90,
    "corroboration_score": 70,
    "content_quality_score": 60,
    "supporting_evidence_count": 3,
    "contradicting_evidence_count": 0,
    "independent_source_count": 3,
    "primary_source_count": 1,
    "is_evolving": True,
    "explanation": (
        "The source is reliable and the report includes supporting "
        "evidence from multiple independent sources."
    ),
}

EXPECTED_REASON_CODES = [
    "source_reliability_high",
    "evidence_quality_high",
    "corroboration_moderate",
    "content_quality_moderate",
]

EXPECTED_CREDIBILITY_REASONS = [
    {
        "code": "source_reliability_high",
        "message": "The source has a strong reliability record.",
    },
    {
        "code": "evidence_quality_high",
        "message": ("The article provides strong, verifiable supporting evidence."),
    },
    {
        "code": "corroboration_moderate",
        "message": "Some independent sources support the claim.",
    },
    {
        "code": "content_quality_moderate",
        "message": ("The content is generally clear but has some quality concerns."),
    },
]


def _create_news_article(client: TestClient) -> int:
    response = client.post(
        "/api/v1/news/",
        json={
            "title": "Credibility API test article",
            "summary": ("A detailed article used to test credibility assessments."),
            "source_name": "TrueFact Test Source",
            "source_url": f"https://example.com/news/{uuid4()}",
            "category": "technology",
            "region": "India",
            "published_at": "2026-07-22T00:00:00Z",
            "evidence_score": 75,
            "comment_count": 10,
            "repost_count": 5,
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    return response.json()["id"]


def _assessment_url(article_id: int) -> str:
    return f"/api/v1/news/{article_id}/credibility-assessment"


def _create_credibility_assessment(
    client: TestClient,
    article_id: int,
) -> dict[str, object]:
    response = client.post(
        _assessment_url(article_id),
        json=ASSESSMENT_PAYLOAD,
    )

    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def test_create_credibility_assessment(client: TestClient) -> None:
    article_id = _create_news_article(client)

    response = client.post(
        _assessment_url(article_id),
        json=ASSESSMENT_PAYLOAD,
    )

    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()

    assert data["news_article_id"] == article_id
    assert data["source_reliability_score"] == 80
    assert data["evidence_quality_score"] == 90
    assert data["corroboration_score"] == 70
    assert data["content_quality_score"] == 60
    assert data["credibility_score"] == 78
    assert data["credibility_rating"] == "high"

    assert data["supporting_evidence_count"] == 3
    assert data["contradicting_evidence_count"] == 0
    assert data["independent_source_count"] == 3
    assert data["primary_source_count"] == 1
    assert data["is_evolving"] is True

    assert data["assessment_status"] == "supported"
    assert data["confidence_level"] == "high"

    assert data["credibility_reason_codes"] == EXPECTED_REASON_CODES
    assert data["credibility_reasons"] == EXPECTED_CREDIBILITY_REASONS

    assert data["explanation"] == ASSESSMENT_PAYLOAD["explanation"]
    assert data["method_version"] == "rules-v2"
    assert data["assessed_at"]
    assert data["updated_at"]


def test_create_rejects_missing_news_article(client: TestClient) -> None:
    response = client.post(
        _assessment_url(999_999),
        json=ASSESSMENT_PAYLOAD,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_rejects_duplicate_assessment(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.post(
        _assessment_url(article_id),
        json=ASSESSMENT_PAYLOAD,
    )

    assert response.status_code == status.HTTP_409_CONFLICT


def test_create_rejects_invalid_assessment(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)

    invalid_payload = {
        **ASSESSMENT_PAYLOAD,
        "source_reliability_score": 101,
    }

    response = client.post(
        _assessment_url(article_id),
        json=invalid_payload,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_rejects_negative_evidence_count(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)

    invalid_payload = {
        **ASSESSMENT_PAYLOAD,
        "supporting_evidence_count": -1,
    }

    response = client.post(
        _assessment_url(article_id),
        json=invalid_payload,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_credibility_assessment(client: TestClient) -> None:
    article_id = _create_news_article(client)
    created = _create_credibility_assessment(client, article_id)

    response = client.get(_assessment_url(article_id))

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["id"] == created["id"]
    assert data["credibility_score"] == 78
    assert data["credibility_rating"] == "high"
    assert data["assessment_status"] == "supported"
    assert data["confidence_level"] == "high"
    assert data["is_evolving"] is True
    assert data["credibility_reason_codes"] == EXPECTED_REASON_CODES


def test_get_missing_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)

    response = client.get(_assessment_url(article_id))

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_recalculates_credibility_score(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.patch(
        _assessment_url(article_id),
        json={"source_reliability_score": 40},
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["source_reliability_score"] == 40
    assert data["credibility_score"] == 66
    assert data["credibility_rating"] == "high"
    assert data["assessment_status"] == "supported"
    assert data["confidence_level"] == "high"

    assert data["credibility_reason_codes"] == [
        "source_reliability_low",
        "evidence_quality_high",
        "corroboration_moderate",
        "content_quality_moderate",
    ]


def test_update_v2_evidence_changes_public_result(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.patch(
        _assessment_url(article_id),
        json={
            "contradicting_evidence_count": 2,
            "independent_source_count": 2,
            "primary_source_count": 0,
            "is_evolving": False,
        },
    )

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert data["supporting_evidence_count"] == 3
    assert data["contradicting_evidence_count"] == 2
    assert data["independent_source_count"] == 2
    assert data["primary_source_count"] == 0
    assert data["is_evolving"] is False

    assert data["assessment_status"] == "mixed"
    assert data["confidence_level"] == "medium"
    assert data["credibility_score"] == 78
    assert data["method_version"] == "rules-v2"


def test_update_rejects_negative_evidence_count(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.patch(
        _assessment_url(article_id),
        json={"contradicting_evidence_count": -1},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_rejects_empty_payload(client: TestClient) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.patch(
        _assessment_url(article_id),
        json={},
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_update_rejects_null_values(client: TestClient) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.patch(
        _assessment_url(article_id),
        json={"source_reliability_score": None},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_missing_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)

    response = client.patch(
        _assessment_url(article_id),
        json={"source_reliability_score": 40},
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_credibility_assessment(client: TestClient) -> None:
    article_id = _create_news_article(client)
    _create_credibility_assessment(client, article_id)

    response = client.delete(_assessment_url(article_id))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.content == b""

    get_response = client.get(_assessment_url(article_id))

    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_missing_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = _create_news_article(client)

    response = client.delete(_assessment_url(article_id))

    assert response.status_code == status.HTTP_404_NOT_FOUND

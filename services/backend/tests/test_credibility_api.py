from fastapi.testclient import TestClient


def create_news_article(
    client: TestClient,
    slug: str,
) -> int:
    response = client.post(
        "/api/v1/news/",
        json={
            "title": f"Credibility test article {slug}",
            "summary": (
                "A detailed news summary used to test credibility assessments."
            ),
            "source_name": "TrueFact Test Source",
            "source_url": f"https://example.com/news/{slug}",
            "category": "technology",
            "region": "India",
            "published_at": "2026-07-22T00:00:00Z",
            "evidence_score": 75,
            "comment_count": 10,
            "repost_count": 5,
        },
    )

    assert response.status_code == 201
    return response.json()["id"]


def make_assessment() -> dict[str, int | str]:
    return {
        "source_reliability_score": 80,
        "evidence_quality_score": 90,
        "corroboration_score": 70,
        "content_quality_score": 60,
        "explanation": (
            "The source is reliable and the report includes "
            "supporting evidence from multiple sources."
        ),
    }


def test_create_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "create-assessment",
    )

    response = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json=make_assessment(),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["news_article_id"] == article_id
    assert data["credibility_score"] == 78
    assert data["method_version"] == "rules-v1"
    assert data["source_reliability_score"] == 80
    assert data["evidence_quality_score"] == 90
    assert data["corroboration_score"] == 70
    assert data["content_quality_score"] == 60
    assert data["id"] > 0
    assert data["assessed_at"]
    assert data["updated_at"]


def test_get_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "get-assessment",
    )

    create_response = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json=make_assessment(),
    )
    assert create_response.status_code == 201

    response = client.get(f"/api/v1/news/{article_id}/credibility-assessment")

    assert response.status_code == 200
    assert response.json()["credibility_score"] == 78


def test_update_recalculates_credibility_score(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "update-assessment",
    )

    create_response = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json=make_assessment(),
    )
    assert create_response.status_code == 201

    response = client.patch(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json={
            "evidence_quality_score": 50,
            "explanation": (
                "The supporting evidence requires additional independent verification."
            ),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["evidence_quality_score"] == 50
    assert data["credibility_score"] == 66


def test_rejects_duplicate_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "duplicate-assessment",
    )
    url = f"/api/v1/news/{article_id}/credibility-assessment"

    first_response = client.post(
        url,
        json=make_assessment(),
    )
    second_response = client.post(
        url,
        json=make_assessment(),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "A credibility assessment already exists for this article"
    )


def test_create_for_missing_article(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/news/999999/credibility-assessment",
        json=make_assessment(),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == ("News article not found")


def test_get_missing_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "missing-assessment",
    )

    response = client.get(f"/api/v1/news/{article_id}/credibility-assessment")

    assert response.status_code == 404
    assert response.json()["detail"] == ("Credibility assessment not found")


def test_rejects_invalid_component_score(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "invalid-score",
    )
    payload = make_assessment()
    payload["corroboration_score"] = 101

    response = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json=payload,
    )

    assert response.status_code == 422


def test_rejects_unknown_field(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "unknown-field",
    )
    payload = make_assessment()
    payload["credibility_score"] = 100

    response = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json=payload,
    )

    assert response.status_code == 422


def test_rejects_empty_update(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "empty-update",
    )
    url = f"/api/v1/news/{article_id}/credibility-assessment"

    create_response = client.post(
        url,
        json=make_assessment(),
    )
    assert create_response.status_code == 201

    response = client.patch(url, json={})

    assert response.status_code == 400
    assert response.json()["detail"] == ("Provide at least one field to update")


def test_rejects_null_update(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "null-update",
    )
    url = f"/api/v1/news/{article_id}/credibility-assessment"

    create_response = client.post(
        url,
        json=make_assessment(),
    )
    assert create_response.status_code == 201

    response = client.patch(
        url,
        json={"evidence_quality_score": None},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == ("Updated credibility fields cannot be null")


def test_delete_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "delete-assessment",
    )
    url = f"/api/v1/news/{article_id}/credibility-assessment"

    create_response = client.post(
        url,
        json=make_assessment(),
    )
    assert create_response.status_code == 201

    delete_response = client.delete(url)

    assert delete_response.status_code == 204
    assert delete_response.content == b""

    get_response = client.get(url)

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == ("Credibility assessment not found")


def test_delete_missing_credibility_assessment(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "delete-missing-assessment",
    )

    response = client.delete(f"/api/v1/news/{article_id}/credibility-assessment")

    assert response.status_code == 404
    assert response.json()["detail"] == ("Credibility assessment not found")

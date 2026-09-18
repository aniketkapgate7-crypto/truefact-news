import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.usefixtures("admin_mutations_enabled")

sample_article = {
    "title": "TrueFact automated testing completed",
    "summary": (
        "This sample article verifies that the News API works "
        "with an isolated test database."
    ),
    "source_name": "TrueFact Tests",
    "source_url": "https://example.com/automated-test-story",
    "category": "Technology",
    "region": "Global",
    "published_at": "2026-07-22T00:00:00Z",
    "evidence_score": 92,
    "comment_count": 4,
    "repost_count": 2,
}


def make_article(
    slug: str,
    title: str,
    **changes,
) -> dict:
    article = sample_article.copy()
    article.update(
        {
            "title": title,
            "source_url": f"https://example.com/{slug}",
        }
    )
    article.update(changes)
    return article


def test_empty_news_feed(client: TestClient) -> None:
    response = client.get("/api/v1/news/")

    assert response.status_code == 200

    data = response.json()

    assert data["items"] == []
    assert data["pagination"]["total_items"] == 0
    assert data["pagination"]["total_pages"] == 0
    assert data["pagination"]["has_next"] is False
    assert data["pagination"]["has_previous"] is False


def test_create_and_get_news_article(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/news/",
        json=sample_article,
    )

    assert create_response.status_code == 201

    created_article = create_response.json()
    article_id = created_article["id"]

    assert article_id > 0
    assert created_article["title"] == sample_article["title"]
    assert created_article["evidence_score"] == 92

    get_response = client.get(f"/api/v1/news/{article_id}")

    assert get_response.status_code == 200
    assert get_response.json()["id"] == article_id
    assert get_response.json()["source_name"] == "TrueFact Tests"


def test_duplicate_source_url_is_rejected(
    client: TestClient,
) -> None:
    first_response = client.post(
        "/api/v1/news/",
        json=sample_article,
    )
    second_response = client.post(
        "/api/v1/news/",
        json=sample_article,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "An article with this source URL already exists"
    )


def test_update_and_delete_article(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/news/",
        json=sample_article,
    )
    article_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/news/{article_id}",
        json={
            "evidence_score": 97,
            "comment_count": 20,
            "repost_count": 10,
        },
    )

    assert update_response.status_code == 200

    updated_article = update_response.json()

    assert updated_article["evidence_score"] == 97
    assert updated_article["comment_count"] == 20
    assert updated_article["repost_count"] == 10

    delete_response = client.delete(f"/api/v1/news/{article_id}")

    assert delete_response.status_code == 204
    assert delete_response.content == b""

    missing_response = client.get(f"/api/v1/news/{article_id}")

    assert missing_response.status_code == 404


def test_search_and_filters(client: TestClient) -> None:
    technology_article = make_article(
        "ai-verification",
        "AI verification system launched",
        summary=(
            "TrueFact Research launched a verification system "
            "for checking technology news."
        ),
        source_name="TrueFact Research",
        category="Technology",
        region="Global",
        evidence_score=95,
    )

    politics_article = make_article(
        "india-policy",
        "Regional policy report published",
        summary=(
            "India Daily published a detailed regional policy report for its readers."
        ),
        source_name="India Daily",
        category="Politics",
        region="India",
        evidence_score=70,
    )

    assert (
        client.post(
            "/api/v1/news/",
            json=technology_article,
        ).status_code
        == 201
    )

    assert (
        client.post(
            "/api/v1/news/",
            json=politics_article,
        ).status_code
        == 201
    )

    search_response = client.get(
        "/api/v1/news/",
        params={"search": "verification"},
    )

    assert search_response.status_code == 200
    assert search_response.json()["pagination"]["total_items"] == 1
    assert search_response.json()["items"][0]["category"] == ("Technology")

    filter_response = client.get(
        "/api/v1/news/",
        params={
            "region": "india",
            "category": "politics",
            "min_evidence_score": 60,
        },
    )

    assert filter_response.status_code == 200
    assert filter_response.json()["pagination"]["total_items"] == 1
    assert filter_response.json()["items"][0]["source_name"] == ("India Daily")

    source_response = client.get(
        "/api/v1/news/",
        params={"source": "TrueFact"},
    )

    assert source_response.status_code == 200
    assert source_response.json()["pagination"]["total_items"] == 1


def test_pagination(client: TestClient) -> None:
    for number in range(1, 4):
        article = make_article(
            f"pagination-story-{number}",
            f"Pagination story {number}",
        )

        response = client.post(
            "/api/v1/news/",
            json=article,
        )

        assert response.status_code == 201

    first_page = client.get(
        "/api/v1/news/",
        params={"page": 1, "page_size": 2},
    )

    assert first_page.status_code == 200

    first_page_data = first_page.json()

    assert len(first_page_data["items"]) == 2
    assert first_page_data["pagination"]["total_items"] == 3
    assert first_page_data["pagination"]["total_pages"] == 2
    assert first_page_data["pagination"]["has_next"] is True
    assert first_page_data["pagination"]["has_previous"] is False

    second_page = client.get(
        "/api/v1/news/",
        params={"page": 2, "page_size": 2},
    )

    assert second_page.status_code == 200

    second_page_data = second_page.json()

    assert len(second_page_data["items"]) == 1
    assert second_page_data["pagination"]["has_next"] is False
    assert second_page_data["pagination"]["has_previous"] is True


def test_all_sorting_options(client: TestClient) -> None:
    articles = [
        make_article(
            "sorting-a",
            "Sorting story A",
            published_at="2026-01-01T00:00:00Z",
            evidence_score=60,
            comment_count=9,
            repost_count=1,
        ),
        make_article(
            "sorting-b",
            "Sorting story B",
            published_at="2026-02-01T00:00:00Z",
            evidence_score=90,
            comment_count=3,
            repost_count=5,
        ),
        make_article(
            "sorting-c",
            "Sorting story C",
            published_at="2026-03-01T00:00:00Z",
            evidence_score=75,
            comment_count=6,
            repost_count=10,
        ),
    ]

    for article in articles:
        response = client.post(
            "/api/v1/news/",
            json=article,
        )

        assert response.status_code == 201

    expected_orders = {
        ("published_at", "desc"): [
            "Sorting story C",
            "Sorting story B",
            "Sorting story A",
        ],
        ("evidence_score", "desc"): [
            "Sorting story B",
            "Sorting story C",
            "Sorting story A",
        ],
        ("comment_count", "asc"): [
            "Sorting story B",
            "Sorting story C",
            "Sorting story A",
        ],
        ("repost_count", "desc"): [
            "Sorting story C",
            "Sorting story B",
            "Sorting story A",
        ],
    }

    for sorting, expected_titles in expected_orders.items():
        sort_by, sort_order = sorting

        response = client.get(
            "/api/v1/news/",
            params={
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        )

        assert response.status_code == 200

        actual_titles = [article["title"] for article in response.json()["items"]]

        assert actual_titles == expected_titles


def test_request_validation(client: TestClient) -> None:
    invalid_article = sample_article.copy()
    invalid_article["evidence_score"] = 101

    create_response = client.post(
        "/api/v1/news/",
        json=invalid_article,
    )

    assert create_response.status_code == 422

    query_response = client.get(
        "/api/v1/news/",
        params={"page": 0},
    )

    assert query_response.status_code == 422

    created_article = client.post(
        "/api/v1/news/",
        json=sample_article,
    ).json()

    empty_update_response = client.patch(
        f"/api/v1/news/{created_article['id']}",
        json={},
    )

    assert empty_update_response.status_code == 400


# ---------------------------------------------------------------------------
# image_url serialization
# ---------------------------------------------------------------------------


def test_image_url_is_null_by_default(client: TestClient) -> None:
    """Articles without an image_url serialize to null."""
    create_response = client.post(
        "/api/v1/news/",
        json=make_article("image-null-test", "Image URL is null by default"),
    )
    assert create_response.status_code == 201
    data = create_response.json()
    assert "image_url" in data
    assert data["image_url"] is None


def test_image_url_can_be_set_on_create(client: TestClient) -> None:
    """Articles created with an image_url round-trip correctly."""
    payload = make_article(
        "image-create-test",
        "Article with hero image on creation",
        image_url="https://example.com/hero.jpg",
    )
    create_response = client.post("/api/v1/news/", json=payload)
    assert create_response.status_code == 201
    data = create_response.json()
    assert data["image_url"] == "https://example.com/hero.jpg"


def test_image_url_can_be_patched(client: TestClient) -> None:
    """PATCH sets and clears image_url correctly."""
    create_response = client.post(
        "/api/v1/news/",
        json=make_article("image-patch-test", "Article without initial image"),
    )
    article_id = create_response.json()["id"]

    # Set image_url via PATCH
    set_response = client.patch(
        f"/api/v1/news/{article_id}",
        json={"image_url": "https://example.com/patched.jpg"},
    )
    assert set_response.status_code == 200
    assert set_response.json()["image_url"] == "https://example.com/patched.jpg"

    # Clear image_url to null via PATCH
    clear_response = client.patch(
        f"/api/v1/news/{article_id}",
        json={"image_url": None},
    )
    assert clear_response.status_code == 200
    assert clear_response.json()["image_url"] is None


def test_credibility_score_is_null_before_assessment(client: TestClient) -> None:
    """Articles without a credibility assessment have credibility_score: null."""
    create_response = client.post(
        "/api/v1/news/",
        json=make_article(
            "cred-null-test", "Article without any credibility assessment"
        ),
    )
    assert create_response.status_code == 201
    article_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/news/{article_id}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert "credibility_score" in data
    assert data["credibility_score"] is None


def test_min_credibility_score_filtering_and_pending_exclusion(
    client: TestClient,
) -> None:
    """min_credibility_score=80 filters at 80 vs 79 and excludes unassessed articles."""
    # 1. High credibility article (score 80)
    res80 = client.post(
        "/api/v1/news/",
        json=make_article("story-score-80", "High Credibility Article At 80 Threshold"),
    )
    id80 = res80.json()["id"]
    post_res80 = client.post(
        f"/api/v1/news/{id80}/credibility-assessment",
        json={
            "source_reliability_score": 80,
            "evidence_quality_score": 80,
            "corroboration_score": 80,
            "content_quality_score": 80,
            "explanation": "High credibility assessment with verified sources.",
        },
    )
    assert post_res80.status_code == 201

    # 2. Medium credibility article (score 79)
    res79 = client.post(
        "/api/v1/news/",
        json=make_article("story-score-79", "Article Just Below Threshold At 79"),
    )
    id79 = res79.json()["id"]
    post_res79 = client.post(
        f"/api/v1/news/{id79}/credibility-assessment",
        json={
            "source_reliability_score": 79,
            "evidence_quality_score": 79,
            "corroboration_score": 79,
            "content_quality_score": 79,
            "explanation": "Article credibility score is slightly below threshold.",
        },
    )
    assert post_res79.status_code == 201

    # 3. Unassessed article (pending)
    res_pending = client.post(
        "/api/v1/news/",
        json=make_article("story-pending", "Unassessed Article In Normal Feed"),
    )
    id_pending = res_pending.json()["id"]

    # Normal feed returns all 3 articles
    normal_feed = client.get("/api/v1/news/").json()
    normal_ids = [item["id"] for item in normal_feed["items"]]
    assert id80 in normal_ids
    assert id79 in normal_ids
    assert id_pending in normal_ids

    # High credibility filtered feed (>= 80)
    high_feed = client.get("/api/v1/news/?min_credibility_score=80").json()
    assert high_feed["pagination"]["total_items"] == 1
    assert len(high_feed["items"]) == 1
    assert high_feed["items"][0]["id"] == id80
    assert high_feed["items"][0]["credibility_score"] == 80


def test_sort_by_credibility_score_highest_first(client: TestClient) -> None:
    """sort_by=credibility_score orders from highest score to lowest."""
    # Create 3 assessed articles with scores 85, 95, 81
    scores = [85, 95, 81]
    created_ids = {}
    for score in scores:
        res = client.post(
            "/api/v1/news/",
            json=make_article(f"story-{score}", f"Article with Score {score}"),
        )
        art_id = res.json()["id"]
        created_ids[score] = art_id
        client.post(
            f"/api/v1/news/{art_id}/credibility-assessment",
            json={
                "source_reliability_score": score,
                "evidence_quality_score": score,
                "corroboration_score": score,
                "content_quality_score": score,
                "explanation": f"Assessment for article with score {score}.",
            },
        )

    response = client.get(
        "/api/v1/news/?min_credibility_score=80&sort_by=credibility_score&sort_order=desc"
    )
    assert response.status_code == 200
    data = response.json()

    assert data["pagination"]["total_items"] == 3
    returned_scores = [item["credibility_score"] for item in data["items"]]
    assert returned_scores == [95, 85, 81]
    assert data["items"][0]["id"] == created_ids[95]

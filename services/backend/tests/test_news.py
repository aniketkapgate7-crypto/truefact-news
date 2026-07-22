from fastapi.testclient import TestClient

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

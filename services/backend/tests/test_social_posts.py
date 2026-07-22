from fastapi.testclient import TestClient


def make_news_article(slug: str) -> dict[str, object]:
    return {
        "title": f"Social tracking story {slug}",
        "summary": (
            "A verified news article used for testing social-platform tracking."
        ),
        "source_name": "TrueFact Tests",
        "source_url": f"https://example.com/news/{slug}",
        "category": "Technology",
        "region": "Global",
        "published_at": "2026-07-20T10:00:00Z",
        "evidence_score": 90,
        "comment_count": 0,
        "repost_count": 0,
    }


def make_social_post(
    external_post_id: str,
    **overrides: object,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "platform": "youtube",
        "external_post_id": external_post_id,
        "post_url": (f"https://www.youtube.com/watch?v={external_post_id}"),
        "account_name": "TrueFact Channel",
        "view_count": 1000,
        "like_count": 150,
        "comment_count": 25,
        "repost_count": 10,
        "published_at": "2026-07-20T12:00:00Z",
    }

    payload.update(overrides)
    return payload


def create_news_article(
    client: TestClient,
    slug: str,
) -> int:
    response = client.post(
        "/api/v1/news/",
        json=make_news_article(slug),
    )

    assert response.status_code == 201
    return response.json()["id"]


def create_social_post(
    client: TestClient,
    article_id: int,
    external_post_id: str,
) -> dict[str, object]:
    response = client.post(
        f"/api/v1/news/{article_id}/social-posts",
        json=make_social_post(external_post_id),
    )

    assert response.status_code == 201
    return response.json()


def test_create_and_list_social_posts(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "create-and-list",
    )

    first_post = create_social_post(
        client,
        article_id,
        "youtube-video-001",
    )

    second_payload = make_social_post(
        "x-post-001",
        platform="x",
        post_url=("https://x.com/truefact/status/987654321"),
        published_at="2026-07-21T12:00:00Z",
    )

    second_response = client.post(
        f"/api/v1/news/{article_id}/social-posts",
        json=second_payload,
    )

    assert second_response.status_code == 201
    second_post = second_response.json()

    assert first_post["news_article_id"] == article_id
    assert first_post["platform"] == "youtube"
    assert first_post["view_count"] == 1000
    assert "last_synced_at" in first_post

    list_response = client.get(f"/api/v1/news/{article_id}/social-posts")

    assert list_response.status_code == 200

    data = list_response.json()

    assert data["total_items"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["id"] == second_post["id"]
    assert data["items"][1]["id"] == first_post["id"]


def test_get_social_post(client: TestClient) -> None:
    article_id = create_news_article(
        client,
        "get-social-post",
    )
    created = create_social_post(
        client,
        article_id,
        "youtube-video-002",
    )

    response = client.get(f"/api/v1/social-posts/{created['id']}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == created["id"]
    assert data["news_article_id"] == article_id
    assert data["external_post_id"] == "youtube-video-002"


def test_update_social_post_metrics(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "update-social-post",
    )
    created = create_social_post(
        client,
        article_id,
        "youtube-video-003",
    )

    response = client.patch(
        f"/api/v1/social-posts/{created['id']}",
        json={
            "view_count": 5000,
            "like_count": 700,
            "comment_count": 80,
            "repost_count": 35,
            "account_name": "Updated TrueFact Channel",
        },
    )

    assert response.status_code == 200

    updated = response.json()

    assert updated["view_count"] == 5000
    assert updated["like_count"] == 700
    assert updated["comment_count"] == 80
    assert updated["repost_count"] == 35
    assert updated["account_name"] == ("Updated TrueFact Channel")


def test_delete_social_post(client: TestClient) -> None:
    article_id = create_news_article(
        client,
        "delete-social-post",
    )
    created = create_social_post(
        client,
        article_id,
        "youtube-video-004",
    )

    delete_response = client.delete(f"/api/v1/social-posts/{created['id']}")

    assert delete_response.status_code == 204
    assert delete_response.content == b""

    get_response = client.get(f"/api/v1/social-posts/{created['id']}")

    assert get_response.status_code == 404

    list_response = client.get(f"/api/v1/news/{article_id}/social-posts")

    assert list_response.status_code == 200
    assert list_response.json()["total_items"] == 0


def test_duplicate_social_post_is_rejected(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "duplicate-social-post",
    )
    payload = make_social_post("duplicate-video-001")

    first_response = client.post(
        f"/api/v1/news/{article_id}/social-posts",
        json=payload,
    )
    second_response = client.post(
        f"/api/v1/news/{article_id}/social-posts",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "A social post with this URL or platform post ID already exists"
    )


def test_missing_resources_return_404(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/news/999999/social-posts",
        json=make_social_post("missing-article-post"),
    )

    assert create_response.status_code == 404
    assert create_response.json()["detail"] == ("News article not found")

    get_response = client.get("/api/v1/social-posts/999999")
    update_response = client.patch(
        "/api/v1/social-posts/999999",
        json={"view_count": 20},
    )
    delete_response = client.delete("/api/v1/social-posts/999999")

    assert get_response.status_code == 404
    assert update_response.status_code == 404
    assert delete_response.status_code == 404


def test_social_post_validation(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "social-post-validation",
    )

    negative_count = make_social_post(
        "negative-count-post",
        view_count=-1,
    )
    invalid_platform = make_social_post(
        "invalid-platform-post",
        platform="unknown-platform",
    )
    extra_field = make_social_post(
        "extra-field-post",
        unsupported_metric=100,
    )

    for payload in (
        negative_count,
        invalid_platform,
        extra_field,
    ):
        response = client.post(
            f"/api/v1/news/{article_id}/social-posts",
            json=payload,
        )

        assert response.status_code == 422


def test_empty_and_null_updates_are_rejected(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "invalid-social-update",
    )
    created = create_social_post(
        client,
        article_id,
        "youtube-video-005",
    )

    empty_response = client.patch(
        f"/api/v1/social-posts/{created['id']}",
        json={},
    )

    assert empty_response.status_code == 400
    assert empty_response.json()["detail"] == ("Provide at least one field to update")

    null_response = client.patch(
        f"/api/v1/social-posts/{created['id']}",
        json={"view_count": None},
    )

    assert null_response.status_code == 422
    assert null_response.json()["detail"] == (
        "Required social-post fields cannot be null"
    )


def test_engagement_summary(client: TestClient) -> None:
    article_id = create_news_article(
        client,
        "engagement-summary",
    )

    payloads = [
        make_social_post(
            "summary-youtube-001",
            view_count=1000,
            like_count=150,
            comment_count=25,
            repost_count=10,
        ),
        make_social_post(
            "summary-youtube-002",
            view_count=2000,
            like_count=250,
            comment_count=35,
            repost_count=20,
        ),
        make_social_post(
            "summary-x-001",
            platform="x",
            post_url="https://x.com/truefact/status/123456789",
            view_count=500,
            like_count=80,
            comment_count=12,
            repost_count=7,
        ),
    ]

    for payload in payloads:
        response = client.post(
            f"/api/v1/news/{article_id}/social-posts",
            json=payload,
        )
        assert response.status_code == 201

    response = client.get(f"/api/v1/news/{article_id}/engagement-summary")

    assert response.status_code == 200

    data = response.json()

    assert data["news_article_id"] == article_id
    assert data["total_posts"] == 3
    assert data["total_views"] == 3500
    assert data["total_likes"] == 480
    assert data["total_comments"] == 72
    assert data["total_reposts"] == 37

    breakdown = {item["platform"]: item for item in data["platform_breakdown"]}

    assert breakdown["youtube"]["post_count"] == 2
    assert breakdown["youtube"]["view_count"] == 3000
    assert breakdown["x"]["post_count"] == 1
    assert breakdown["x"]["view_count"] == 500


def test_empty_engagement_summary(
    client: TestClient,
) -> None:
    article_id = create_news_article(
        client,
        "empty-engagement-summary",
    )

    response = client.get(f"/api/v1/news/{article_id}/engagement-summary")

    assert response.status_code == 200

    data = response.json()

    assert data["total_posts"] == 0
    assert data["total_views"] == 0
    assert data["total_likes"] == 0
    assert data["total_comments"] == 0
    assert data["total_reposts"] == 0
    assert data["platform_breakdown"] == []


def test_engagement_summary_missing_article(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/news/999999/engagement-summary")

    assert response.status_code == 404
    assert response.json()["detail"] == ("News article not found")

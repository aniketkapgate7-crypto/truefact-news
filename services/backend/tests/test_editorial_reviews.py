from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.services.credibility import ReviewStatus

pytestmark = pytest.mark.usefixtures(
    "admin_mutations_enabled", "editorial_mutations_enabled"
)


def _create_article(client: TestClient, title: str = "Test News Article") -> int:
    res = client.post(
        "/api/v1/news/",
        json={
            "title": title,
            "summary": "Detailed news article testing editorial review system.",
            "source_name": "TrueFact News Desk",
            "source_url": f"https://example.com/news/{uuid4()}",
            "category": "Technology",
            "region": "India",
            "published_at": "2026-08-27T10:00:00Z",
            "evidence_score": 80,
        },
    )
    assert res.status_code == 201
    return res.json()["id"]


def _create_assessment(client: TestClient, article_id: int) -> dict:
    res = client.post(
        f"/api/v1/news/{article_id}/credibility-assessment",
        json={
            "source_reliability_score": 80,
            "evidence_quality_score": 85,
            "corroboration_score": 75,
            "content_quality_score": 80,
            "supporting_evidence_count": 3,
            "contradicting_evidence_count": 0,
            "independent_source_count": 3,
            "primary_source_count": 1,
            "is_evolving": False,
            "explanation": "Standard automated evaluation with verifiable references.",
        },
    )
    assert res.status_code == 201
    return res.json()


def test_credibility_assessment_editorial_defaults(client: TestClient) -> None:
    article_id = _create_article(client, "Clean Energy Breakthrough in 2026")
    ca = _create_assessment(client, article_id)

    assert ca["review_status"] == ReviewStatus.AUTOMATED
    assert ca.get("verdict") is None
    assert ca.get("reviewer_id") is None
    assert ca.get("reviewer_name") is None
    assert ca["review_version"] == 1
    assert ca.get("reviewed_at") is None
    assert ca.get("review_published_at") is None


def test_editorial_review_update_and_publishing(client: TestClient) -> None:
    article_id = _create_article(client, "Economic Growth Rate Doubled Claim")
    _create_assessment(client, article_id)

    # Step 1: Update review to in_review
    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "in_review",
            "reviewer_name": "Aarav Sharma, Senior Fact-Checker",
            "claim": "Growth rate doubled overnight due to secret tax cut",
            "claimant": "Viral Social Media Post",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["review_status"] == "in_review"
    assert data["reviewer_name"] == "Aarav Sharma, Senior Fact-Checker"
    assert data["claim"] == "Growth rate doubled overnight due to secret tax cut"

    # Step 2: Publish fact-check verdict
    res2 = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "verdict": "false",
            "conclusion": "Official ministry statistics confirm quarterly growth is stable at 6.8%, not doubled.",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["review_status"] == "published"
    assert data2["verdict"] == "false"
    assert data2["review_published_at"] is not None

    # Step 3: Verify it appears in published fact checks
    pub_res = client.get("/api/v1/fact-checks/published")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["total_count"] >= 1
    found = next(
        (item for item in pub_data["items"] if item["article_id"] == article_id), None
    )
    assert found is not None
    assert found["verdict"] == "false"
    assert found["review_status"] == "published"
    assert found["claim"] == "Growth rate doubled overnight due to secret tax cut"

    # Step 4: Verify single editorial fact check detail
    detail_res = client.get(f"/api/v1/fact-checks/editorial/{article_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["article_id"] == article_id
    assert detail["verdict"] == "false"


def test_verify_claim_endpoint_published_match(client: TestClient) -> None:
    article_id = _create_article(
        client, "Government announces free smartphones for all citizens"
    )
    _create_assessment(client, article_id)

    # Publish human verdict
    client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "verdict": "false",
            "reviewer_name": "PIB Verification Cell",
            "claim": "Government gives free smartphones to all citizens",
            "conclusion": "Ministry of Electronics confirmed no such scheme exists. Link is a phishing attempt.",
        },
    )

    # Search for this claim
    verify_res = client.post(
        "/api/v1/verify",
        json={"claim_text": "free smartphones for all citizens"},
    )
    assert verify_res.status_code == 200
    res_json = verify_res.json()
    assert res_json["status"] == "existing_fact_check"
    assert res_json["result"]["verdict"] == "false"
    assert res_json["result"]["matched_type"] == "human_verdict"


def test_verify_claim_endpoint_automated_match(client: TestClient) -> None:
    article_id = _create_article(
        client, "ISRO prepares next lunar orbital scientific observation"
    )
    _create_assessment(client, article_id)

    verify_res = client.post(
        "/api/v1/verify",
        json={"claim_text": "ISRO prepares next lunar orbital"},
    )
    assert verify_res.status_code == 200
    res_json = verify_res.json()
    assert res_json["status"] == "automated_assessment_available"
    assert res_json["result"]["score"] is not None
    assert res_json["result"]["matched_type"] == "automated_assessment"


def test_verify_claim_endpoint_unmatched_claim(client: TestClient) -> None:
    verify_res = client.post(
        "/api/v1/verify",
        json={
            "claim_text": "Unique unheard claim about synthetic diamonds floating in atmosphere",
            "supporting_context": "Seen on social video platform.",
        },
    )
    assert verify_res.status_code == 200
    res_json = verify_res.json()
    assert res_json["status"] == "insufficient_evidence"
    assert (
        "No matching editorial fact check or automated assessment"
        in res_json["message"]
    )


def test_automated_assessment_cannot_render_as_fact_check_report(
    client: TestClient,
) -> None:
    """Automated assessments must strictly return 404 on fact-check editorial report endpoint."""
    article_id = _create_article(
        client, "Automated Assessment Only - Climate Policy Updates"
    )
    _create_assessment(client, article_id)

    # Attempting to fetch editorial fact check report must return 404
    res = client.get(f"/api/v1/fact-checks/editorial/{article_id}")
    assert res.status_code == 404
    assert (
        "Editorial fact check report not published" in res.json()["detail"]
        or "Fact check report not found" in res.json()["detail"]
    )


def test_missing_verdict_prevents_publication(client: TestClient) -> None:
    """Server-side validation must block publishing when verdict is missing."""
    article_id = _create_article(client, "Missing Verdict Publishing Test")
    _create_assessment(client, article_id)

    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "reviewer_name": "Test Reviewer",
            "claim": "Test claim statement",
            "conclusion": "Test conclusion text",
            # verdict is missing
        },
    )
    assert res.status_code == 422
    assert "verdict" in res.json()["detail"]


def test_missing_reviewer_prevents_publication(client: TestClient) -> None:
    """Server-side validation must block publishing when reviewer attribution is missing."""
    article_id = _create_article(client, "Missing Reviewer Publishing Test")
    _create_assessment(client, article_id)

    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "verdict": "mostly_false",
            "claim": "Test claim statement",
            "conclusion": "Test conclusion text",
            # reviewer_name and reviewer_id are missing
        },
    )
    assert res.status_code == 422
    assert "reviewer attribution" in res.json()["detail"]


def test_missing_conclusion_prevents_publication(client: TestClient) -> None:
    """Server-side validation must block publishing when human conclusion is missing."""
    article_id = _create_article(client, "Missing Conclusion Publishing Test")
    _create_assessment(client, article_id)

    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "verdict": "mostly_false",
            "reviewer_name": "Test Reviewer",
            "claim": "Test claim statement",
            # conclusion is missing
        },
    )
    assert res.status_code == 422
    assert "conclusion" in res.json()["detail"]


def test_missing_claim_prevents_publication(client: TestClient) -> None:
    """Server-side validation must block publishing when claim text is missing."""
    article_id = _create_article(client, "Missing Claim Publishing Test")
    _create_assessment(client, article_id)

    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={
            "review_status": "published",
            "verdict": "mostly_false",
            "reviewer_name": "Test Reviewer",
            "conclusion": "Test conclusion text",
            # claim is missing
        },
    )
    assert res.status_code == 422
    assert "claim" in res.json()["detail"]


def test_public_fact_check_listings_exclude_automated_records(
    client: TestClient,
) -> None:
    """Published listings endpoint must only return complete published human reviews."""
    # Automated article
    auto_id = _create_article(client, "Pure Automated Story for Listing Test")
    _create_assessment(client, auto_id)

    # Published article
    pub_id = _create_article(client, "Human Reviewed Story for Listing Test")
    _create_assessment(client, pub_id)
    client.patch(
        f"/api/v1/editorial/review/{pub_id}",
        json={
            "review_status": "published",
            "verdict": "true",
            "reviewer_name": "Verified Desk Editor",
            "claim": "Direct verified factual assertion",
            "conclusion": "Confirmed through government gazette records.",
        },
    )

    res = client.get("/api/v1/fact-checks/published")
    assert res.status_code == 200
    items = res.json()["items"]
    article_ids = [item["article_id"] for item in items]

    assert pub_id in article_ids
    assert auto_id not in article_ids


def test_workspace_mutation_security_when_disabled(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When enable_editorial_mutations is False, editorial mutations must return 403 Forbidden."""
    from app.core.config import settings

    article_id = _create_article(client, "Security Check Article")
    _create_assessment(client, article_id)

    monkeypatch.setattr(settings, "enable_editorial_mutations", False)

    res = client.patch(
        f"/api/v1/editorial/review/{article_id}",
        json={"review_status": "in_review", "reviewer_name": "Unauthorized Attempt"},
    )
    assert res.status_code == 403
    assert (
        "Editorial mutations are disabled in this environment" in res.json()["detail"]
    )

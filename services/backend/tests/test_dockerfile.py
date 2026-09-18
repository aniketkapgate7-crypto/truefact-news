import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


def test_dockerfile_exists_and_meets_cloud_run_spec() -> None:
    """Verify backend Dockerfile exists and meets production Cloud Run constraints."""
    dockerfile_path = Path(__file__).parent.parent / "Dockerfile"
    assert dockerfile_path.exists(), f"Dockerfile not found at {dockerfile_path}"

    content = dockerfile_path.read_text(encoding="utf-8")
    lines = [
        line.strip()
        for line in content.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    # Base image is pinned official python 3.11 slim
    from_lines = [line for line in lines if line.startswith("FROM")]
    assert len(from_lines) == 1, "Expected exactly one FROM instruction"
    assert "python:3.11" in from_lines[0] and "slim" in from_lines[0], (
        f"Base image should be pinned python:3.11-slim, got: {from_lines[0]}"
    )

    # Non-root user declared
    user_lines = [line for line in lines if line.startswith("USER")]
    assert len(user_lines) >= 1, "Dockerfile must declare a non-root USER"
    assert user_lines[-1] not in ("USER root", "USER 0"), (
        "Container must not run as root"
    )
    assert "appuser" in user_lines[-1], (
        f"Expected appuser in USER instruction, got: {user_lines[-1]}"
    )

    # Entrypoint/CMD uses app.main:app and PORT expansion
    cmd_lines = [
        line
        for line in lines
        if line.startswith("CMD") or line.startswith("ENTRYPOINT")
    ]
    assert cmd_lines, "Dockerfile must specify CMD or ENTRYPOINT"
    combined_cmd = " ".join(cmd_lines)

    assert "app.main:app" in combined_cmd, (
        "Application import path app.main:app must be used"
    )
    assert "PORT" in combined_cmd, (
        "PORT environment variable must be referenced for Cloud Run"
    )

    # Alembic migrations must NOT be run automatically during container startup
    assert "alembic upgrade" not in combined_cmd, (
        "Alembic upgrade must never run automatically on container startup"
    )

    # Ensure no secrets or hardcoded passwords are present
    secret_patterns = [
        re.compile(r"(password|secret|key)\s*=\s*['\"][^'\"]+['\"]", re.IGNORECASE),
        re.compile(r"postgres(?:ql)?:\/\/[^:]+:[^@]+@", re.IGNORECASE),
        re.compile(r"Bearer\s+[A-Za-z0-9_\-\.]{20,}", re.IGNORECASE),
    ]
    for pattern in secret_patterns:
        assert not pattern.search(content), (
            "Credential or secret pattern detected in Dockerfile"
        )


def test_dockerignore_excludes_sensitive_and_dev_artifacts() -> None:
    """Verify backend .dockerignore excludes virtualenvs, caches, databases, and secrets."""
    dockerignore_path = Path(__file__).parent.parent / ".dockerignore"
    assert dockerignore_path.exists(), f".dockerignore not found at {dockerignore_path}"

    content = dockerignore_path.read_text(encoding="utf-8")
    patterns = {
        line.strip()
        for line in content.splitlines()
        if line.strip() and not line.strip().startswith("#")
    }

    required_exclusions = {
        ".venv/",
        "__pycache__/",
        "*.py[cod]",
        ".pytest_cache/",
        ".ruff_cache/",
        ".env",
        ".env.*",
        "*.db",
        "*.sqlite",
        "*.sqlite3",
        ".git/",
    }

    for required in required_exclusions:
        assert any(
            required == p or required.rstrip("/") == p.rstrip("/") or required in p
            for p in patterns
        ), f"Missing required exclusion in .dockerignore: {required}"


def test_healthz_endpoint_is_accessible() -> None:
    """Verify /healthz probe endpoint returns status healthy."""
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

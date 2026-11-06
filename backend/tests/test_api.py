"""Integration tests for FastAPI endpoints."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns ok status and stats."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "stats" in data
    assert "gemini_configured" in data


def test_issues_analyze_endpoint():
    """Verify POST /api/issues/analyze triages an issue."""
    payload = {
        "repo_url": "https://github.com/pallets/flask",
        "issue_number": 42,
        "issue_title": "TypeError when passing None to route handler",
        "issue_body": "Passing None raises an unhandled TypeError instead of returning 400 Bad Request."
    }
    response = client.post("/api/issues/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "classification" in data
    assert data["classification"]["category"] in ["Bug", "Enhancement", "Security", "Documentation", "Feature Request"]
    assert "severity" in data["classification"]


def test_repositories_connect_and_list():
    """Verify POST /api/repositories/connect and GET /api/repositories."""
    payload = {"repo_url": "https://github.com/encode/uvicorn"}
    connect_res = client.post("/api/repositories/connect", json=payload)
    assert connect_res.status_code == 200
    data = connect_res.json()
    assert "repository" in data
    assert data["repository"]["name"] == "uvicorn"

    list_res = client.get("/api/repositories")
    assert list_res.status_code == 200
    repos = list_res.json()
    assert any(r.get("name") == "uvicorn" for r in repos)


def test_job_submission_and_retrieval():
    """Verify POST /api/issues/resolve starts a job, and GET /api/jobs/{id} retrieves it."""
    payload = {
        "repo_url": "octo-org/sample-repo",
        "issue_number": 5,
        "issue_title": "Fix off-by-one error in pagination",
        "issue_body": "Total pages calculated as (n // size) instead of ceil(n / size)."
    }
    start_res = client.post("/api/issues/resolve", json=payload)
    assert start_res.status_code == 200
    data = start_res.json()
    assert "job_id" in data
    job_id = data["job_id"]

    # Retrieve job details
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    job_data = get_res.json()
    assert job_data["job_id"] == job_id
    assert job_data["issue_number"] == 5

    # Retrieve job logs
    logs_res = client.get(f"/api/jobs/{job_id}/logs")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1


def test_pull_requests_list():
    """Verify GET /api/pull-requests returns list."""
    res = client.get("/api/pull-requests")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


"""Unit tests for GitHub client URL parsing, Webhook payload parsing, and GitOps."""
import pytest
from app.github.client import GitHubClient
from app.github.webhooks import GitHubWebhookHandler


def test_parse_github_identifiers():
    """Test parsing various GitHub repository and issue formats."""
    # 1. Full issue URL
    p1 = GitHubClient.parse_repo_and_issue("https://github.com/pallets/flask/issues/5000")
    assert p1["owner"] == "pallets"
    assert p1["repo"] == "flask"
    assert p1["issue_number"] == 5000
    assert p1["repo_url"] == "https://github.com/pallets/flask"

    # 2. Repo URL
    p2 = GitHubClient.parse_repo_and_issue("https://github.com/fastapi/fastapi")
    assert p2["owner"] == "fastapi"
    assert p2["repo"] == "fastapi"
    assert p2["issue_number"] is None

    # 3. Shorthand with issue
    p3 = GitHubClient.parse_repo_and_issue("torvalds/linux#12345")
    assert p3["owner"] == "torvalds"
    assert p3["repo"] == "linux"
    assert p3["issue_number"] == 12345

    # 4. Shorthand repo
    p4 = GitHubClient.parse_repo_and_issue("google/gemini")
    assert p4["owner"] == "google"
    assert p4["repo"] == "gemini"


def test_webhook_payload_parsing():
    """Test extracting issue data from GitHub webhook payload."""
    payload = {
        "action": "opened",
        "issue": {
            "number": 101,
            "title": "Bug in user login",
            "body": "User login crashes with null pointer",
            "labels": [{"name": "bug"}, {"name": "backend"}],
            "user": {"login": "octocat"},
            "html_url": "https://github.com/octo-org/repo/issues/101"
        },
        "repository": {
            "name": "repo",
            "html_url": "https://github.com/octo-org/repo",
            "owner": {"login": "octo-org"}
        }
    }

    parsed = GitHubWebhookHandler.parse_issue_event(payload)
    assert parsed is not None
    assert parsed["action"] == "opened"
    assert parsed["issue_number"] == 101
    assert parsed["issue_title"] == "Bug in user login"
    assert "bug" in parsed["issue_labels"]
    assert parsed["repo_owner"] == "octo-org"
    assert parsed["repo_name"] == "repo"

    # Ignored action (e.g. closed)
    closed_payload = {**payload, "action": "closed"}
    assert GitHubWebhookHandler.parse_issue_event(closed_payload) is None


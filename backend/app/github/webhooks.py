"""GitHub Webhook HMAC signature verification and payload handling."""
import hashlib
import hmac
import json
from typing import Any, Dict, Optional, Tuple
from app.config.settings import settings


class WebhookVerificationError(Exception):
    """Raised when GitHub webhook signature verification fails."""
    pass


class GitHubWebhookHandler:
    """Verifies HMAC SHA-256 webhook signatures and extracts actionable issue payloads."""

    @staticmethod
    def verify_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """
        Verify GitHub webhook signature using HMAC-SHA256 with constant-time comparison.
        If no secret is configured, passes if header is absent or in development mode.
        """
        secret = settings.GITHUB_WEBHOOK_SECRET
        if not secret:
            # If no secret configured in environment, allow for testing
            return True

        if not signature_header:
            return False

        if not signature_header.startswith("sha256="):
            return False

        expected_sig = signature_header[len("sha256=") :]
        computed_mac = hmac.new(
            secret.encode("utf-8"),
            msg=payload_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_mac, expected_sig)

    @classmethod
    def parse_issue_event(cls, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse issue event payload. Extracts repository and issue data
        for 'opened' or 'reopened' issue actions.
        """
        action = payload.get("action")
        issue = payload.get("issue")
        repo = payload.get("repository")

        if not issue or not repo:
            return None

        # Process new or reopened issues
        if action not in ["opened", "reopened"]:
            return None

        repo_url = repo.get("html_url") or repo.get("clone_url")
        owner = repo.get("owner", {}).get("login", "")
        repo_name = repo.get("name", "")

        return {
            "action": action,
            "repo_url": repo_url,
            "repo_owner": owner,
            "repo_name": repo_name,
            "issue_number": issue.get("number"),
            "issue_title": issue.get("title", ""),
            "issue_body": issue.get("body", "") or "",
            "issue_labels": [label.get("name") for label in issue.get("labels", []) if isinstance(label, dict)],
            "issue_author": issue.get("user", {}).get("login", ""),
            "issue_url": issue.get("html_url", ""),
        }


webhook_handler = GitHubWebhookHandler()


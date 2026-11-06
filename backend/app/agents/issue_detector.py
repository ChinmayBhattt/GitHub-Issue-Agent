"""Issue Detection Agent: extracts issue details and prevents duplicate processing."""
from typing import Any, Dict, Optional
from app.github.client import github_client
from app.storage.json_store import json_store


class IssueDetectorAgent:
    """Detects new/reopened issues, extracts metadata, and checks for prior processing."""

    def detect_and_ingest(
        self,
        repo_identifier: str,
        issue_number: Optional[int] = None,
        raw_title: Optional[str] = None,
        raw_body: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Ingest issue from GitHub URL/number or manual input.
        Verifies whether the issue has already been processed.
        """
        parsed = github_client.parse_repo_and_issue(repo_identifier)
        owner = parsed["owner"]
        repo = parsed["repo"]
        target_issue_num = issue_number or parsed.get("issue_number")

        # Check existing jobs for deduplication
        existing_jobs = json_store.list_jobs(limit=200)
        for job in existing_jobs:
            if (
                job.get("repo_owner", "").lower() == owner.lower()
                and job.get("repo_name", "").lower() == repo.lower()
                and target_issue_num is not None
                and job.get("issue_number") == target_issue_num
                and job.get("status") in ["COMPLETED", "WAITING_FOR_APPROVAL", "CREATING_PR"]
            ):
                return {
                    "already_processed": True,
                    "existing_job_id": job.get("job_id"),
                    "status": job.get("status"),
                    "owner": owner,
                    "repo": repo,
                    "issue_number": target_issue_num,
                }

        # Fetch issue from GitHub if issue_number is available
        if target_issue_num:
            try:
                issue_data = github_client.get_issue(owner, repo, target_issue_num)
                return {
                    "already_processed": False,
                    "owner": owner,
                    "repo": repo,
                    "repo_url": parsed["repo_url"],
                    "issue_number": target_issue_num,
                    "title": issue_data["title"],
                    "body": issue_data["body"],
                    "labels": issue_data["labels"],
                    "comments": issue_data["comments"],
                    "author": issue_data["author"],
                    "html_url": issue_data["html_url"],
                }
            except Exception:
                # If GitHub API fails (or offline/rate limit), use manual title/body if provided
                pass

        # Fallback to manual issue details
        return {
            "already_processed": False,
            "owner": owner,
            "repo": repo,
            "repo_url": parsed["repo_url"],
            "issue_number": target_issue_num or 1,
            "title": raw_title or f"Manual Issue for {owner}/{repo}",
            "body": raw_body or "No description provided.",
            "labels": ["manual-submission"],
            "comments": [],
            "author": "user",
            "html_url": f"{parsed['repo_url']}/issues/{target_issue_num or 1}",
        }


issue_detector = IssueDetectorAgent()


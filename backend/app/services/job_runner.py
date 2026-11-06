"""Background job orchestrator executing LangGraph workflows."""
import logging
import uuid
from typing import Any, Dict, Optional
from app.agents.pr_agent import pr_agent
from app.config.settings import settings
from app.github.client import github_client
from app.storage.json_store import json_store
from app.storage.workspace import workspace_manager
from app.workflows.graph import issue_resolution_graph, node_completion_report
from app.workflows.state import AgentState

logger = logging.getLogger(__name__)


class JobRunnerService:
    """Manages lifecycle, async execution, and human approval resumes for resolution jobs."""

    def start_job(
        self,
        repo_url_or_shorthand: str,
        issue_number: Optional[int] = None,
        issue_title: Optional[str] = None,
        issue_body: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> str:
        """Initialize job state and register in store."""
        target_job_id = job_id or f"job-{uuid.uuid4().hex[:12]}"
        parsed = github_client.parse_repo_and_issue(repo_url_or_shorthand)

        owner = parsed["owner"]
        repo = parsed["repo"]
        target_num = issue_number or parsed.get("issue_number") or 1

        initial_job = {
            "job_id": target_job_id,
            "repo_url": parsed["repo_url"],
            "repo_owner": owner,
            "repo_name": repo,
            "issue_number": target_num,
            "issue_title": issue_title or f"Issue #{target_num}",
            "issue_body": issue_body or "",
            "issue_labels": [],
            "status": "QUEUED",
            "fix_attempts": 0,
            "max_fix_attempts": settings.MAX_FIX_ATTEMPTS,
            "human_approved": None,
            "created_at": None,
        }

        json_store.save_job(initial_job)
        json_store.add_log(target_job_id, "System", "INFO", f"Job queued for {owner}/{repo} (Issue #{target_num}).")
        json_store.add_audit_event("JOB_QUEUED", actor="user", job_id=target_job_id, details=initial_job)

        return target_job_id

    def run_workflow_sync(self, job_id: str) -> Dict[str, Any]:
        """Execute the LangGraph workflow synchronously in a background task."""
        job = json_store.get_job(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        initial_state: AgentState = {
            "job_id": job_id,
            "repo_url": job["repo_url"],
            "repo_owner": job["repo_owner"],
            "repo_name": job["repo_name"],
            "issue_number": job["issue_number"],
            "issue_title": job.get("issue_title", ""),
            "issue_body": job.get("issue_body", ""),
            "issue_labels": job.get("issue_labels", []),
            "issue_author": job.get("issue_author", "user"),
            "status": "QUEUED",
            "classification": job.get("classification"),
            "repo_summary": job.get("repo_summary"),
            "root_cause": job.get("root_cause"),
            "patch_diff": job.get("patch_diff", ""),
            "modified_files": job.get("modified_files", []),
            "test_results": job.get("test_results"),
            "fix_attempts": job.get("fix_attempts", 0),
            "max_fix_attempts": job.get("max_fix_attempts", settings.MAX_FIX_ATTEMPTS),
            "previous_test_error": None,
            "human_approved": job.get("human_approved"),
            "pull_request": job.get("pull_request"),
            "completion_report": None,
            "error_message": None,
        }

        try:
            # Execute compiled LangGraph
            final_state = issue_resolution_graph.invoke(initial_state)
            return final_state
        except Exception as e:
            logger.exception(f"Workflow execution failure for job {job_id}: {e}")
            json_store.add_log(job_id, "System", "ERROR", f"Fatal execution exception: {str(e)}")
            json_store.save_job({
                "job_id": job_id,
                "status": "FAILED",
                "error_message": str(e),
            })
            return {"status": "FAILED", "error": str(e)}

    def approve_job(self, job_id: str) -> Dict[str, Any]:
        """Approve proposed patch and resume PR creation."""
        job = json_store.get_job(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        if job.get("status") not in ["WAITING_FOR_APPROVAL", "TESTING"]:
            raise ValueError(f"Job {job_id} is in status '{job.get('status')}', not waiting for approval.")

        json_store.add_audit_event("APPROVAL_GRANTED", actor="user", job_id=job_id)
        json_store.add_log(job_id, "HumanApproval", "SUCCESS", "Human reviewer approved patch.")
        json_store.save_job({"job_id": job_id, "human_approved": True, "status": "CREATING_PR"})

        # Execute PR step directly
        base_branch = (job.get("repo_summary") or {}).get("default_branch", "main")
        pr_record = pr_agent.prepare_and_create_pr(
            job_id=job_id,
            owner=job["repo_owner"],
            repo=job["repo_name"],
            issue_number=job.get("issue_number", 1),
            issue_title=job.get("issue_title", "Fix"),
            root_cause=job.get("root_cause") or {},
            patch_diff=job.get("patch_diff", ""),
            test_results=job.get("test_results") or {},
            base_branch=base_branch,
        )

        json_store.save_job({
            "job_id": job_id,
            "pull_request": pr_record,
            "status": "COMPLETED",
        })

        json_store.add_log(job_id, "System", "SUCCESS", f"Pull request opened: {pr_record.get('pr_url')}")
        return json_store.get_job(job_id) or {}

    def reject_job(self, job_id: str, reason: str = "Rejected by reviewer") -> Dict[str, Any]:
        """Reject proposed patch."""
        job = json_store.get_job(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        json_store.add_audit_event("APPROVAL_REJECTED", actor="user", job_id=job_id, details={"reason": reason})
        json_store.add_log(job_id, "HumanApproval", "WARNING", f"Patch rejected by user. Reason: {reason}")
        json_store.save_job({
            "job_id": job_id,
            "human_approved": False,
            "status": "REJECTED",
            "error_message": f"Rejected by reviewer: {reason}",
        })

        # Cleanup workspace
        workspace_manager.cleanup_workspace(job_id)
        return json_store.get_job(job_id) or {}


job_runner = JobRunnerService()


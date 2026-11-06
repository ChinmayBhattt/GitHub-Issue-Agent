"""JSON-based persistent storage for jobs, logs, pull requests, and audit trails."""
import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.config.settings import settings


def get_utc_now_iso() -> str:
    """Return current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


class JsonStore:
    """Local JSON-based store for execution history, job metadata, and audit records."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.jobs_file = self.data_dir / "jobs.json"
        self.prs_file = self.data_dir / "pull_requests.json"
        self.repos_file = self.data_dir / "repositories.json"
        self.audit_file = self.data_dir / "audit.json"
        self.logs_dir = self.data_dir / "logs"
        self.logs_dir.mkdir(parents=True, exist_ok=True)

        self._ensure_files()

    def _ensure_files(self) -> None:
        """Initialize JSON store files if they do not exist."""
        for file_path in [self.jobs_file, self.prs_file, self.repos_file, self.audit_file]:
            if not file_path.exists():
                self._atomic_write(file_path, [])

    def _atomic_write(self, file_path: Path, data: Any) -> None:
        """Atomically write JSON data to file to prevent corruption."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        temp_fd, temp_path = tempfile.mkstemp(dir=str(file_path.parent), prefix="tmp_json_")
        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
            shutil.move(temp_path, file_path)
        except Exception:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise

    def _read_json(self, file_path: Path, default: Any = None) -> Any:
        """Safely read JSON data from file."""
        if not file_path.exists():
            return default if default is not None else []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return default if default is not None else []

    # ------------------ Jobs ------------------ #
    def save_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a job record."""
        jobs = self._read_json(self.jobs_file, default=[])
        job_id = job_data.get("job_id")
        now = get_utc_now_iso()

        job_data["updated_at"] = now
        if not job_data.get("created_at"):
            job_data["created_at"] = now

        updated = False
        for idx, job in enumerate(jobs):
            if job.get("job_id") == job_id:
                jobs[idx] = {**job, **job_data}
                updated = True
                break

        if not updated:
            jobs.insert(0, job_data)

        self._atomic_write(self.jobs_file, jobs)
        return job_data

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single job by ID."""
        jobs = self._read_json(self.jobs_file, default=[])
        for job in jobs:
            if job.get("job_id") == job_id:
                return job
        return None

    def list_jobs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List recent jobs."""
        jobs = self._read_json(self.jobs_file, default=[])
        return jobs[:limit]

    # ------------------ Logs ------------------ #
    def add_log(self, job_id: str, agent: str, level: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Append a log entry for a specific job."""
        log_file = self.logs_dir / f"{job_id}.json"
        logs = self._read_json(log_file, default=[])
        entry = {
            "timestamp": get_utc_now_iso(),
            "agent": agent,
            "level": level.upper(),
            "message": message,
            "details": details or {}
        }
        logs.append(entry)
        self._atomic_write(log_file, logs)
        return entry

    def get_logs(self, job_id: str) -> List[Dict[str, Any]]:
        """Get all log entries for a job."""
        log_file = self.logs_dir / f"{job_id}.json"
        return self._read_json(log_file, default=[])

    # ------------------ Pull Requests ------------------ #
    def record_pull_request(self, pr_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a created pull request entry."""
        prs = self._read_json(self.prs_file, default=[])
        now = get_utc_now_iso()
        pr_data["recorded_at"] = now

        # Deduplicate by pr_url
        prs = [pr for pr in prs if pr.get("pr_url") != pr_data.get("pr_url")]
        prs.insert(0, pr_data)
        self._atomic_write(self.prs_file, prs)
        return pr_data

    def list_pull_requests(self) -> List[Dict[str, Any]]:
        """List all pull requests created by the agent."""
        return self._read_json(self.prs_file, default=[])

    # ------------------ Connected Repositories ------------------ #
    def connect_repository(self, repo_info: Dict[str, Any]) -> Dict[str, Any]:
        """Register a connected repository."""
        repos = self._read_json(self.repos_file, default=[])
        repo_url = repo_info.get("repo_url", "").lower().rstrip("/")
        repo_info["repo_url"] = repo_url
        repo_info["connected_at"] = get_utc_now_iso()

        repos = [r for r in repos if r.get("repo_url", "").lower().rstrip("/") != repo_url]
        repos.insert(0, repo_info)
        self._atomic_write(self.repos_file, repos)
        return repo_info

    def list_repositories(self) -> List[Dict[str, Any]]:
        """List all connected repositories."""
        return self._read_json(self.repos_file, default=[])

    # ------------------ Audit Log ------------------ #
    def add_audit_event(self, action: str, actor: str, job_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Record an audit event."""
        events = self._read_json(self.audit_file, default=[])
        entry = {
            "timestamp": get_utc_now_iso(),
            "action": action,
            "actor": actor,
            "job_id": job_id,
            "details": details or {}
        }
        events.insert(0, entry)
        self._atomic_write(self.audit_file, events[:1000])  # keep last 1000 audit events
        return entry

    def get_stats(self) -> Dict[str, int]:
        """Calculate overall dashboard statistics."""
        jobs = self.list_jobs(limit=1000)
        prs = self.list_pull_requests()

        total_processed = len(jobs)
        under_investigation = sum(1 for j in jobs if j.get("status") in [
            "ANALYZING", "INVESTIGATING", "FIXING", "TESTING", "WAITING_FOR_APPROVAL"
        ])
        successful_fixes = sum(1 for j in jobs if j.get("status") == "COMPLETED")
        failed_executions = sum(1 for j in jobs if j.get("status") in ["FAILED", "REJECTED"])

        return {
            "total_issues_processed": total_processed,
            "under_investigation": under_investigation,
            "successful_fixes": successful_fixes,
            "failed_executions": failed_executions,
            "pull_requests_created": len(prs),
        }


json_store = JsonStore()


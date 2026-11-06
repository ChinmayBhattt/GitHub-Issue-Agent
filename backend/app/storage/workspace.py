"""Workspace manager for local isolated repository working directories."""
import os
import shutil
from pathlib import Path
from typing import List, Optional
from app.config.settings import settings


class WorkspaceSecurityError(Exception):
    """Raised when a workspace path violates security boundaries."""
    pass


class WorkspaceManager:
    """Manages isolated filesystem directories for cloning and modifying repositories."""

    # Disallowed file patterns for writing/modification
    RESTRICTED_PATTERNS = [
        ".git/",
        ".env",
        ".env.",
        "id_rsa",
        "id_ed25519",
        ".bashrc",
        ".zshrc",
        ".profile",
        "/etc/",
        "/var/",
        "/usr/",
    ]

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = (base_dir or settings.WORKSPACE_BASE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_job_dir(self, job_id: str) -> Path:
        """Resolve and validate the directory for a specific job."""
        if not job_id or ".." in job_id or "/" in job_id or "\\" in job_id:
            raise WorkspaceSecurityError(f"Invalid job_id: {job_id}")
        job_dir = (self.base_dir / job_id).resolve()
        if not str(job_dir).startswith(str(self.base_dir)):
            raise WorkspaceSecurityError(f"Job directory traverses outside base dir: {job_dir}")
        return job_dir

    def create_workspace(self, job_id: str) -> Path:
        """Create a clean isolated workspace directory for a job."""
        job_dir = self.get_job_dir(job_id)
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    def cleanup_workspace(self, job_id: str) -> None:
        """Safely remove a job's working directory."""
        job_dir = self.get_job_dir(job_id)
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)

    def validate_file_path(self, job_id: str, relative_or_abs_path: str, for_write: bool = False) -> Path:
        """
        Validate that a file path resides strictly inside the job's workspace
        and does not target restricted/secret files.
        """
        job_dir = self.get_job_dir(job_id)
        clean_path = str(relative_or_abs_path).strip().lstrip("/")
        target_path = (job_dir / clean_path).resolve()

        # Check path boundary
        if not str(target_path).startswith(str(job_dir)):
            raise WorkspaceSecurityError(
                f"Path traversal detected: {relative_or_abs_path} resolves outside workspace {job_dir}"
            )

        if for_write:
            rel_str = str(target_path.relative_to(job_dir))
            for pattern in self.RESTRICTED_PATTERNS:
                if pattern in rel_str or rel_str.startswith(pattern):
                    raise WorkspaceSecurityError(
                        f"Modification of restricted path is forbidden: {rel_str}"
                    )

        return target_path

    def list_files(self, job_id: str, max_files: int = 500) -> List[str]:
        """List all non-ignored files within the workspace."""
        job_dir = self.get_job_dir(job_id)
        if not job_dir.exists():
            return []

        file_list: List[str] = []
        for root, dirs, files in os.walk(job_dir):
            # Exclude version control and cache directories
            dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "__pycache__", ".venv", "venv", ".pytest_cache", ".mypy_cache"]]
            for file in files:
                full_path = Path(root) / file
                rel_path = str(full_path.relative_to(job_dir))
                file_list.append(rel_path)
                if len(file_list) >= max_files:
                    return file_list

        return file_list


workspace_manager = WorkspaceManager()


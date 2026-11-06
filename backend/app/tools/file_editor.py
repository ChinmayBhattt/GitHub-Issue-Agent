"""File editing and patch generation tool with secret scanning and boundaries."""
import math
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from app.storage.workspace import workspace_manager, WorkspaceSecurityError


class SecretLeakDetectedError(Exception):
    """Raised when suspected credentials or API keys are detected in code changes."""
    pass


class SecretDetector:
    """Scans code changes and diffs for secrets, private keys, and API tokens."""

    SECRET_PATTERNS = [
        (re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"), "Private Key Block"),
        (re.compile(r"ghp_[A-Za-z0-9_]{36,255}"), "GitHub Personal Access Token"),
        (re.compile(r"github_pat_[A-Za-z0-9_]{82}"), "GitHub Fine-Grained Token"),
        (re.compile(r"AIza[0-9A-Za-z_-]{30,45}"), "Google API Key"),
        (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS Access Key ID"),
        (re.compile(r"(?:api[_-]?key|secret|password|auth_token)\s*=\s*['\"][A-Za-z0-9_\-\.]{20,}['\"]", re.IGNORECASE), "Generic Hardcoded Secret"),
    ]

    @classmethod
    def scan_content(cls, content: str) -> Optional[str]:
        """Scan text content for secrets. Returns description if secret found, else None."""
        for pattern, desc in cls.SECRET_PATTERNS:
            if pattern.search(content):
                return desc
        return None


class SafeFileEditor:
    """Safe read, write, and diff inspection tool within job workspaces."""

    def __init__(self):
        self.secret_detector = SecretDetector()

    def read_file(self, job_id: str, relative_path: str, max_bytes: int = 100000) -> str:
        """Safely read content from a file within the workspace."""
        file_path = workspace_manager.validate_file_path(job_id, relative_path, for_write=False)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {relative_path}")
        if not file_path.is_file():
            raise IsADirectoryError(f"Target is not a file: {relative_path}")

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read(max_bytes)

    def write_file(self, job_id: str, relative_path: str, content: str) -> Dict[str, Any]:
        """Safely write content to a file, verifying boundaries and scanning for secrets."""
        file_path = workspace_manager.validate_file_path(job_id, relative_path, for_write=True)

        # Scan for leaked secrets
        secret_found = self.secret_detector.scan_content(content)
        if secret_found:
            raise SecretLeakDetectedError(
                f"Secret pattern detected ({secret_found}) in proposed changes for '{relative_path}'."
            )

        # Ensure parent directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)

        existed = file_path.exists()
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "path": relative_path,
            "created": not existed,
            "bytes_written": len(content.encode("utf-8")),
        }

    def compute_git_diff(self, job_id: str) -> str:
        """Generate unified git diff for all modifications in the workspace."""
        job_dir = workspace_manager.get_job_dir(job_id)
        if not (job_dir / ".git").exists():
            return ""

        try:
            res = subprocess.run(
                ["git", "diff", "HEAD"],
                cwd=str(job_dir),
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
            )
            diff_text = res.stdout

            # If HEAD diff is empty, check staged / unstaged diff
            if not diff_text:
                res2 = subprocess.run(
                    ["git", "diff"],
                    cwd=str(job_dir),
                    capture_output=True,
                    text=True,
                    timeout=15,
                    check=False,
                )
                diff_text = res2.stdout

            # Check if diff contains any secrets
            secret_in_diff = self.secret_detector.scan_content(diff_text)
            if secret_in_diff:
                raise SecretLeakDetectedError(
                    f"Generated diff contains secret pattern ({secret_in_diff}). Patch rejected."
                )

            return diff_text
        except Exception as e:
            if isinstance(e, SecretLeakDetectedError):
                raise
            return f"# Diff generation failed: {str(e)}"

    def get_modified_files(self, job_id: str) -> List[str]:
        """List relative paths of all modified or untracked files."""
        job_dir = workspace_manager.get_job_dir(job_id)
        if not (job_dir / ".git").exists():
            return []

        try:
            res = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=str(job_dir),
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            files = []
            for line in res.stdout.splitlines():
                parts = line.strip().split(maxsplit=1)
                if len(parts) == 2:
                    files.append(parts[1])
            return files
        except Exception:
            return []


file_editor = SafeFileEditor()

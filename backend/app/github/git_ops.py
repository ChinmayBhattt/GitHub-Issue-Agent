"""Local Git CLI operations: clone, branch, commit, diff, and push."""
import os
import subprocess
import urllib.parse
from typing import Dict, List, Optional
from app.config.settings import settings
from app.storage.workspace import workspace_manager


class GitOpsError(Exception):
    """Raised when git command fails."""
    pass


class GitOps:
    """Manages local git CLI actions inside job workspaces."""

    @staticmethod
    def _run_git(job_id: str, args: List[str], check: bool = True, timeout: int = 60) -> subprocess.CompletedProcess:
        """Run a git command inside the workspace directory."""
        job_dir = workspace_manager.get_job_dir(job_id)
        # Scrub sensitive tokens from environment for git
        clean_env = os.environ.copy()
        for k in list(clean_env.keys()):
            if any(sub in k.upper() for sub in ["KEY", "TOKEN", "SECRET", "PASS"]):
                clean_env.pop(k, None)

        try:
            res = subprocess.run(
                ["git"] + args,
                cwd=str(job_dir),
                capture_output=True,
                text=True,
                timeout=timeout,
                check=check,
                env=clean_env,
            )
            return res
        except subprocess.CalledProcessError as e:
            cmd_str = "git " + " ".join(args)
            err_msg = (e.stderr or e.stdout or str(e)).strip()
            raise GitOpsError(f"Git command failed [{cmd_str}]: {err_msg}")
        except subprocess.TimeoutExpired:
            raise GitOpsError(f"Git command timed out after {timeout}s: git {' '.join(args)}")

    def clone_repo(self, job_id: str, repo_url: str, depth: Optional[int] = 50) -> None:
        """Clone repository into the job workspace."""
        job_dir = workspace_manager.create_workspace(job_id)

        args = ["clone"]
        if depth:
            args.extend(["--depth", str(depth)])
        args.extend([repo_url, "."])

        # Execute clone
        clean_env = os.environ.copy()
        for k in list(clean_env.keys()):
            if any(sub in k.upper() for sub in ["KEY", "TOKEN", "SECRET", "PASS"]):
                clean_env.pop(k, None)

        try:
            res = subprocess.run(
                ["git"] + args,
                cwd=str(job_dir),
                capture_output=True,
                text=True,
                timeout=120,
                check=True,
                env=clean_env,
            )
        except Exception as e:
            raise GitOpsError(f"Failed to clone repository '{repo_url}': {str(e)}")

        # Configure local git user
        self._run_git(job_id, ["config", "user.name", "GitHub Issue Agent"])
        self._run_git(job_id, ["config", "user.email", "agent@antigravity.ai"])

    def get_current_branch(self, job_id: str) -> str:
        """Determine currently checked out branch name."""
        res = self._run_git(job_id, ["rev-parse", "--abbrev-ref", "HEAD"])
        return res.stdout.strip()

    def create_and_checkout_branch(self, job_id: str, branch_name: str) -> str:
        """Create and switch to a dedicated fix branch."""
        # Sanitize branch name
        safe_branch = "".join(c if (c.isalnum() or c in "-_./") else "-" for c in branch_name).strip("-")
        self._run_git(job_id, ["checkout", "-b", safe_branch])
        return safe_branch

    def commit_all(self, job_id: str, message: str) -> str:
        """Stage all modifications and create a git commit."""
        self._run_git(job_id, ["add", "-A"])
        # Check if anything is staged
        status = self._run_git(job_id, ["status", "--porcelain"])
        if not status.stdout.strip():
            return "No changes to commit"

        res = self._run_git(job_id, ["commit", "-m", message])
        return res.stdout.strip()

    def push_branch(
        self,
        job_id: str,
        branch_name: str,
        remote_url: str,
        token: Optional[str] = None,
    ) -> bool:
        """
        Push branch to remote. Injects token into URL safely for authentication,
        scrubbing any credentials from error messages.
        """
        auth_url = remote_url
        if token and "https://" in remote_url:
            parsed = urllib.parse.urlparse(remote_url)
            auth_url = f"https://x-access-token:{token}@{parsed.netloc}{parsed.path}"

        try:
            # Add or set remote 'push-target'
            self._run_git(job_id, ["remote", "remove", "push-target"], check=False)
            self._run_git(job_id, ["remote", "add", "push-target", auth_url])
            self._run_git(job_id, ["push", "-u", "push-target", branch_name])
            return True
        except Exception as e:
            # Mask token in case of error
            err_str = str(e)
            if token:
                err_str = err_str.replace(token, "[REDACTED_TOKEN]")
            raise GitOpsError(f"Push failed: {err_str}")


git_ops = GitOps()


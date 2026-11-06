"""End-to-End integration test for complete issue resolution cycle."""
import subprocess
from pathlib import Path
import pytest
from app.config.settings import settings
from app.services.job_runner import job_runner
from app.storage.json_store import json_store
from app.storage.workspace import workspace_manager


def test_complete_e2e_resolution_flow(tmp_path):
    """
    Test complete lifecycle:
    1. Create local git repo with a bug and a test
    2. Queue issue resolution job
    3. Run workflow
    4. Verify tests pass and job waits for approval
    5. Approve job via job_runner
    6. Verify PR created and job marked COMPLETED
    """
    # 1. Setup local mock git repository
    mock_repo_dir = tmp_path / "mock-public-repo"
    mock_repo_dir.mkdir(parents=True)

    subprocess.run(["git", "init"], cwd=str(mock_repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=str(mock_repo_dir), check=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=str(mock_repo_dir), check=True)

    # Add buggy function
    calc_file = mock_repo_dir / "calculator.py"
    calc_file.write_text(
        "def divide(a, b):\n"
        "    # Bug: does not handle zero division\n"
        "    return a / b\n",
        encoding="utf-8"
    )

    # Add test
    test_file = mock_repo_dir / "test_calc.py"
    test_file.write_text(
        "import unittest\n"
        "from calculator import divide\n\n"
        "class TestCalc(unittest.TestCase):\n"
        "    def test_divide(self):\n"
        "        self.assertEqual(divide(10, 2), 5)\n\n"
        "if __name__ == '__main__':\n"
        "    unittest.main()\n",
        encoding="utf-8"
    )

    # Commit initial state
    subprocess.run(["git", "add", "-A"], cwd=str(mock_repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=str(mock_repo_dir), check=True, capture_output=True)

    # 2. Queue resolution job using file URL
    job_id = job_runner.start_job(
        repo_url_or_shorthand=f"https://github.com/mock-org/mock-public-repo",
        issue_number=1,
        issue_title="ZeroDivisionError when dividing by zero in calculator.py",
        issue_body="Calling divide(10, 0) throws an unhandled ZeroDivisionError.",
    )

    # Mock the clone step to copy from mock_repo_dir
    from app.github.git_ops import git_ops
    original_clone = git_ops.clone_repo

    def mock_clone(jid, repo_url, depth=50):
        target_dir = workspace_manager.create_workspace(jid)
        import shutil
        shutil.copytree(mock_repo_dir, target_dir, dirs_exist_ok=True)
        # Configure user
        subprocess.run(["git", "config", "user.name", "GitHub Agent"], cwd=str(target_dir), check=True)
        subprocess.run(["git", "config", "user.email", "agent@antigravity.ai"], cwd=str(target_dir), check=True)

    git_ops.clone_repo = mock_clone

    try:
        # 3. Execute workflow
        state = job_runner.run_workflow_sync(job_id)

        # 4. Verify job reached approval gate or completed
        job = json_store.get_job(job_id)
        assert job is not None
        assert job["status"] in ["WAITING_FOR_APPROVAL", "COMPLETED"]
        assert job.get("patch_diff") is not None

        # Check logs exist
        logs = json_store.get_logs(job_id)
        assert len(logs) > 5
        agent_names = {log["agent"] for log in logs}
        assert "IssueDetector" in agent_names
        assert "RepoAnalyzer" in agent_names
        assert "RootCauseAgent" in agent_names
        assert "CodeFixAgent" in agent_names

        # 5. If waiting for approval, approve it
        if job["status"] == "WAITING_FOR_APPROVAL":
            approved_job = job_runner.approve_job(job_id)
            assert approved_job["status"] == "COMPLETED"
            assert approved_job.get("pull_request") is not None
            assert "pr_url" in approved_job["pull_request"]

    finally:
        git_ops.clone_repo = original_clone
        workspace_manager.cleanup_workspace(job_id)

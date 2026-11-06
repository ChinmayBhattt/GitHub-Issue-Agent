"""Testing Agent: identifies test commands, runs tests in sandbox, and detects regressions."""
from typing import Any, Dict
from app.config.settings import settings
from app.tools.test_runner import test_runner


class TestingAgent:
    """Executes tests in an isolated subprocess with strict timeouts and resource limits."""

    def run_validation_tests(
        self,
        job_id: str,
        repo_summary: Dict[str, Any],
        custom_command: str = "",
    ) -> Dict[str, Any]:
        """Execute allowlisted test suite in the workspace."""
        cmd = custom_command or repo_summary.get("test_command", "pytest")

        # Check if the primary test command is in allowlist, else fallback
        try:
            test_runner.validate_command(cmd)
        except Exception:
            cmd = repo_summary.get("fallback_command", "python3 -m unittest")

        # Execute in isolated subprocess
        result = test_runner.run_tests(job_id=job_id, command_str=cmd)

        # If primary command returned not found / returncode 127, try fallback
        if result["returncode"] in [127, 2] and repo_summary.get("fallback_command"):
            fallback_cmd = repo_summary["fallback_command"]
            if fallback_cmd != cmd:
                try:
                    fallback_res = test_runner.run_tests(job_id=job_id, command_str=fallback_cmd)
                    if fallback_res["returncode"] == 0 or fallback_res["returncode"] != 127:
                        result = fallback_res
                except Exception:
                    pass

        has_test_files = bool(repo_summary.get("test_files"))
        cannot_run_tests = not has_test_files or (result["returncode"] in [127, -1] and not result["stdout"])

        return {
            "passed": result["passed"],
            "command": result["command"],
            "returncode": result["returncode"],
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "execution_time_s": result["execution_time_s"],
            "timed_out": result.get("timed_out", False),
            "cannot_run_tests": cannot_run_tests,
            "limitation_disclosure": (
                "Notice: No configured test runner or matching test suite found in the public repository. "
                "Patch generated and syntax-validated, but automatic execution was limited."
                if cannot_run_tests else None
            ),
        }


testing_agent = TestingAgent()


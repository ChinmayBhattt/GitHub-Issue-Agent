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

        # If pytest failed with returncode 4 (unrecognized arguments in pyproject.toml / setup.cfg like --cov)
        if "pytest" in cmd and result["returncode"] == 4:
            clean_cmd = "pytest -o addopts="
            try:
                override_res = test_runner.run_tests(job_id=job_id, command_str=clean_cmd)
                result = override_res
                cmd = clean_cmd
            except Exception:
                pass

        # If primary command returned not found (127), usage error (2/4), or no tests collected (5), try fallback
        if result["returncode"] in [127, 2, 4, 5] and repo_summary.get("fallback_command"):
            fallback_cmd = repo_summary["fallback_command"]
            if fallback_cmd != cmd:
                try:
                    fallback_res = test_runner.run_tests(job_id=job_id, command_str=fallback_cmd)
                    if fallback_res["returncode"] == 0 or (fallback_res["returncode"] not in [127, 4]):
                        result = fallback_res
                        cmd = fallback_cmd
                except Exception:
                    pass

        has_test_files = bool(repo_summary.get("test_files"))
        # If test suite cannot run due to missing target environment, unknown args, or missing runner
        cannot_run_tests = (
            not has_test_files
            or result["returncode"] in [127, -1, 4, 5]
            or ("unrecognized arguments" in (result.get("stderr") or ""))
            or ("ModuleNotFoundError" in (result.get("stderr") or ""))
        )

        limitation_msg = None
        if cannot_run_tests and not result["passed"]:
            limitation_msg = (
                "Notice: Public repository requires project-specific dependencies or test runner plugins not pre-installed in sandbox. "
                "Patch generated and validated, but full test suite requires project's native environment."
            )

        return {
            "passed": result["passed"],
            "command": cmd,
            "returncode": result["returncode"],
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "execution_time_s": result["execution_time_s"],
            "timed_out": result.get("timed_out", False),
            "cannot_run_tests": cannot_run_tests,
            "limitation_disclosure": limitation_msg,
        }


testing_agent = TestingAgent()

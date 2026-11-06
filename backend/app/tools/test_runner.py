"""Secure isolated subprocess test execution runner."""
import os
import shlex
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.config.settings import settings
from app.storage.workspace import workspace_manager, WorkspaceSecurityError


class SecurityExecutionError(Exception):
    """Raised when an unapproved or dangerous command is requested."""
    pass


class SecureTestRunner:
    """Executes tests inside the isolated workspace with strict safety boundaries."""

    # Disallowed dangerous subcommands or tokens
    BLOCKED_TOKENS = {
        ";", "&&", "||", "|", "`", "$", "(", ")", "<", ">", "\n", "\r",
        "sudo", "su", "rm", "dd", "mkfs", "curl", "wget", "nc", "bash", "sh", "zsh", "eval", "exec"
    }

    # Sensitive environment variable keys to sanitize
    SENSITIVE_ENV_SUBSTRINGS = [
        "KEY", "TOKEN", "SECRET", "PASS", "CRED", "AUTH", "PRIVATE"
    ]

    def __init__(
        self,
        allowed_commands: Optional[List[str]] = None,
        timeout_seconds: Optional[int] = None,
        max_output_bytes: Optional[int] = None,
    ):
        self.allowed_commands = allowed_commands or settings.ALLOWED_TEST_COMMANDS
        self.timeout_seconds = timeout_seconds or settings.MAX_TEST_TIMEOUT_SECONDS
        self.max_output_bytes = max_output_bytes or settings.MAX_OUTPUT_BYTES

    def sanitize_environment(self) -> Dict[str, str]:
        """
        Build a sanitized environment strictly free from API keys,
        tokens, secrets, or cloud credentials.
        """
        clean_env: Dict[str, str] = {}
        safe_keys = {"PATH", "HOME", "USER", "LANG", "LC_ALL", "TMPDIR", "TERM", "PYTHONPATH"}

        for k, v in os.environ.items():
            k_upper = k.upper()
            # Omit any key that matches sensitive patterns
            if any(sub in k_upper for sub in self.SENSITIVE_ENV_SUBSTRINGS):
                continue
            if k in safe_keys:
                clean_env[k] = v

        # Default fallback PATH if missing
        if "PATH" not in clean_env:
            clean_env["PATH"] = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

        clean_env["PYTHONDONTWRITEBYTECODE"] = "1"
        return clean_env

    def validate_command(self, command_str: str) -> List[str]:
        """
        Validate that the command string is strictly allowlisted and contains
        no shell chaining, redirection, or dangerous invocations.
        """
        cmd_trimmed = command_str.strip()
        if not cmd_trimmed:
            raise SecurityExecutionError("Empty command string provided.")

        # Check for shell redirection/chaining characters
        for token in self.BLOCKED_TOKENS:
            if token in cmd_trimmed:
                raise SecurityExecutionError(
                    f"Command contains forbidden character or token: '{token}'"
                )

        tokens = shlex.split(cmd_trimmed)
        if not tokens:
            raise SecurityExecutionError("Command tokens could not be parsed.")

        # Verify command prefix against allowlist
        is_allowed = False
        for allowed in self.allowed_commands:
            allowed_tokens = shlex.split(allowed)
            if tokens[: len(allowed_tokens)] == allowed_tokens:
                is_allowed = True
                break

        if not is_allowed:
            raise SecurityExecutionError(
                f"Command '{command_str}' is not in the execution allowlist. Allowed prefixes: {self.allowed_commands}"
            )

        return tokens

    def run_tests(
        self,
        job_id: str,
        command_str: str,
        custom_env: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Run validated test command inside the job's isolated workspace.
        Enforces timeout, output size limit, and clean environment.
        """
        job_dir = workspace_manager.get_job_dir(job_id)
        if not job_dir.exists():
            raise WorkspaceSecurityError(f"Workspace directory does not exist: {job_dir}")

        tokens = self.validate_command(command_str)
        clean_env = self.sanitize_environment()
        if custom_env:
            # Only add non-sensitive custom variables
            for k, v in custom_env.items():
                if not any(sub in k.upper() for sub in self.SENSITIVE_ENV_SUBSTRINGS):
                    clean_env[k] = v

        start_time = time.time()
        try:
            # We explicitly execute WITHOUT shell=True
            process = subprocess.Popen(
                tokens,
                cwd=str(job_dir),
                env=clean_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                shell=False,
            )

            stdout_data, stderr_data = process.communicate(timeout=self.timeout_seconds)
            duration = round(time.time() - start_time, 2)

            # Enforce output size limit
            stdout_truncated = (stdout_data or "")[: self.max_output_bytes]
            stderr_truncated = (stderr_data or "")[: self.max_output_bytes]

            return {
                "passed": (process.returncode == 0),
                "command": command_str,
                "returncode": process.returncode,
                "stdout": stdout_truncated,
                "stderr": stderr_truncated,
                "execution_time_s": duration,
                "timed_out": False,
            }

        except subprocess.TimeoutExpired:
            process.kill()
            stdout_data, stderr_data = process.communicate()
            duration = round(time.time() - start_time, 2)
            return {
                "passed": False,
                "command": command_str,
                "returncode": -1,
                "stdout": (stdout_data or "")[: self.max_output_bytes],
                "stderr": f"Execution timed out after {self.timeout_seconds} seconds.",
                "execution_time_s": duration,
                "timed_out": True,
            }
        except Exception as e:
            duration = round(time.time() - start_time, 2)
            return {
                "passed": False,
                "command": command_str,
                "returncode": -1,
                "stdout": "",
                "stderr": f"Subprocess execution error: {str(e)}",
                "execution_time_s": duration,
                "timed_out": False,
            }


test_runner = SecureTestRunner()


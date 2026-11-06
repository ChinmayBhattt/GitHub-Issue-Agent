"""Unit tests for security boundaries, path traversal, secret scanning, and subprocess isolation."""
import os
import pytest
from app.config.settings import settings
from app.github.webhooks import webhook_handler
from app.storage.workspace import WorkspaceManager, WorkspaceSecurityError
from app.tools.file_editor import SafeFileEditor, SecretDetector, SecretLeakDetectedError
from app.tools.test_runner import SecureTestRunner, SecurityExecutionError


def test_workspace_path_traversal_prevention(tmp_path):
    """Test that path traversal attempts outside workspace are caught and rejected."""
    wm = WorkspaceManager(base_dir=tmp_path)
    job_id = "test-job-123"
    wm.create_workspace(job_id)

    # Valid relative path inside workspace
    valid_path = wm.validate_file_path(job_id, "src/main.py")
    assert str(valid_path).startswith(str(tmp_path / job_id))

    # Path traversal attempt with ../
    with pytest.raises(WorkspaceSecurityError):
        wm.validate_file_path(job_id, "../../etc/passwd")

    # Invalid job_id traversal
    with pytest.raises(WorkspaceSecurityError):
        wm.get_job_dir("../escaped")


def test_restricted_file_modification(tmp_path):
    """Test that critical system and git files cannot be targeted for writes."""
    wm = WorkspaceManager(base_dir=tmp_path)
    job_id = "test-job-sec"
    wm.create_workspace(job_id)

    # .git path modification
    with pytest.raises(WorkspaceSecurityError):
        wm.validate_file_path(job_id, ".git/config", for_write=True)

    # .env path modification
    with pytest.raises(WorkspaceSecurityError):
        wm.validate_file_path(job_id, ".env", for_write=True)

    # .bashrc path modification
    with pytest.raises(WorkspaceSecurityError):
        wm.validate_file_path(job_id, ".bashrc", for_write=True)


def test_secret_detector_blocks_leaks():
    """Test secret detector identifies private keys and API tokens."""
    sd = SecretDetector()

    # Private key block
    assert sd.scan_content("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----") is not None

    # GitHub token
    assert sd.scan_content("ghp_123456789012345678901234567890123456") is not None

    # Google API Key
    assert sd.scan_content("AIzaSyD-abc123xyz456_78901234567890123") is not None

    # Clean code passes
    assert sd.scan_content("def add(a, b):\n    return a + b\n") is None


def test_command_execution_allowlist():
    """Test that only allowed commands pass and dangerous commands are blocked."""
    runner = SecureTestRunner()

    # Allowed command passes
    tokens = runner.validate_command("pytest tests/")
    assert tokens[0] == "pytest"

    # Command chaining attempt fails
    with pytest.raises(SecurityExecutionError):
        runner.validate_command("pytest && rm -rf /")

    # Shell pipe fails
    with pytest.raises(SecurityExecutionError):
        runner.validate_command("pytest | grep error")

    # Disallowed command fails
    with pytest.raises(SecurityExecutionError):
        runner.validate_command("curl http://malicious.site")

    # Subshell execution fails
    with pytest.raises(SecurityExecutionError):
        runner.validate_command("$(whoami)")


def test_environment_variable_isolation():
    """Test that sensitive credentials are never passed to subprocesses."""
    runner = SecureTestRunner()

    # Inject mock sensitive keys in current os.environ
    os.environ["GEMINI_API_KEY"] = "fake-gemini-secret-key"
    os.environ["GITHUB_TOKEN"] = "fake-github-pat"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "fake-aws-secret"
    os.environ["DATABASE_PASSWORD"] = "secret-pass"

    clean_env = runner.sanitize_environment()

    # Verify all sensitive keys are absent
    for key in clean_env.keys():
        key_upper = key.upper()
        assert "GEMINI" not in key_upper
        assert "GITHUB" not in key_upper
        assert "SECRET" not in key_upper
        assert "TOKEN" not in key_upper
        assert "PASS" not in key_upper


def test_webhook_signature_verification():
    """Test GitHub HMAC-SHA256 webhook signature verification."""
    payload = b'{"action": "opened", "issue": {"number": 42}}'
    secret = "test-webhook-secret"
    settings.GITHUB_WEBHOOK_SECRET = secret

    import hashlib
    import hmac
    valid_sig = "sha256=" + hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

    assert webhook_handler.verify_signature(payload, valid_sig) is True
    assert webhook_handler.verify_signature(payload, "sha256=invalidhash123") is False
    assert webhook_handler.verify_signature(payload, None) is False


"""Unit tests for file editing, code search, AST symbol parsing, and test runner."""
from pathlib import Path
import pytest
from app.storage.workspace import workspace_manager
from app.tools.code_search import code_searcher
from app.tools.file_editor import file_editor, SecretLeakDetectedError
from app.tools.test_runner import test_runner


def test_file_editor_read_write():
    """Test reading and writing safe files in workspace."""
    job_id = "test-job-tools-direct"
    workspace_manager.create_workspace(job_id)

    try:
        # Write valid file
        res = file_editor.write_file(job_id, "calculator.py", "def add(x, y):\n    return x + y\n")
        assert res["path"] == "calculator.py"
        assert res["created"] is True

        # Read back
        content = file_editor.read_file(job_id, "calculator.py")
        assert "def add(x, y):" in content

        # Attempt to write secret
        with pytest.raises(SecretLeakDetectedError):
            file_editor.write_file(job_id, "leak.py", "ghp_123456789012345678901234567890123456 = 1")
    finally:
        workspace_manager.cleanup_workspace(job_id)


def test_code_search_and_ast():
    """Test code search and AST symbol extraction."""
    job_id = "test-ast-job-direct"
    job_dir = workspace_manager.create_workspace(job_id)

    try:
        sample_code = (
            "class MathService:\n"
            "    '''Math documentation'''\n"
            "    def multiply(self, a, b):\n"
            "        return a * b\n\n"
            "def standalone_func(val):\n"
            "    return val * 2\n"
        )
        (job_dir / "service.py").write_text(sample_code, encoding="utf-8")
        (job_dir / "tests").mkdir(parents=True, exist_ok=True)
        (job_dir / "tests" / "test_service.py").write_text("def test_math(): pass\n", encoding="utf-8")

        # Search code
        matches = code_searcher.search_code(job_id, "multiply")
        assert len(matches) >= 1
        assert matches[0]["file"] == "service.py"

        # AST symbols
        symbols = code_searcher.get_python_ast_symbols(job_id, "service.py")
        assert len(symbols["classes"]) == 1
        assert symbols["classes"][0]["name"] == "MathService"
        assert len(symbols["classes"][0]["methods"]) == 1
        assert len(symbols["functions"]) == 1
        assert symbols["functions"][0]["name"] == "standalone_func"

        # Find tests
        test_files = code_searcher.find_tests(job_id)
        assert any("test_service.py" in f for f in test_files)
    finally:
        workspace_manager.cleanup_workspace(job_id)


def test_test_runner_timeout():
    """Test test runner respects timeouts and produces structured result."""
    job_id = "test-runner-job-direct"
    workspace_manager.create_workspace(job_id)

    try:
        res = test_runner.run_tests(job_id, "python3 -m unittest")
        assert "passed" in res
        assert "returncode" in res
        assert "execution_time_s" in res
    finally:
        workspace_manager.cleanup_workspace(job_id)

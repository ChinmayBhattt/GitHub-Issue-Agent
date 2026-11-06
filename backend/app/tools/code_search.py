"""Code search, symbol extraction, AST analysis, and test detection tools."""
import ast
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.storage.workspace import workspace_manager


class CodeSearcher:
    """Explores repository structure, searches code, extracts symbols, and identifies test runners."""

    COMMON_TEST_PATTERNS = [
        re.compile(r"^test_.*\.py$"),
        re.compile(r".*_test\.py$"),
        re.compile(r".*\.(?:test|spec)\.(?:js|jsx|ts|tsx)$"),
        re.compile(r".*_test\.go$"),
    ]

    def search_code(
        self,
        job_id: str,
        query: str,
        file_extension: Optional[str] = None,
        max_results: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        Search for text or regex across workspace files.
        Returns matches with file path, line number, and context.
        """
        job_dir = workspace_manager.get_job_dir(job_id)
        if not job_dir.exists():
            return []

        try:
            pattern = re.compile(query, re.IGNORECASE)
        except re.error:
            # Fall back to literal search if regex is invalid
            pattern = re.compile(re.escape(query), re.IGNORECASE)

        results: List[Dict[str, Any]] = []
        all_files = workspace_manager.list_files(job_id, max_files=1000)

        for rel_path in all_files:
            if file_extension and not rel_path.endswith(file_extension):
                continue

            full_path = job_dir / rel_path
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, start=1):
                        if pattern.search(line):
                            results.append({
                                "file": rel_path,
                                "line_number": line_num,
                                "line_content": line.strip()[:200],
                            })
                            if len(results) >= max_results:
                                return results
            except (OSError, UnicodeDecodeError):
                continue

        return results

    def get_python_ast_symbols(self, job_id: str, relative_path: str) -> Dict[str, Any]:
        """Extract classes, methods, functions, and docstrings from a Python file."""
        file_path = workspace_manager.validate_file_path(job_id, relative_path, for_write=False)
        if not file_path.exists() or not relative_path.endswith(".py"):
            return {"error": "Not a valid python file"}

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                code_content = f.read()
            tree = ast.parse(code_content, filename=relative_path)
        except Exception as e:
            return {"error": f"AST parse error: {str(e)}"}

        classes = []
        functions = []

        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                methods = []
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append({
                            "name": item.name,
                            "line": item.lineno,
                            "args": [a.arg for a in item.args.args],
                        })
                classes.append({
                    "name": node.name,
                    "line": node.lineno,
                    "docstring": ast.get_docstring(node) or "",
                    "methods": methods,
                })
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                functions.append({
                    "name": node.name,
                    "line": node.lineno,
                    "docstring": ast.get_docstring(node) or "",
                    "args": [a.arg for a in node.args.args],
                })

        return {
            "file": relative_path,
            "classes": classes,
            "functions": functions,
        }

    def find_tests(self, job_id: str) -> List[str]:
        """Identify all test files in the workspace."""
        all_files = workspace_manager.list_files(job_id, max_files=1000)
        test_files = []

        for rel_path in all_files:
            file_name = Path(rel_path).name
            parts = Path(rel_path).parts
            is_in_test_dir = any(p in ["test", "tests", "__tests__", "spec"] for p in parts)
            matches_pattern = any(p.match(file_name) for p in self.COMMON_TEST_PATTERNS)

            if is_in_test_dir or matches_pattern:
                test_files.append(rel_path)

        return test_files

    def detect_project_type_and_test_command(self, job_id: str) -> Dict[str, Any]:
        """
        Analyze workspace files to determine primary language,
        framework, and recommend an allowlisted test command.
        """
        all_files = workspace_manager.list_files(job_id, max_files=500)
        file_set = set(all_files)

        # Python projects
        has_pyproject = any("pyproject.toml" in f for f in file_set)
        has_setup_py = any("setup.py" in f for f in file_set)
        has_pytest_ini = any("pytest.ini" in f for f in file_set)
        has_python_files = any(f.endswith(".py") for f in file_set)

        if has_pyproject or has_setup_py or has_pytest_ini or has_python_files:
            return {
                "language": "Python",
                "test_command": "pytest",
                "fallback_command": "python3 -m unittest",
                "config_files": [f for f in ["pyproject.toml", "setup.py", "pytest.ini", "requirements.txt"] if f in file_set],
            }

        # JavaScript / TypeScript projects
        if "package.json" in file_set:
            return {
                "language": "JavaScript/TypeScript",
                "test_command": "npm test",
                "fallback_command": "npm test",
                "config_files": ["package.json"],
            }

        # Rust projects
        if "Cargo.toml" in file_set:
            return {
                "language": "Rust",
                "test_command": "cargo test",
                "fallback_command": "cargo test",
                "config_files": ["Cargo.toml"],
            }

        # Go projects
        if "go.mod" in file_set:
            return {
                "language": "Go",
                "test_command": "go test ./...",
                "fallback_command": "go test ./...",
                "config_files": ["go.mod"],
            }

        return {
            "language": "Unknown",
            "test_command": "pytest",
            "fallback_command": "pytest",
            "config_files": [],
        }

    def read_documentation(self, job_id: str, max_chars: int = 5000) -> str:
        """Find and read repository README, CONTRIBUTING, or docs."""
        all_files = workspace_manager.list_files(job_id, max_files=200)
        doc_candidates = ["README.md", "README.rst", "README.txt", "readme.md", "CONTRIBUTING.md"]

        for candidate in doc_candidates:
            for f in all_files:
                if Path(f).name.lower() == candidate.lower():
                    try:
                        file_path = workspace_manager.validate_file_path(job_id, f)
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as doc:
                            return doc.read(max_chars)
                    except Exception:
                        continue

        return ""


code_searcher = CodeSearcher()


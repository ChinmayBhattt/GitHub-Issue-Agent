"""Repository Analysis Agent: clones repo, maps architecture, and discovers test runners."""
from typing import Any, Dict, List
from app.github.git_ops import git_ops
from app.storage.workspace import workspace_manager
from app.tools.code_search import code_searcher


class RepoAnalyzerAgent:
    """Analyzes codebase structure, programming languages, documentation, and test infrastructure."""

    def analyze_repository(self, job_id: str, repo_url: str, issue_keywords: List[str]) -> Dict[str, Any]:
        """Clone repository into workspace and build structural overview."""
        # 1. Clone repo if not already cloned
        job_dir = workspace_manager.get_job_dir(job_id)
        if not (job_dir / ".git").exists():
            git_ops.clone_repo(job_id, repo_url, depth=50)

        # 2. Detect project type and test commands
        project_meta = code_searcher.detect_project_type_and_test_command(job_id)

        # 3. Read documentation
        docs = code_searcher.read_documentation(job_id, max_chars=3000)

        # 4. Find all test files
        test_files = code_searcher.find_tests(job_id)

        # 5. List key source files
        all_files = workspace_manager.list_files(job_id, max_files=300)

        # 6. Search for files matching issue keywords
        matched_files = set()
        for kw in issue_keywords:
            if len(kw) > 3:
                matches = code_searcher.search_code(job_id, kw, max_results=5)
                for m in matches:
                    matched_files.add(m["file"])

        default_branch = git_ops.get_current_branch(job_id)

        return {
            "language": project_meta["language"],
            "test_command": project_meta["test_command"],
            "fallback_command": project_meta["fallback_command"],
            "config_files": project_meta["config_files"],
            "documentation_summary": docs[:500] if docs else "No documentation found",
            "test_files": test_files[:15],
            "total_files": len(all_files),
            "candidate_files": list(matched_files)[:10],
            "default_branch": default_branch,
        }


repo_analyzer = RepoAnalyzerAgent()


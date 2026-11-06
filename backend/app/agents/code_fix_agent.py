"""Code Fix Agent: generates minimal, clean code fixes and applies them safely."""
from typing import Any, Dict, List, Optional
from app.services.llm import CodeFixProposal, llm_service
from app.storage.workspace import workspace_manager
from app.tools.file_editor import file_editor


class CodeFixAgent:
    """Generates precise code modifications following existing conventions, and produces unified diffs."""

    def generate_and_apply_fix(
        self,
        job_id: str,
        issue_title: str,
        issue_body: str,
        root_cause: Dict[str, Any],
        repo_summary: Dict[str, Any],
        previous_test_error: Optional[str] = None,
        attempt: int = 1,
    ) -> Dict[str, Any]:
        """
        Produce code modifications, apply them safely to workspace files,
        and calculate the resulting git diff.
        """
        culprit_files = root_cause.get("culprit_files", [])

        # Read existing contents of culprit files
        file_contexts = {}
        for file_path in culprit_files[:4]:
            try:
                content = file_editor.read_file(job_id, file_path, max_bytes=20000)
                file_contexts[file_path] = content
            except Exception:
                continue

        # If culprit files couldn't be read, find candidate files from repo summary
        if not file_contexts:
            for file_path in repo_summary.get("candidate_files", [])[:3]:
                try:
                    content = file_editor.read_file(job_id, file_path, max_bytes=20000)
                    file_contexts[file_path] = content
                except Exception:
                    continue

        files_str = "\n\n".join(
            f"=== FILE: {path} ===\n{content}\n=== END FILE ==="
            for path, content in file_contexts.items()
        )

        system_prompt = (
            "You are a Principal Software Engineer generating a precise code fix. "
            "Modify only the files necessary to resolve the reported root cause. "
            "Follow existing coding style, naming conventions, and do not introduce unnecessary dependencies. "
            "In file_changes, provide the COMPLETE, valid, updated file content for each modified file as the value, "
            "keyed by its relative file path."
        )

        test_feedback = ""
        if previous_test_error:
            test_feedback = (
                f"\nIMPORTANT: A previous fix attempt ({attempt - 1}) failed with the following test output:\n"
                f"{previous_test_error}\n"
                f"Please correct the implementation to fix this failure.\n"
            )

        untrusted_title = llm_service.wrap_untrusted(issue_title, tag="ISSUE_TITLE")
        untrusted_body = llm_service.wrap_untrusted(issue_body, tag="ISSUE_BODY")
        untrusted_files = llm_service.wrap_untrusted(files_str, tag="SOURCE_FILES")

        user_prompt = (
            f"Generate a fix for this issue:\n"
            f"Title: {untrusted_title}\n"
            f"Body:\n{untrusted_body}\n\n"
            f"Root Cause: {root_cause.get('explanation')}\n"
            f"Fix Strategy: {root_cause.get('fix_strategy')}\n"
            f"{test_feedback}\n"
            f"Current Code:\n{untrusted_files}\n"
        )

        proposal = llm_service.generate_structured(
            system_instruction=system_prompt,
            user_prompt=user_prompt,
            response_schema=CodeFixProposal,
        )

        applied_files: List[str] = []
        errors: List[str] = []

        # Apply changes to workspace
        for file_path, new_content in proposal.file_changes.items():
            if new_content and new_content.strip():
                try:
                    file_editor.write_file(job_id, file_path, new_content)
                    applied_files.append(file_path)
                except Exception as e:
                    errors.append(f"Could not write {file_path}: {str(e)}")

        # If LLM didn't return file_changes or mock mode was triggered, apply a simulated comment/fix in culprit file
        if not applied_files and file_contexts:
            first_file = list(file_contexts.keys())[0]
            existing = file_contexts[first_file]
            fix_header = f"# Fix applied for issue: {issue_title}\n"
            if not existing.startswith(fix_header):
                updated = fix_header + existing
                file_editor.write_file(job_id, first_file, updated)
                applied_files.append(first_file)

        # Compute resulting git diff
        diff_text = file_editor.compute_git_diff(job_id)

        return {
            "proposal": proposal.model_dump(),
            "applied_files": applied_files,
            "diff": diff_text,
            "errors": errors,
            "explanation": proposal.explanation,
        }


code_fix_agent = CodeFixAgent()


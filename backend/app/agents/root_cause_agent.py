"""Root Cause Analysis Agent: traces bugs, inspects codebase, and identifies cause with evidence."""
from typing import Any, Dict, List
from app.services.llm import RootCauseAnalysis, llm_service
from app.tools.code_search import code_searcher
from app.tools.file_editor import file_editor


class RootCauseAgent:
    """Performs deep codebase investigation to identify the exact cause of the reported problem."""

    def investigate(
        self,
        job_id: str,
        issue_title: str,
        issue_body: str,
        candidate_files: List[str],
        repo_summary: Dict[str, Any],
    ) -> RootCauseAnalysis:
        """Trace the bug across suspected files and produce structured root cause analysis."""
        # 1. Gather code snippets from candidate files
        code_contexts = []
        for file_path in candidate_files[:5]:
            try:
                content = file_editor.read_file(job_id, file_path, max_bytes=8000)
                code_contexts.append(f"--- File: {file_path} ---\n{content}\n")
            except Exception:
                continue

        # If no candidate files found or read, search for symbols mentioned in the issue
        if not code_contexts:
            words = [w for w in issue_title.split() if len(w) > 4 and w.isalnum()]
            for word in words[:3]:
                matches = code_searcher.search_code(job_id, word, max_results=3)
                for m in matches:
                    try:
                        snippet = file_editor.read_file(job_id, m["file"], max_bytes=6000)
                        code_contexts.append(f"--- File: {m['file']} (Matched '{word}') ---\n{snippet}\n")
                    except Exception:
                        continue

        context_text = "\n".join(code_contexts) if code_contexts else "No direct matching code found in search."

        # 2. Formulate secure prompt with Gemini
        system_prompt = (
            "You are a Senior Root Cause Analysis Engineer. "
            "You are given an issue report and codebase context. "
            "Identify the root cause of the bug or requirement. "
            "Specify the exact culprit files, suspect functions, clear explanation, "
            "evidence from the codebase, and a concrete fix strategy. "
            "Be precise and objective. Adhere strictly to the requested schema."
        )

        untrusted_title = llm_service.wrap_untrusted(issue_title, tag="ISSUE_TITLE")
        untrusted_body = llm_service.wrap_untrusted(issue_body, tag="ISSUE_BODY")
        untrusted_code = llm_service.wrap_untrusted(context_text, tag="CODEBASE_CONTEXT")

        user_prompt = (
            f"Analyze this issue and codebase to determine the root cause:\n\n"
            f"Title: {untrusted_title}\n"
            f"Body:\n{untrusted_body}\n\n"
            f"Language & Framework: {repo_summary.get('language')}\n"
            f"Candidate Files: {candidate_files}\n\n"
            f"Codebase Context:\n{untrusted_code}\n"
        )

        analysis = llm_service.generate_structured(
            system_instruction=system_prompt,
            user_prompt=user_prompt,
            response_schema=RootCauseAnalysis,
        )

        # Validate that culprit files actually exist in the workspace
        from app.storage.workspace import workspace_manager
        job_dir = workspace_manager.get_job_dir(job_id)

        valid_culprits = []
        for cf in analysis.culprit_files:
            try:
                p = workspace_manager.validate_file_path(job_id, cf)
                if p.exists() and p.is_file():
                    valid_culprits.append(cf)
            except Exception:
                pass

        if not valid_culprits:
            # Fallback to candidate files that exist
            valid_culprits = [f for f in candidate_files if (job_dir / f).is_file()]

        if not valid_culprits:
            # Search workspace for actual code files
            all_files = workspace_manager.list_files(job_id)
            code_files = [f for f in all_files if f.endswith(('.py', '.ts', '.js', '.jsx', '.tsx', '.go', '.rs'))]
            valid_culprits = code_files[:2] if code_files else all_files[:1]

        if valid_culprits:
            analysis.culprit_files = valid_culprits

        return analysis


root_cause_agent = RootCauseAgent()


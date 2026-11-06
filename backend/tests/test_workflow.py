"""Unit tests for LangGraph state machine and conditional routing."""
import pytest
from app.workflows.graph import build_workflow, issue_resolution_graph
from app.workflows.state import AgentState


def test_workflow_compilation():
    """Verify that LangGraph workflow compiles without graph syntax errors."""
    compiled = build_workflow()
    assert compiled is not None


def test_workflow_unactionable_routing(tmp_path):
    """Test that an issue marked non-actionable routes directly to failure/stop."""
    from app.services.llm import IssueClassification, llm_service
    original_gen = llm_service.generate_structured

    # Mock Gemini to return non-actionable classification
    def mock_non_actionable(system_instruction, user_prompt, response_schema):
        if response_schema == IssueClassification:
            return IssueClassification(
                category="Bug",
                severity="Low",
                priority="P3",
                actionable=False,
                missing_info="No description or steps provided",
                summary="Vague issue",
            )
        return original_gen(system_instruction, user_prompt, response_schema)

    llm_service.generate_structured = mock_non_actionable

    state: AgentState = {
        "job_id": "test-unactionable-job",
        "repo_url": "https://github.com/octo/test-repo",
        "repo_owner": "octo",
        "repo_name": "test-repo",
        "issue_number": 99,
        "issue_title": "Fix it",
        "issue_body": "nothing works",
        "issue_labels": [],
        "issue_author": "testuser",
        "status": "QUEUED",
        "classification": None,
        "repo_summary": None,
        "root_cause": None,
        "patch_diff": "",
        "modified_files": [],
        "test_results": None,
        "fix_attempts": 0,
        "max_fix_attempts": 2,
        "previous_test_error": None,
        "human_approved": None,
        "pull_request": None,
        "completion_report": None,
        "error_message": None,
    }

    try:
        final_state = issue_resolution_graph.invoke(state)
        # Should stop cleanly in FAILED status with missing_info noted
        assert final_state["status"] == "FAILED"
        assert "No description" in (final_state.get("error_message") or "")
    finally:
        llm_service.generate_structured = original_gen


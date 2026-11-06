"""Workflow state definition for LangGraph orchestrator."""
from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """Unified state passed across all LangGraph nodes."""
    job_id: str
    repo_url: str
    repo_owner: str
    repo_name: str
    issue_number: int
    issue_title: str
    issue_body: str
    issue_labels: List[str]
    issue_author: str

    status: str  # QUEUED, ANALYZING, INVESTIGATING, FIXING, TESTING, WAITING_FOR_APPROVAL, CREATING_PR, COMPLETED, FAILED, REJECTED
    classification: Optional[Dict[str, Any]]
    repo_summary: Optional[Dict[str, Any]]
    root_cause: Optional[Dict[str, Any]]
    patch_diff: str
    modified_files: List[str]

    test_results: Optional[Dict[str, Any]]
    fix_attempts: int
    max_fix_attempts: int
    previous_test_error: Optional[str]

    human_approved: Optional[bool]  # None = pending, True = approved, False = rejected
    pull_request: Optional[Dict[str, Any]]
    completion_report: Optional[Dict[str, Any]]
    error_message: Optional[str]


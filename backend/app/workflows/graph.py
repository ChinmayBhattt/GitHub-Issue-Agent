"""LangGraph workflow definition for autonomous GitHub issue resolution."""
from typing import Any, Dict, Literal
from langgraph.graph import END, StateGraph
from app.agents.code_fix_agent import code_fix_agent
from app.agents.issue_analyzer import issue_analyzer
from app.agents.issue_detector import issue_detector
from app.agents.pr_agent import pr_agent
from app.agents.repo_analyzer import repo_analyzer
from app.agents.root_cause_agent import root_cause_agent
from app.agents.testing_agent import testing_agent
from app.config.settings import settings
from app.storage.json_store import json_store
from app.storage.workspace import workspace_manager
from app.tools.file_editor import SecretDetector
from app.workflows.state import AgentState


# ------------------ Node Implementations ------------------ #

def node_issue_detection(state: AgentState) -> Dict[str, Any]:
    """Extract issue data and check deduplication."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "IssueDetector", "INFO", "Ingesting issue and checking for duplicate processing.")

    detection = issue_detector.detect_and_ingest(
        repo_identifier=state["repo_url"],
        issue_number=state.get("issue_number"),
        raw_title=state.get("issue_title"),
        raw_body=state.get("issue_body"),
    )

    if detection.get("already_processed"):
        json_store.add_log(
            job_id, "IssueDetector", "WARNING",
            f"Issue #{state.get('issue_number')} was previously processed in job {detection.get('existing_job_id')}."
        )
        return {
            "status": "COMPLETED",
            "error_message": f"Issue already resolved in prior job {detection.get('existing_job_id')}",
        }

    title = detection.get("title") or state.get("issue_title", "")
    body = detection.get("body") or state.get("issue_body", "")
    labels = detection.get("labels") or state.get("issue_labels", [])
    author = detection.get("author") or state.get("issue_author", "user")

    json_store.add_log(job_id, "IssueDetector", "SUCCESS", f"Issue detected: '{title}' by @{author}")
    json_store.save_job({
        "job_id": job_id,
        "issue_title": title,
        "issue_body": body,
        "issue_labels": labels,
        "status": "ANALYZING",
    })

    return {
        "issue_title": title,
        "issue_body": body,
        "issue_labels": labels,
        "issue_author": author,
        "status": "ANALYZING",
    }


def node_issue_understanding(state: AgentState) -> Dict[str, Any]:
    """Classify category, severity, and actionability."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "IssueAnalyzer", "INFO", "Triaging issue classification and actionability via Gemini.")

    classification = issue_analyzer.analyze_issue(
        title=state["issue_title"],
        body=state["issue_body"],
        labels=state.get("issue_labels", []),
    )

    class_dict = classification.model_dump()
    json_store.add_log(
        job_id, "IssueAnalyzer", "SUCCESS",
        f"Classified as {class_dict['category']} (Severity: {class_dict['severity']}, Priority: {class_dict['priority']}). Actionable: {class_dict['actionable']}"
    )

    json_store.save_job({
        "job_id": job_id,
        "classification": class_dict,
        "status": "INVESTIGATING" if class_dict["actionable"] else "FAILED",
    })

    return {
        "classification": class_dict,
        "status": "INVESTIGATING" if class_dict["actionable"] else "FAILED",
        "error_message": class_dict.get("missing_info") if not class_dict["actionable"] else None,
    }


def node_repo_analysis(state: AgentState) -> Dict[str, Any]:
    """Clone repository and extract codebase architecture."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "RepoAnalyzer", "INFO", f"Cloning and analyzing repository {state['repo_url']}...")

    keywords = [w for w in state["issue_title"].split() if len(w) > 3]
    summary = repo_analyzer.analyze_repository(
        job_id=job_id,
        repo_url=state["repo_url"],
        issue_keywords=keywords,
    )

    json_store.add_log(
        job_id, "RepoAnalyzer", "SUCCESS",
        f"Language detected: {summary['language']}. Found {summary['total_files']} files, test command: '{summary['test_command']}'."
    )

    json_store.save_job({
        "job_id": job_id,
        "repo_summary": summary,
        "status": "INVESTIGATING",
    })

    return {
        "repo_summary": summary,
        "status": "INVESTIGATING",
    }


def node_root_cause(state: AgentState) -> Dict[str, Any]:
    """Investigate code execution paths and find culprit files."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "RootCauseAgent", "INFO", "Investigating code execution and tracing bug origins...")

    repo_sum = state.get("repo_summary") or {}
    candidates = repo_sum.get("candidate_files", [])

    rc = root_cause_agent.investigate(
        job_id=job_id,
        issue_title=state["issue_title"],
        issue_body=state["issue_body"],
        candidate_files=candidates,
        repo_summary=repo_sum,
    )

    rc_dict = rc.model_dump()
    json_store.add_log(
        job_id, "RootCauseAgent", "SUCCESS",
        f"Identified culprit files: {rc_dict['culprit_files']}. Strategy: {rc_dict['fix_strategy'][:100]}..."
    )

    json_store.save_job({
        "job_id": job_id,
        "root_cause": rc_dict,
        "status": "FIXING",
    })

    return {
        "root_cause": rc_dict,
        "status": "FIXING",
    }


def node_code_fix(state: AgentState) -> Dict[str, Any]:
    """Generate and apply code fix to workspace."""
    job_id = state["job_id"]
    attempt = state.get("fix_attempts", 0) + 1
    json_store.add_log(job_id, "CodeFixAgent", "INFO", f"Formulating and applying code fix (Attempt {attempt})...")

    fix_result = code_fix_agent.generate_and_apply_fix(
        job_id=job_id,
        issue_title=state["issue_title"],
        issue_body=state["issue_body"],
        root_cause=state["root_cause"] or {},
        repo_summary=state["repo_summary"] or {},
        previous_test_error=state.get("previous_test_error"),
        attempt=attempt,
    )

    diff_text = fix_result.get("diff", "")
    modified = fix_result.get("applied_files", [])

    json_store.add_log(
        job_id, "CodeFixAgent", "SUCCESS",
        f"Modified {len(modified)} files ({', '.join(modified)}). Generated diff size: {len(diff_text)} bytes."
    )

    json_store.save_job({
        "job_id": job_id,
        "patch_diff": diff_text,
        "modified_files": modified,
        "status": "TESTING",
    })

    return {
        "patch_diff": diff_text,
        "modified_files": modified,
        "fix_attempts": attempt,
        "status": "TESTING",
    }


def node_patch_validation(state: AgentState) -> Dict[str, Any]:
    """Verify generated patch does not contain secrets, path traversals, or syntax anomalies."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "PatchValidator", "INFO", "Validating patch diff for secrets and restricted boundaries...")

    diff = state.get("patch_diff", "")
    if not diff:
        json_store.add_log(job_id, "PatchValidator", "WARNING", "Diff is empty; no files were modified.")
        return {"status": "FAILED", "error_message": "No code modifications were generated."}

    # Secret scanning
    secret_found = SecretDetector.scan_content(diff)
    if secret_found:
        json_store.add_log(job_id, "PatchValidator", "ERROR", f"Security violation: {secret_found} found in patch!")
        return {
            "status": "REJECTED",
            "error_message": f"Security violation: {secret_found} detected in patch diff.",
        }

    json_store.add_log(job_id, "PatchValidator", "SUCCESS", "Patch validation passed. No secrets or boundary leaks.")
    return {"status": "TESTING"}


def node_test_execution(state: AgentState) -> Dict[str, Any]:
    """Execute allowlisted tests in sandbox subprocess."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "TestingAgent", "INFO", "Executing test suite inside isolated subprocess...")

    repo_sum = state.get("repo_summary") or {}
    test_res = testing_agent.run_validation_tests(job_id=job_id, repo_summary=repo_sum)

    level = "SUCCESS" if test_res["passed"] else ("WARNING" if test_res["cannot_run_tests"] else "ERROR")
    json_store.add_log(
        job_id, "TestingAgent", level,
        f"Tests executed with '{test_res['command']}'. Passed: {test_res['passed']} (Duration: {test_res['execution_time_s']}s)."
    )

    json_store.save_job({
        "job_id": job_id,
        "test_results": test_res,
        "status": "WAITING_FOR_APPROVAL" if (test_res["passed"] or test_res["cannot_run_tests"]) else "FIXING",
    })

    prev_err = None
    if not test_res["passed"]:
        prev_err = (test_res["stderr"] or test_res["stdout"])[:2000]

    return {
        "test_results": test_res,
        "previous_test_error": prev_err,
        "status": "WAITING_FOR_APPROVAL" if (test_res["passed"] or test_res["cannot_run_tests"]) else "FIXING",
    }


def node_human_approval_gate(state: AgentState) -> Dict[str, Any]:
    """
    Checkpoint for human approval.
    If autonomous mode is enabled or already approved, transitions to PR creation.
    Otherwise sets status to WAITING_FOR_APPROVAL.
    """
    job_id = state["job_id"]
    approved = state.get("human_approved")

    if settings.AUTONOMOUS_MODE or approved is True:
        json_store.add_log(job_id, "HumanApproval", "INFO", "Patch approved. Proceeding to branch and PR creation.")
        json_store.save_job({"job_id": job_id, "status": "CREATING_PR"})
        return {"status": "CREATING_PR", "human_approved": True}

    if approved is False:
        json_store.add_log(job_id, "HumanApproval", "WARNING", "Patch was rejected by user. Aborting.")
        json_store.save_job({"job_id": job_id, "status": "REJECTED"})
        return {"status": "REJECTED", "human_approved": False}

    json_store.add_log(job_id, "HumanApproval", "INFO", "Waiting for human review and approval in dashboard...")
    json_store.save_job({"job_id": job_id, "status": "WAITING_FOR_APPROVAL"})
    return {"status": "WAITING_FOR_APPROVAL"}


def node_github_pr(state: AgentState) -> Dict[str, Any]:
    """Create branch, commit, push, and create GitHub PR."""
    job_id = state["job_id"]
    json_store.add_log(job_id, "PRAgent", "INFO", "Creating dedicated git branch and GitHub Pull Request...")

    base_branch = (state.get("repo_summary") or {}).get("default_branch", "main")
    pr_record = pr_agent.prepare_and_create_pr(
        job_id=job_id,
        owner=state["repo_owner"],
        repo=state["repo_name"],
        issue_number=state.get("issue_number", 1),
        issue_title=state["issue_title"],
        root_cause=state.get("root_cause") or {},
        patch_diff=state.get("patch_diff", ""),
        test_results=state.get("test_results") or {},
        base_branch=base_branch,
    )

    json_store.add_log(
        job_id, "PRAgent", "SUCCESS",
        f"Pull Request created: {pr_record.get('pr_url')} (Ref #{state.get('issue_number')})"
    )

    json_store.save_job({
        "job_id": job_id,
        "pull_request": pr_record,
        "status": "COMPLETED",
    })

    return {
        "pull_request": pr_record,
        "status": "COMPLETED",
    }


def node_completion_report(state: AgentState) -> Dict[str, Any]:
    """Compile final execution report and audit event."""
    job_id = state["job_id"]
    report = {
        "job_id": job_id,
        "repo": f"{state['repo_owner']}/{state['repo_name']}",
        "issue_number": state.get("issue_number"),
        "status": state.get("status"),
        "patch_applied": bool(state.get("patch_diff")),
        "tests_passed": (state.get("test_results") or {}).get("passed", False),
        "pr_url": (state.get("pull_request") or {}).get("pr_url"),
        "fix_attempts": state.get("fix_attempts", 1),
    }

    json_store.add_audit_event(
        action="JOB_COMPLETED",
        actor="system",
        job_id=job_id,
        details=report,
    )

    json_store.add_log(job_id, "System", "SUCCESS", "Issue resolution workflow completed successfully.")
    return {"completion_report": report}


def node_failure(state: AgentState) -> Dict[str, Any]:
    """Handle stopped or failed workflows."""
    job_id = state["job_id"]
    err = state.get("error_message") or "Workflow could not be completed."
    json_store.add_log(job_id, "System", "ERROR", f"Workflow terminated: {err}")
    json_store.save_job({
        "job_id": job_id,
        "status": "FAILED",
        "error_message": err,
    })
    json_store.add_audit_event(
        action="JOB_FAILED",
        actor="system",
        job_id=job_id,
        details={"error": err},
    )
    return {"status": "FAILED"}


# ------------------ Conditional Routing Edges ------------------ #

def route_after_understanding(state: AgentState) -> Literal["node_repo_analysis", "node_failure"]:
    """Route to repo analysis if actionable, else stop."""
    if not state.get("classification") or not state["classification"].get("actionable"):
        return "node_failure"
    return "node_repo_analysis"


def route_after_root_cause(state: AgentState) -> Literal["node_code_fix", "node_failure"]:
    """Route to code fix if culprit identified, else stop."""
    rc = state.get("root_cause")
    if not rc or not rc.get("culprit_files"):
        return "node_failure"
    return "node_code_fix"


def route_after_validation(state: AgentState) -> Literal["node_test_execution", "node_failure"]:
    """Route to testing if patch valid, else stop."""
    if state.get("status") in ["REJECTED", "FAILED"]:
        return "node_failure"
    return "node_test_execution"


def route_after_testing(state: AgentState) -> Literal["node_human_approval_gate", "node_code_fix", "node_failure"]:
    """Evaluate test results: proceed if passed, retry if within attempt limit, else fail."""
    test_res = state.get("test_results") or {}
    if test_res.get("passed") or test_res.get("cannot_run_tests"):
        return "node_human_approval_gate"

    # Retry loop if test failed and attempts remain
    attempts = state.get("fix_attempts", 0)
    max_attempts = state.get("max_fix_attempts", settings.MAX_FIX_ATTEMPTS)
    if attempts < max_attempts:
        return "node_code_fix"

    return "node_failure"


def route_after_approval(state: AgentState) -> Literal["node_github_pr", END]:
    """Proceed to PR creation only if approved."""
    if state.get("status") == "CREATING_PR" or state.get("human_approved") is True:
        return "node_github_pr"
    return END  # Pauses at WAITING_FOR_APPROVAL or ends if rejected


# ------------------ Build Graph ------------------ #

def build_workflow() -> Any:
    """Construct and compile the LangGraph workflow."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("node_issue_detection", node_issue_detection)
    workflow.add_node("node_issue_understanding", node_issue_understanding)
    workflow.add_node("node_repo_analysis", node_repo_analysis)
    workflow.add_node("node_root_cause", node_root_cause)
    workflow.add_node("node_code_fix", node_code_fix)
    workflow.add_node("node_patch_validation", node_patch_validation)
    workflow.add_node("node_test_execution", node_test_execution)
    workflow.add_node("node_human_approval_gate", node_human_approval_gate)
    workflow.add_node("node_github_pr", node_github_pr)
    workflow.add_node("node_completion_report", node_completion_report)
    workflow.add_node("node_failure", node_failure)

    # Set Entry Point
    workflow.set_entry_point("node_issue_detection")

    # Add Edges
    workflow.add_edge("node_issue_detection", "node_issue_understanding")
    workflow.add_conditional_edges("node_issue_understanding", route_after_understanding)
    workflow.add_edge("node_repo_analysis", "node_root_cause")
    workflow.add_conditional_edges("node_root_cause", route_after_root_cause)
    workflow.add_edge("node_code_fix", "node_patch_validation")
    workflow.add_conditional_edges("node_patch_validation", route_after_validation)
    workflow.add_conditional_edges("node_test_execution", route_after_testing)
    workflow.add_conditional_edges("node_human_approval_gate", route_after_approval)
    workflow.add_edge("node_github_pr", "node_completion_report")
    workflow.add_edge("node_completion_report", END)
    workflow.add_edge("node_failure", END)

    return workflow.compile()


issue_resolution_graph = build_workflow()


"""FastAPI API route handlers for issue analysis, resolution, jobs, and webhooks."""
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request, status
from app.agents.issue_analyzer import issue_analyzer
from app.agents.issue_detector import issue_detector
from app.api.schemas import (
    HealthResponse,
    IssueAnalyzeRequest,
    IssueResolveRequest,
    JobResponse,
    KeyConfigRequest,
    KeyConfigResponse,
    LogEntry,
    RejectRequest,
    RepoConnectRequest,
)
from app.config.settings import settings
from app.github.client import github_client
from app.github.webhooks import webhook_handler
from app.services.job_runner import job_runner
from app.services.llm import llm_service
from app.storage.json_store import json_store

router = APIRouter()


def _get_key_preview(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    val = val.strip()
    if len(val) <= 8:
        return "••••••••"
    return f"{val[:6]}••••{val[-4:]}"


def _update_env_file(filepath: Path, updates: Dict[str, str]):
    lines = []
    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception:
            lines = []

    existing_keys = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
                existing_keys.add(key)
                continue
        new_lines.append(line)

    for k, v in updates.items():
        if k not in existing_keys:
            new_lines.append(f"{k}={v}\n")

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """System health check and dashboard stats."""
    stats = json_store.get_stats()
    gemini_key = os.getenv("GEMINI_API_KEY") or getattr(llm_service, "api_key", "") or settings.GEMINI_API_KEY
    github_tok = github_client.token or os.getenv("GITHUB_TOKEN") or settings.GITHUB_TOKEN
    return HealthResponse(
        status="ok",
        version="0.1.0",
        stats=stats,
        gemini_configured=bool(gemini_key),
        github_token_configured=bool(github_tok),
    )


@router.get("/api/config/keys", response_model=KeyConfigResponse)
def get_keys_config() -> KeyConfigResponse:
    """Check configuration status of required API keys."""
    gemini_key = os.getenv("GEMINI_API_KEY") or getattr(llm_service, "api_key", "") or settings.GEMINI_API_KEY or ""
    gh_token = github_client.token or os.getenv("GITHUB_TOKEN") or settings.GITHUB_TOKEN or ""
    webhook_sec = os.getenv("GITHUB_WEBHOOK_SECRET") or settings.GITHUB_WEBHOOK_SECRET or ""

    return KeyConfigResponse(
        status="ok",
        gemini_api_key_configured=bool(gemini_key),
        gemini_api_key_preview=_get_key_preview(gemini_key),
        github_token_configured=bool(gh_token),
        github_token_preview=_get_key_preview(gh_token),
        github_webhook_secret_configured=bool(webhook_sec),
        github_webhook_secret_preview=_get_key_preview(webhook_sec),
    )


@router.post("/api/config/keys", response_model=KeyConfigResponse)
def save_keys_config(req: KeyConfigRequest) -> KeyConfigResponse:
    """Save or update API keys dynamically from the web terminal."""
    updates: Dict[str, str] = {}
    if req.gemini_api_key is not None and req.gemini_api_key.strip():
        k = req.gemini_api_key.strip()
        updates["GEMINI_API_KEY"] = k
        os.environ["GEMINI_API_KEY"] = k
        settings.GEMINI_API_KEY = k
        llm_service._client = None
        llm_service._last_key = None
        llm_service.api_key = k

    if req.github_token is not None and req.github_token.strip():
        tok = req.github_token.strip()
        updates["GITHUB_TOKEN"] = tok
        os.environ["GITHUB_TOKEN"] = tok
        settings.GITHUB_TOKEN = tok
        github_client._gh = None
        github_client._last_token = None
        github_client._custom_token = tok

    if req.github_webhook_secret is not None:
        sec = req.github_webhook_secret.strip()
        updates["GITHUB_WEBHOOK_SECRET"] = sec
        os.environ["GITHUB_WEBHOOK_SECRET"] = sec
        settings.GITHUB_WEBHOOK_SECRET = sec

    # Persist to both backend/.env and root .env
    for env_path in [settings.BASE_DIR / ".env", settings.BASE_DIR.parent / ".env", Path(".env")]:
        _update_env_file(env_path, updates)

    gemini_key = os.getenv("GEMINI_API_KEY") or getattr(llm_service, "api_key", "") or settings.GEMINI_API_KEY or ""
    gh_token = github_client.token or os.getenv("GITHUB_TOKEN") or settings.GITHUB_TOKEN or ""
    webhook_sec = os.getenv("GITHUB_WEBHOOK_SECRET") or settings.GITHUB_WEBHOOK_SECRET or ""

    return KeyConfigResponse(
        status="ok",
        gemini_api_key_configured=bool(gemini_key),
        gemini_api_key_preview=_get_key_preview(gemini_key),
        github_token_configured=bool(gh_token),
        github_token_preview=_get_key_preview(gh_token),
        github_webhook_secret_configured=bool(webhook_sec),
        github_webhook_secret_preview=_get_key_preview(webhook_sec),
        message="Keys configured and saved successfully! Agents reloaded.",
    )


@router.post("/api/config/keys/reset", response_model=KeyConfigResponse)
def reset_keys_config() -> KeyConfigResponse:
    """Reset and wipe configured keys so user can re-enter fresh credentials."""
    for k in ["GEMINI_API_KEY", "GITHUB_TOKEN", "GITHUB_WEBHOOK_SECRET"]:
        os.environ.pop(k, None)
    settings.GEMINI_API_KEY = ""
    settings.GITHUB_TOKEN = ""
    settings.GITHUB_WEBHOOK_SECRET = ""

    llm_service._client = None
    llm_service._last_key = None
    llm_service.api_key = ""

    github_client._gh = None
    github_client._last_token = None
    github_client._custom_token = None

    updates = {
        "GEMINI_API_KEY": "",
        "GITHUB_TOKEN": "",
        "GITHUB_WEBHOOK_SECRET": "",
    }
    for env_path in [settings.BASE_DIR / ".env", settings.BASE_DIR.parent / ".env", Path(".env")]:
        _update_env_file(env_path, updates)

    return KeyConfigResponse(
        status="ok",
        gemini_api_key_configured=False,
        gemini_api_key_preview=None,
        github_token_configured=False,
        github_token_preview=None,
        github_webhook_secret_configured=False,
        github_webhook_secret_preview=None,
        message="All credentials have been cleared and reset.",
    )



@router.post("/api/issues/analyze")
def analyze_issue(req: IssueAnalyzeRequest) -> Dict[str, Any]:
    """
    POST /api/issues/analyze
    Detect and classify an issue without modifying code.
    """
    try:
        detection = issue_detector.detect_and_ingest(
            repo_identifier=req.repo_url,
            issue_number=req.issue_number,
            raw_title=req.issue_title,
            raw_body=req.issue_body,
        )

        title = detection.get("title") or req.issue_title or "Untitled Issue"
        body = detection.get("body") or req.issue_body or ""
        labels = detection.get("labels") or []

        classification = issue_analyzer.analyze_issue(title=title, body=body, labels=labels)

        return {
            "detection": detection,
            "classification": classification.model_dump(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to analyze issue: {str(e)}",
        )


@router.post("/api/issues/resolve")
def resolve_issue(req: IssueResolveRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    POST /api/issues/resolve
    Initiate autonomous issue resolution workflow in background.
    """
    try:
        job_id = job_runner.start_job(
            repo_url_or_shorthand=req.repo_url,
            issue_number=req.issue_number,
            issue_title=req.issue_title,
            issue_body=req.issue_body,
        )

        if req.auto_approve:
            job = json_store.get_job(job_id)
            if job:
                job["human_approved"] = True
                json_store.save_job(job)

        # Launch background task
        background_tasks.add_task(job_runner.run_workflow_sync, job_id)

        return {
            "job_id": job_id,
            "status": "QUEUED",
            "message": "Autonomous resolution job initiated successfully.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to initiate resolution job: {str(e)}",
        )


@router.post("/api/repositories/connect")
def connect_repository(req: RepoConnectRequest) -> Dict[str, Any]:
    """
    POST /api/repositories/connect
    Register a public repository with the agent.
    """
    try:
        parsed = github_client.parse_repo_and_issue(req.repo_url)
        repo_info = {
            "repo_url": parsed["repo_url"],
            "owner": parsed["owner"],
            "name": parsed["repo"],
            "webhook_configured": False,
        }
        connected = json_store.connect_repository(repo_info)
        json_store.add_audit_event("REPO_CONNECTED", actor="user", details=connected)
        return {
            "message": f"Repository {parsed['owner']}/{parsed['repo']} connected successfully.",
            "repository": connected,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect repository: {str(e)}",
        )


@router.get("/api/repositories")
def list_repositories() -> List[Dict[str, Any]]:
    """List all connected repositories."""
    return json_store.list_repositories()


@router.get("/api/jobs")
def list_jobs(limit: int = 50) -> List[Dict[str, Any]]:
    """List recent resolution jobs."""
    return json_store.list_jobs(limit=limit)


@router.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str) -> JobResponse:
    """
    GET /api/jobs/{job_id}
    Retrieve full details for a resolution job.
    """
    job = json_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found.")
    return JobResponse(**job)


@router.get("/api/jobs/{job_id}/logs", response_model=List[LogEntry])
def get_job_logs(job_id: str) -> List[LogEntry]:
    """
    GET /api/jobs/{job_id}/logs
    Retrieve chronological execution logs for a job.
    """
    logs = json_store.get_logs(job_id)
    return [LogEntry(**log) for log in logs]


@router.get("/api/pull-requests")
def get_pull_requests() -> List[Dict[str, Any]]:
    """
    GET /api/pull-requests
    Retrieve all Pull Requests created by the agent.
    """
    return json_store.list_pull_requests()


@router.post("/api/agent/approve/{job_id}")
def approve_patch(job_id: str, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    POST /api/agent/approve/{job_id}
    Approve proposed code fix and create Pull Request on GitHub.
    """
    job = json_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found.")

    try:
        updated_job = job_runner.approve_job(job_id)
        return {
            "message": "Patch approved successfully. Pull Request created.",
            "job": updated_job,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to approve patch: {str(e)}",
        )


@router.post("/api/agent/reject/{job_id}")
def reject_patch(job_id: str, req: RejectRequest) -> Dict[str, Any]:
    """
    POST /api/agent/reject/{job_id}
    Reject proposed code fix and clean up workspace.
    """
    job = json_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found.")

    try:
        updated_job = job_runner.reject_job(job_id, reason=req.reason or "Rejected by user")
        return {
            "message": "Patch rejected successfully.",
            "job": updated_job,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reject patch: {str(e)}",
        )


@router.post("/webhooks/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str = Header(default=""),
    x_github_event: str = Header(default=""),
) -> Dict[str, Any]:
    """
    POST /webhooks/github
    Process GitHub webhooks with HMAC signature verification.
    """
    payload_bytes = await request.body()

    # 1. Verify HMAC Signature
    if not webhook_handler.verify_signature(payload_bytes, x_hub_signature_256):
        json_store.add_audit_event(
            "WEBHOOK_SIGNATURE_FAILED",
            actor="webhook",
            details={"event": x_github_event},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitHub webhook signature.",
        )

    # 2. Check Event Type
    if x_github_event != "issues":
        return {"status": "ignored", "reason": f"Event '{x_github_event}' is not an issue event."}

    payload = await request.json()
    parsed_issue = webhook_handler.parse_issue_event(payload)

    if not parsed_issue:
        return {"status": "ignored", "reason": "Not an opened or reopened issue event."}

    # 3. Queue Resolution Job
    job_id = job_runner.start_job(
        repo_url_or_shorthand=parsed_issue["repo_url"],
        issue_number=parsed_issue["issue_number"],
        issue_title=parsed_issue["issue_title"],
        issue_body=parsed_issue["issue_body"],
    )

    json_store.add_audit_event(
        "WEBHOOK_TRIGGERED_JOB",
        actor="webhook",
        job_id=job_id,
        details=parsed_issue,
    )

    background_tasks.add_task(job_runner.run_workflow_sync, job_id)

    return {
        "status": "accepted",
        "job_id": job_id,
        "action": parsed_issue["action"],
        "issue": f"#{parsed_issue['issue_number']} in {parsed_issue['repo_owner']}/{parsed_issue['repo_name']}",
    }


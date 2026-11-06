"""Pydantic schemas for FastAPI API requests and responses."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IssueAnalyzeRequest(BaseModel):
    repo_url: str = Field(description="GitHub repository URL, owner/repo, or issue URL")
    issue_number: Optional[int] = Field(default=None, description="Issue number if known")
    issue_title: Optional[str] = Field(default=None, description="Title if manually submitted")
    issue_body: Optional[str] = Field(default=None, description="Body if manually submitted")


class IssueResolveRequest(BaseModel):
    repo_url: str = Field(description="GitHub repository URL, owner/repo, or issue URL")
    issue_number: Optional[int] = Field(default=None, description="Issue number")
    issue_title: Optional[str] = Field(default=None, description="Issue title")
    issue_body: Optional[str] = Field(default=None, description="Issue body")
    auto_approve: Optional[bool] = Field(default=False, description="Whether to bypass human approval gate")


class RepoConnectRequest(BaseModel):
    repo_url: str = Field(description="GitHub repository URL or owner/repo")


class RejectRequest(BaseModel):
    reason: Optional[str] = Field(default="Rejected by user", description="Reason for rejection")


class JobResponse(BaseModel):
    job_id: str
    status: str
    repo_url: str
    repo_owner: str
    repo_name: str
    issue_number: Optional[int] = None
    issue_title: Optional[str] = None
    issue_body: Optional[str] = None
    issue_labels: List[str] = []
    classification: Optional[Dict[str, Any]] = None
    repo_summary: Optional[Dict[str, Any]] = None
    root_cause: Optional[Dict[str, Any]] = None
    patch_diff: Optional[str] = None
    modified_files: List[str] = []
    test_results: Optional[Dict[str, Any]] = None
    pull_request: Optional[Dict[str, Any]] = None
    human_approved: Optional[bool] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class LogEntry(BaseModel):
    timestamp: str
    agent: str
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    stats: Dict[str, int]
    gemini_configured: bool
    github_token_configured: bool


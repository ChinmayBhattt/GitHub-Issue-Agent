/**
 * Frontend API client communicating with FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DashboardStats {
  total_issues_processed: number;
  under_investigation: number;
  successful_fixes: number;
  failed_executions: number;
  pull_requests_created: number;
}

export interface HealthData {
  status: string;
  version: string;
  stats: DashboardStats;
  gemini_configured: boolean;
  github_token_configured: boolean;
}

export interface KeyConfigData {
  status: string;
  gemini_api_key_configured: boolean;
  gemini_api_key_preview?: string;
  github_token_configured: boolean;
  github_token_preview?: string;
  github_webhook_secret_configured: boolean;
  github_webhook_secret_preview?: string;
  message?: string;
}

export interface Job {
  job_id: string;
  status: "QUEUED" | "ANALYZING" | "INVESTIGATING" | "FIXING" | "TESTING" | "WAITING_FOR_APPROVAL" | "CREATING_PR" | "COMPLETED" | "FAILED" | "REJECTED";
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  issue_number?: number;
  issue_title?: string;
  issue_body?: string;
  issue_labels?: string[];
  classification?: {
    category: string;
    severity: string;
    priority: string;
    actionable: boolean;
    missing_info?: string;
    summary: string;
  };
  repo_summary?: {
    language: string;
    test_command: string;
    total_files: number;
    test_files: string[];
    candidate_files: string[];
    default_branch: string;
  };
  root_cause?: {
    culprit_files: string[];
    suspect_functions: string[];
    explanation: string;
    evidence: string;
    fix_strategy: string;
  };
  patch_diff?: string;
  modified_files?: string[];
  test_results?: {
    passed: boolean;
    command: string;
    returncode: number;
    stdout: string;
    stderr: string;
    execution_time_s: number;
    cannot_run_tests?: boolean;
    limitation_disclosure?: string;
  };
  pull_request?: {
    pr_url: string;
    pr_number: number;
    title: string;
    head_branch: string;
    base_branch: string;
    simulated?: boolean;
  };
  human_approved?: boolean;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LogEntry {
  timestamp: string;
  agent: string;
  level: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  message: string;
  details?: Record<string, any>;
}

export interface PullRequest {
  job_id: string;
  pr_url: string;
  pr_number: number;
  title: string;
  owner: string;
  repo: string;
  issue_number: number;
  head_branch: string;
  base_branch: string;
  recorded_at: string;
  simulated?: boolean;
}

export interface ConnectedRepo {
  repo_url: string;
  owner: string;
  name: string;
  connected_at: string;
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (err?.message === "Load failed" || err?.name === "TypeError") {
      throw new Error("Backend server (port 8000) was unreachable. Please verify uvicorn is running.");
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `Status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthData> {
    const res = await safeFetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthData>(res);
  },

  async getJobs(): Promise<Job[]> {
    const res = await safeFetch(`${API_BASE_URL}/api/jobs`);
    return handleResponse<Job[]>(res);
  },

  async getJob(jobId: string): Promise<Job> {
    const res = await safeFetch(`${API_BASE_URL}/api/jobs/${jobId}`);
    return handleResponse<Job>(res);
  },

  async getJobLogs(jobId: string): Promise<LogEntry[]> {
    const res = await safeFetch(`${API_BASE_URL}/api/jobs/${jobId}/logs`);
    return handleResponse<LogEntry[]>(res);
  },

  async getPullRequests(): Promise<PullRequest[]> {
    const res = await safeFetch(`${API_BASE_URL}/api/pull-requests`);
    return handleResponse<PullRequest[]>(res);
  },

  async getRepositories(): Promise<ConnectedRepo[]> {
    const res = await safeFetch(`${API_BASE_URL}/api/repositories`);
    return handleResponse<ConnectedRepo[]>(res);
  },

  async connectRepository(repoUrl: string): Promise<{ message: string; repository: ConnectedRepo }> {
    const res = await safeFetch(`${API_BASE_URL}/api/repositories/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl }),
    });
    return handleResponse(res);
  },

  async analyzeIssue(data: { repo_url: string; issue_number?: number; issue_title?: string; issue_body?: string }): Promise<any> {
    const res = await safeFetch(`${API_BASE_URL}/api/issues/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async resolveIssue(data: { repo_url: string; issue_number?: number; issue_title?: string; issue_body?: string; auto_approve?: boolean }): Promise<{ job_id: string; status: string; message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/api/issues/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async approveJob(jobId: string): Promise<{ message: string; job: Job }> {
    const res = await safeFetch(`${API_BASE_URL}/api/agent/approve/${jobId}`, {
      method: "POST",
    });
    return handleResponse(res);
  },

  async rejectJob(jobId: string, reason?: string): Promise<{ message: string; job: Job }> {
    const res = await safeFetch(`${API_BASE_URL}/api/agent/reject/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || "Rejected by user" }),
    });
    return handleResponse(res);
  },

  async getKeysConfig(): Promise<KeyConfigData> {
    const res = await safeFetch(`${API_BASE_URL}/api/config/keys`);
    return handleResponse<KeyConfigData>(res);
  },

  async saveKeysConfig(data: {
    gemini_api_key?: string;
    github_token?: string;
    github_webhook_secret?: string;
  }): Promise<KeyConfigData> {
    const res = await safeFetch(`${API_BASE_URL}/api/config/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<KeyConfigData>(res);
  },

  async resetKeysConfig(): Promise<KeyConfigData> {
    const res = await safeFetch(`${API_BASE_URL}/api/config/keys/reset`, {
      method: "POST",
    });
    return handleResponse<KeyConfigData>(res);
  },
};


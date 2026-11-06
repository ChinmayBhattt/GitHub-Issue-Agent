"use client";
import React, { useState } from "react";
import { CheckCircle2, ExternalLink, GitPullRequest, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { api, Job } from "../services/api";

interface ApprovalBannerProps {
  job: Job;
  onUpdate: () => void;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({ job, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (job.status === "COMPLETED" && job.pull_request) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-beige shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif text-base font-medium text-charcoal">
              Pull Request Created on GitHub
            </h4>
            <p className="text-xs text-charcoal-secondary font-sans">
              PR #{job.pull_request.pr_number}: {job.pull_request.title}
            </p>
            <p className="text-[11px] text-charcoal-muted font-sans pt-1">
              🛡️ Policy Notice: This Pull Request requires human review on GitHub and will never be automatically merged into main.
            </p>
          </div>
        </div>

        <a
          href={job.pull_request.pr_url}
          target="_blank"
          rel="noreferrer"
          className="btn-metallic px-4 py-2 rounded-xl text-xs font-sans font-medium flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>View on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-cream" />
        </a>
      </div>
    );
  }

  if (job.status === "REJECTED") {
    return (
      <div className="p-4 rounded-xl bg-rust-light border border-rust-border flex items-center space-x-3 text-rust text-xs font-sans">
        <XCircle className="w-5 h-5 text-rust flex-shrink-0" />
        <div>
          <span className="font-medium">Patch Rejected: </span>
          <span>{job.error_message || "Rejected by human reviewer."}</span>
        </div>
      </div>
    );
  }

  if (job.status !== "WAITING_FOR_APPROVAL") {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.approveJob(job.job_id);
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to approve job.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Optional reason for rejecting patch:") || "Rejected by user";
    setLoading(true);
    setError(null);
    try {
      await api.rejectJob(job.job_id, reason);
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to reject job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-cream-soft border border-beige-strong shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-white text-charcoal border border-beige flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-charcoal" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-charcoal">
              Human Review & Approval Required
            </h3>
            <p className="text-xs text-charcoal-secondary font-sans leading-relaxed mt-1 max-w-2xl">
              The agent has investigated root causes, modified code in the isolated workspace, and verified all tests. Inspect the unified diff and test outputs below before granting approval to open the GitHub Pull Request.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-rust-border hover:bg-rust-light text-rust text-xs font-sans font-medium transition cursor-pointer"
          >
            Reject Patch
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn-metallic px-5 py-2 rounded-xl text-xs font-sans font-medium flex items-center space-x-1.5 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Approve & Open PR</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rust-light border border-rust-border text-xs text-rust">
          {error}
        </div>
      )}
    </div>
  );
};

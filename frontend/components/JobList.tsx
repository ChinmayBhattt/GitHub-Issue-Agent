import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, GitPullRequest, Search, Sparkles, XCircle } from "lucide-react";
import { Job } from "../services/api";

interface JobListProps {
  jobs: Job[];
  onSelectJob?: (jobId: string) => void;
}

export const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob }) => {
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-light text-sage border border-sage-border">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "WAITING_FOR_APPROVAL":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-ochre-light text-ochre border border-ochre-border">
            <Clock className="w-3 h-3" />
            <span>Awaiting Review</span>
          </span>
        );
      case "ANALYZING":
      case "INVESTIGATING":
      case "FIXING":
      case "TESTING":
      case "CREATING_PR":
      case "QUEUED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-terracotta-light text-terracotta border border-terracotta-border">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>{status.replace(/_/g, " ")}</span>
          </span>
        );
      case "FAILED":
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rust-light text-rust border border-rust-border">
            <XCircle className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filtered = jobs.filter((job) => {
    if (filter !== "ALL" && job.status !== filter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchRepo = `${job.repo_owner}/${job.repo_name}`.toLowerCase().includes(q);
      const matchTitle = (job.issue_title || "").toLowerCase().includes(q);
      const matchId = job.job_id.toLowerCase().includes(q);
      return matchRepo || matchTitle || matchId;
    }
    return true;
  });

  return (
    <div className="bg-white border border-beige rounded-xl overflow-hidden shadow-subtle">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-beige flex flex-col sm:flex-row gap-3 items-center justify-between bg-cream-soft/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by repository or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-white border border-beige text-xs text-charcoal placeholder-charcoal-light focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/20 transition-all"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "WAITING_FOR_APPROVAL", "COMPLETED", "FAILED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                filter === tab
                  ? "bg-charcoal text-white shadow-subtle"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-cream-soft border border-transparent"
              }`}
            >
              {tab.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="divide-y divide-beige-subtle">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm font-serif italic text-charcoal-muted">
            No resolution jobs match the current filter.
          </div>
        ) : (
          filtered.map((job) => (
            <div
              key={job.job_id}
              className="p-4 sm:p-5 hover:bg-cream-soft/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-medium text-charcoal tracking-tight">
                    {job.repo_owner}/{job.repo_name}
                  </span>
                  {job.issue_number && (
                    <span className="text-xs font-mono font-medium text-charcoal-muted">
                      #{job.issue_number}
                    </span>
                  )}
                  {getStatusBadge(job.status)}
                  {job.classification?.category && (
                    <span className="text-[11px] font-sans px-2 py-0.5 rounded-md bg-cream-soft text-charcoal-muted border border-beige">
                      {job.classification.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-charcoal-secondary font-sans line-clamp-1">
                  {job.issue_title || "No title provided"}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-charcoal-muted pt-0.5">
                  <span>ID: <code className="font-mono text-charcoal-secondary">{job.job_id}</code></span>
                  {job.pull_request?.pr_url && (
                    <a
                      href={job.pull_request.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-terracotta hover:text-terracotta-hover font-medium flex items-center space-x-1"
                    >
                      <GitPullRequest className="w-3 h-3" />
                      <span>PR #{job.pull_request.pr_number}</span>
                    </a>
                  )}
                  {job.updated_at && (
                    <span className="text-charcoal-light">
                      {new Date(job.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <Link
                  href={`/jobs/${job.job_id}`}
                  className="px-3.5 py-1.5 rounded-lg border border-beige hover:border-charcoal-secondary bg-white hover:bg-cream-soft text-xs font-sans font-medium text-charcoal transition-all flex items-center space-x-1.5 shadow-subtle cursor-pointer"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DiffViewer } from "@/components/DiffViewer";
import { ExecutionLogs } from "@/components/ExecutionLogs";
import { TestResultsView } from "@/components/TestResultsView";
import { ApprovalBanner } from "@/components/ApprovalBanner";
import { api, Job, LogEntry } from "@/services/api";
import {
  ArrowLeft,
  ExternalLink,
  FileCode2,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Sparkles,
  Terminal,
  TestTube2,
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"diff" | "tests" | "logs">("diff");

  const loadJob = async () => {
    if (!jobId) return;
    try {
      const [jobData, logsData] = await Promise.all([
        api.getJob(jobId),
        api.getJobLogs(jobId),
      ]);
      setJob(jobData);
      setLogs(logsData);
    } catch {
      // Ignore poll errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
    const interval = setInterval(() => {
      if (!job || !["COMPLETED", "REJECTED"].includes(job.status)) {
        loadJob();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  if (loading && !job) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto p-12 text-center space-y-4">
          <h2 className="font-serif text-2xl font-medium text-charcoal">Job Not Found</h2>
          <p className="text-sm font-sans text-charcoal-muted">The requested job ID &apos;{jobId}&apos; does not exist.</p>
          <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-sans font-medium shadow-subtle">
            Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  const pipelineStages = [
    { label: "Detected", active: true },
    { label: "Classified", active: !!job.classification },
    { label: "Analyzed", active: !!job.repo_summary },
    { label: "Root Cause", active: !!job.root_cause },
    { label: "Patch Built", active: !!job.patch_diff },
    { label: "Tests Executed", active: !!job.test_results },
    { label: "Approved", active: job.human_approved === true || job.status === "COMPLETED" },
    { label: "PR Opened", active: !!job.pull_request },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-sans font-medium text-charcoal-muted hover:text-charcoal transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={loadJob}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-beige hover:border-beige-strong bg-white hover:bg-cream-soft text-xs font-sans text-charcoal transition shadow-subtle cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-charcoal-muted" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Job Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-beige shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg font-medium text-charcoal">
                  {job.repo_owner}/{job.repo_name}
                </span>
                {job.issue_number && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-cream-soft text-charcoal-secondary border border-beige">
                    Issue #{job.issue_number}
                  </span>
                )}
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-terracotta-light text-terracotta border border-terracotta-border font-medium">
                  {job.status.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-charcoal font-normal tracking-tight">
                {job.issue_title || "Untitled Issue"}
              </h1>
            </div>

            {job.pull_request?.pr_url && (
              <a
                href={job.pull_request.pr_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-sans font-medium shadow-subtle transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>Pull Request #{job.pull_request.pr_number}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>

          {/* Pipeline progress bar */}
          <div className="pt-3 border-t border-beige">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {pipelineStages.map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all ${
                      stage.active ? "bg-charcoal" : "bg-beige"
                    }`}
                  />
                  <span
                    className={`text-[11px] text-center font-sans ${
                      stage.active ? "text-charcoal font-medium" : "text-charcoal-light"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Human Approval Gate Banner */}
        <ApprovalBanner job={job} onUpdate={loadJob} />

        {/* Root Cause Card if available */}
        {job.root_cause && (
          <div className="p-6 rounded-2xl bg-cream-soft border border-beige shadow-subtle space-y-3.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-terracotta" />
              <h3 className="font-serif text-base font-medium text-charcoal">
                Root Cause & Fix Strategy
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-secondary font-sans leading-relaxed">
              {job.root_cause.explanation}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 text-xs font-sans">
              <div className="p-4 rounded-xl bg-white border border-beige shadow-subtle">
                <span className="font-medium text-charcoal-muted block mb-1.5">Culprit Files:</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.root_cause.culprit_files.map((file, i) => (
                    <code key={i} className="px-2 py-0.5 rounded-md bg-cream-soft border border-beige text-charcoal text-[11px] font-mono">
                      {file}
                    </code>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-beige shadow-subtle">
                <span className="font-medium text-charcoal-muted block mb-1.5">Fix Strategy:</span>
                <p className="text-charcoal-secondary text-[11px] leading-relaxed">{job.root_cause.fix_strategy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Tabs */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-beige pb-2">
            <button
              onClick={() => setActiveTab("diff")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                activeTab === "diff"
                  ? "btn-metallic text-white"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-cream-soft border border-transparent"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Unified Code Diff</span>
              {job.modified_files && job.modified_files.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  {job.modified_files.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("tests")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                activeTab === "tests"
                  ? "btn-metallic text-white"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-cream-soft border border-transparent"
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              <span>Test Results</span>
              {job.test_results && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    job.test_results.passed ? "bg-sage text-white" : "bg-rust text-white"
                  }`}
                >
                  {job.test_results.passed ? "PASS" : "FAIL"}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                activeTab === "logs"
                  ? "btn-metallic text-white"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-cream-soft border border-transparent"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Execution Logs ({logs.length})</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === "diff" && (
              <DiffViewer diff={job.patch_diff || ""} modifiedFiles={job.modified_files} />
            )}
            {activeTab === "tests" && (
              <TestResultsView testResults={job.test_results} />
            )}
            {activeTab === "logs" && (
              <ExecutionLogs logs={logs} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

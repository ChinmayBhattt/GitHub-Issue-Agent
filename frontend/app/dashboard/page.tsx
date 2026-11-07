"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { StatsOverview } from "../../components/StatsOverview";
import { JobList } from "../../components/JobList";
import { IssueSubmissionModal } from "../../components/IssueSubmissionModal";
import { api, DashboardStats, Job } from "../../services/api";
import { PlusCircle, RefreshCw, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<DashboardStats>({
    total_issues_processed: 0,
    under_investigation: 0,
    successful_fixes: 0,
    failed_executions: 0,
    pull_requests_created: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("start") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [healthRes, jobsRes] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getJobs().catch(() => []),
      ]);

      if (healthRes?.stats) {
        setStats(healthRes.stats);
      }
      setJobs(jobsRes);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar onOpenNewIssue={() => setModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Navigation Breadcrumb / Hero Header */}
        <section className="bg-white border border-beige p-8 sm:p-10 rounded-2xl shadow-subtle relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="inline-flex items-center space-x-1.5 text-xs font-sans text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <span className="text-charcoal-light">•</span>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream-soft border border-beige text-charcoal-secondary text-xs font-sans font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span>
                <span>Active Engineering Workspace</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal font-normal tracking-tight leading-tight">
              AI-Powered GitHub Issue Resolution
            </h1>

            <p className="text-sm sm:text-base text-charcoal-secondary font-sans leading-relaxed">
              Detects, classifies, investigates root causes, edits code in isolated local workspaces, executes tests, and opens structured Pull Requests across any public GitHub repository.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="btn-metallic px-5 py-2.5 rounded-xl font-sans font-medium text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit New Issue</span>
              </button>

              <button
                onClick={loadData}
                title="Refresh State"
                className="px-4 py-2.5 rounded-xl border border-beige hover:border-beige-strong bg-cream-soft/60 hover:bg-cream-soft text-charcoal font-sans text-xs sm:text-sm transition-all flex items-center space-x-1.5 cursor-pointer shadow-subtle"
              >
                <RefreshCw className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>Refresh</span>
              </button>

              <Link
                href="/docs"
                className="px-4 py-2.5 rounded-xl border border-beige hover:border-beige-strong bg-cream-soft/60 hover:bg-cream-soft text-charcoal font-sans text-xs sm:text-sm transition-all flex items-center space-x-1.5 cursor-pointer shadow-subtle"
              >
                <BookOpen className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>Documentation</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Operational Metrics */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-medium text-charcoal">
              Operational Metrics
            </h2>
            <span className="text-xs font-sans text-charcoal-light">System Telemetry</span>
          </div>
          <StatsOverview stats={stats} />
        </section>

        {/* Resolution Jobs List */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-medium text-charcoal">
              Resolution Jobs & Pipelines
            </h2>
            <span className="text-xs font-sans text-charcoal-muted flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span>
              <span>Live Auto-Refresh (5s)</span>
            </span>
          </div>

          <JobList
            jobs={jobs}
            onSelectJob={(jobId) => router.push(`/jobs/${jobId}`)}
          />
        </section>
      </main>

      <footer className="border-t border-beige py-8 bg-cream text-center text-xs font-sans text-charcoal-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-serif text-charcoal text-sm">Autonomous GitHub Issue Agent</p>
          <p className="text-[11px] text-charcoal-light">
            Powered by Google Gemini & LangGraph • Built with an Anthropic-inspired editorial aesthetic • Strictly Never Merges PRs Automatically
          </p>
        </div>
      </footer>

      <IssueSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onJobStarted={(jobId) => {
          loadData();
          router.push(`/jobs/${jobId}`);
        }}
      />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal-muted font-sans text-sm animate-pulse">Loading workspace...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

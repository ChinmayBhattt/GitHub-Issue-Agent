"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { api, DashboardStats } from "../services/api";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Cpu,
  GitPullRequest,
  CheckCircle2,
  Terminal,
  Activity,
  FolderGit2,
  Lock,
  Layers,
  ChevronRight,
  Play
} from "lucide-react";

export default function HeroLandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total_issues_processed: 0,
    under_investigation: 0,
    successful_fixes: 0,
    failed_executions: 0,
    pull_requests_created: 0,
  });

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res?.stats) setStats(res.stats);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col selection:bg-charcoal selection:text-cream">
      <Navbar />

      <main className="flex-1 w-full">
        {/* ============================================================ */}
        {/* HERO SECTION                                                 */}
        {/* ============================================================ */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Tagline Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-beige shadow-subtle text-charcoal text-xs font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-sage animate-pulse"></span>
              <span>Autonomous Engineering Agent</span>
              <span className="text-charcoal-light">•</span>
              <span className="text-charcoal-muted">Powered by Gemini &amp; LangGraph</span>
            </div>

            {/* Serif Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl text-charcoal font-normal tracking-tight leading-[1.08]">
              AI-Powered GitHub Issue Resolution
            </h1>

            {/* Editorial Description */}
            <p className="font-sans text-base sm:text-xl text-charcoal-secondary max-w-2xl mx-auto leading-relaxed">
              Detects, classifies, investigates root causes, edits code in isolated local workspaces, executes tests in secure sandboxes, and opens structured Pull Requests across any public GitHub repository.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard?start=true"
                className="btn-metallic w-full sm:w-auto px-8 py-3.5 rounded-xl font-sans font-medium text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-subtle group"
              >
                <Play className="w-4 h-4 fill-current text-cream" />
                <span>Start Now</span>
                <ArrowRight className="w-4 h-4 text-cream-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-beige hover:border-beige-strong bg-white hover:bg-cream-soft text-charcoal font-sans font-medium text-sm sm:text-base transition-all flex items-center justify-center space-x-2 shadow-subtle"
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Read Documentation</span>
              </Link>
            </div>

            <p className="text-xs font-sans text-charcoal-muted pt-2">
              🔒 Strictly Never Auto-Merges • Subprocess Sandboxed • Full Human-in-the-Loop Oversight
            </p>
          </div>

          {/* Interactive Pipeline Showcase Card */}
          <div className="mt-14 max-w-5xl mx-auto bg-white border border-beige rounded-2xl p-6 sm:p-8 shadow-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-beige">
              <div>
                <div className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Autonomous Lifecycle</div>
                <h3 className="font-serif text-lg font-medium text-charcoal">Deterministic State Machine Execution</h3>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <span>View Live Jobs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 7-Step Horizontal Progression */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-6 text-center">
              {[
                { step: "01", name: "Detection", sub: "Webhook / API" },
                { step: "02", name: "Triage", sub: "Gemini Analysis" },
                { step: "03", name: "Clone & AST", sub: "Isolated Dir" },
                { step: "04", name: "Root Cause", sub: "Call Tracing" },
                { step: "05", name: "Code Patch", sub: "Diff & Secrets" },
                { step: "06", name: "Test Runner", sub: "Allowlisted" },
                { step: "07", name: "PR Opened", sub: "Human Gate" },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className="p-3 rounded-xl border border-beige bg-cream/40 flex flex-col items-center justify-center space-y-1 relative"
                >
                  <span className="font-mono text-[10px] text-charcoal-muted font-bold">
                    STEP {item.step}
                  </span>
                  <div className="font-serif text-xs sm:text-sm font-medium text-charcoal">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-sans text-charcoal-light">
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* LIVE TELEMETRY BAR                                           */}
        {/* ============================================================ */}
        <section className="border-y border-beige bg-cream-soft/50 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl text-charcoal font-medium">
                  {stats.total_issues_processed}
                </div>
                <div className="text-xs font-sans text-charcoal-muted uppercase tracking-wider">
                  Total Processed
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl text-charcoal font-medium">
                  {stats.successful_fixes}
                </div>
                <div className="text-xs font-sans text-charcoal-muted uppercase tracking-wider">
                  Verified Fixes
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl text-charcoal font-medium">
                  {stats.pull_requests_created}
                </div>
                <div className="text-xs font-sans text-charcoal-muted uppercase tracking-wider">
                  Pull Requests Created
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl text-charcoal font-medium text-sage">
                  0%
                </div>
                <div className="text-xs font-sans text-charcoal-muted uppercase tracking-wider">
                  Auto-Merge Incidents
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CORE ARCHITECTURAL PILLARS                                   */}
        {/* ============================================================ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Engineered for Safety</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal font-normal">
              Enterprise-Grade Autonomy Guardrails
            </h2>
            <p className="font-sans text-sm sm:text-base text-charcoal-secondary">
              Unlike generic coding scripts, this agent enforces strict sandboxing, pre-commit secret scanning, and deterministic LangGraph routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-beige p-8 rounded-2xl shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cream-soft border border-beige flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-sage" />
              </div>
              <h3 className="font-serif text-xl font-medium text-charcoal">
                Strict Zero Auto-Merge
              </h3>
              <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                The agent forks repositories, builds dedicated branches, and opens descriptive PRs, but <strong>never merges directly</strong>. All code changes require explicit human engineer review.
              </p>
            </div>

            <div className="bg-white border border-beige p-8 rounded-2xl shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cream-soft border border-beige flex items-center justify-center">
                <Lock className="w-5 h-5 text-charcoal" />
              </div>
              <h3 className="font-serif text-xl font-medium text-charcoal">
                Isolated Sandbox Subprocess
              </h3>
              <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                Commands run in sandboxed directories with path traversal locks (<code className="font-mono text-xs">..</code> blocked), strict allowlists, and sanitized environment variables without sensitive API keys.
              </p>
            </div>

            <div className="bg-white border border-beige p-8 rounded-2xl shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cream-soft border border-beige flex items-center justify-center">
                <Cpu className="w-5 h-5 text-ochre" />
              </div>
              <h3 className="font-serif text-xl font-medium text-charcoal">
                Multi-Language Support
              </h3>
              <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                Supports Python (<code className="font-mono text-xs">pytest</code>, <code className="font-mono text-xs">unittest</code>), JavaScript &amp; TypeScript (<code className="font-mono text-xs">npm</code>, <code className="font-mono text-xs">yarn</code>, <code className="font-mono text-xs">pnpm</code>), Rust (<code className="font-mono text-xs">cargo</code>), and Go out of the box.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CALL TO ACTION                                               */}
        {/* ============================================================ */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto">
          <div className="bg-white border border-beige p-10 sm:p-14 rounded-2xl shadow-subtle text-center space-y-6 max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal font-medium">
              Ready to resolve your next GitHub issue?
            </h2>
            <p className="font-sans text-sm sm:text-base text-charcoal-secondary max-w-xl mx-auto leading-relaxed">
              Launch the workspace, connect your repository, and watch the agent analyze, fix, and test the issue automatically.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard?start=true"
                className="btn-metallic w-full sm:w-auto px-8 py-3.5 rounded-xl font-sans font-medium text-sm sm:text-base flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current text-cream" />
                <span>Start Now</span>
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-beige hover:border-beige-strong bg-cream-soft/60 hover:bg-cream-soft text-charcoal font-sans font-medium text-sm sm:text-base transition-all flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Explore Documentation</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-beige py-8 bg-cream text-center text-xs font-sans text-charcoal-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-serif text-charcoal text-sm">Autonomous GitHub Issue Agent</p>
          <p className="text-[11px] text-charcoal-light">
            Powered by Google Gemini &amp; LangGraph • Built with Anthropic Editorial Styling • Strictly Never Merges PRs Automatically
          </p>
        </div>
      </footer>
    </div>
  );
}

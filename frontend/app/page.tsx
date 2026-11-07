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
  Play,
  Copy,
  Check,
  Code2,
  FileCode2,
  Search,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronDown
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

  // Interactive Lifecycle Simulator State
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"install" | "env" | "run" | "curl">("install");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res?.stats) setStats(res.stats);
      })
      .catch(() => {});
  }, []);

  // Auto-cycle simulator steps if auto-playing
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % lifecycleSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const lifecycleSteps = [
    {
      step: "01",
      name: "Issue Detection & Ingestion",
      agent: "IssueDetectorAgent",
      badge: "Ingestion & De-dup",
      summary: "Ingests raw issue payload via GitHub webhook HMAC-SHA256 signature or manual REST submission. Validates public repository availability and creates an isolated job record.",
      terminalTitle: "api/webhooks/github [HMAC Verified]",
      terminalOutput: `[INFO] Webhook received: X-Hub-Signature-256 verified (SHA256)
[INFO] Target: ruvnet/RuView#55 — "Backend unavailable — start sensing-server"
[INFO] State initialized: job-b2d9b7e8c9fb (Queued in JSON Store)
[STATUS] ➔ Transitioning to node_issue_understanding`,
    },
    {
      step: "02",
      name: "Triage & Classification",
      agent: "IssueAnalyzer (Gemini 2.5 Flash)",
      badge: "Structured Schemas",
      summary: "Gemini 2.5 Flash parses the issue body, categorizes it (Bug, Enhancement, Security), determines priority and severity, and assesses whether the issue is actionable.",
      terminalTitle: "Gemini Structured Generation (Pydantic)",
      terminalOutput: `{
  "category": "Bug",
  "severity": "Medium",
  "priority": "P2",
  "actionable": true,
  "summary": "Runtime sensing-server startup failure due to unhandled port binding exception.",
  "missing_info": null
}
[SUCCESS] Issue classified as actionable bug. Proceeding to codebase analysis.`,
    },
    {
      step: "03",
      name: "Repo Analysis & AST Parsing",
      agent: "RepoAnalyzerAgent",
      badge: "Isolated Sandboxing",
      summary: "Performs a shallow clone into an ephemeral, path-traversal-guarded workspace directory. Scans the file tree, parses AST symbols, and detects language and test suites.",
      terminalTitle: "workspaces/job-b2d9b7e8c9fb [AST Scanner]",
      terminalOutput: `[INFO] Cloning repository: https://github.com/ruvnet/RuView (depth=1)
[INFO] Language detected: Python 3.10+
[INFO] Total files indexed: 38 files | 2,410 lines of code
[INFO] Test command resolved: 'pytest' (Fallback: 'python3 -m unittest')
[INFO] Candidate culprit files: ['python/server.py', 'python/sensing.py']`,
    },
    {
      step: "04",
      name: "Root Cause Investigation",
      agent: "RootCauseAgent",
      badge: "Symbol Call Tracing",
      summary: "Inspects code execution paths against the issue stack trace. Isolates exact culprit files, suspect functions, and generates a structured fix strategy.",
      terminalTitle: "AST Call-Graph Trace",
      terminalOutput: `[INVESTIGATION] Tracing sensing-server initialization stack...
[IDENTIFIED] Culprit File: python/server.py
[FUNCTION] def start_sensing_server(port: int = 8080)
[EVIDENCE] Port conflict exception is unhandled when socket.bind() fails on busy port.
[STRATEGY] Implement defensive retry with incremental fallback port and clear logging.`,
    },
    {
      step: "05",
      name: "Patch Synthesis & Secret Scan",
      agent: "CodeFixAgent + PatchValidator",
      badge: "Pre-Commit Guard",
      summary: "Gemini generates the updated file content and computes a unified diff. The PatchValidator scans every line against regexes for private keys, AWS, and GitHub tokens.",
      terminalTitle: "Unified Diff & Security Verification",
      terminalOutput: `diff --git a/python/server.py b/python/server.py
@@ -42,6 +42,9 @@ def start_sensing_server(port: int = 8080):
+    except OSError as e:
+        logger.warning(f"Port {port} in use, attempting fallback to {port + 1}...")
+        return start_sensing_server(port + 1)
[SECURITY SCAN] No AWS, GitHub, GCP, or private keys detected in diff.
[VALIDATION] Patch format verified. Ready for sandbox test execution.`,
    },
    {
      step: "06",
      name: "Subprocess Test Execution",
      agent: "TestingAgent (Sandbox Runner)",
      badge: "Environment Scrubbed",
      summary: "Executes allowlisted test runners in an isolated subprocess with stripped environment variables (no leaking secrets). Automatically applies coverage overrides if needed.",
      terminalTitle: "test_runner.py [Subprocess Isolation]",
      terminalOutput: `[SUBPROCESS] Executing: pytest -o addopts=
[ENV] Scrubbed 14 sensitive tokens (PATH & HOME preserved)
collected 34 items
tests/test_server.py .................................. [100%]
======================= 34 passed in 0.08s =======================
[SUCCESS] All unit and regression tests passed cleanly!`,
    },
    {
      step: "07",
      name: "Human Approval Gate & PR",
      agent: "PRAgent (Zero Auto-Merge)",
      badge: "Human-in-the-Loop",
      summary: "The agent pauses for human sign-off. Upon 1-click approval, it forks the repository, creates branch fix/issue-55, commits the patch, and opens a structured GitHub PR.",
      terminalTitle: "GitHub REST API v3 [PR Created]",
      terminalOutput: `[APPROVAL] Human engineer approved patch via Web Dashboard.
[GIT] Created branch: fix/issue-55-sensing-server-backend
[GIT] Committed: fix(server): handle port conflict during sensing server startup (#55)
[GITHUB] Pull Request opened: https://github.com/ruvnet/RuView/pull/56
[POLICY] Strictly Never Merges PR Automatically. CI & Code Review Required.`,
    },
  ];

  const codeSnippets = {
    install: `# 1. Clone the repository
git clone https://github.com/ChinmayBhatt/github-issue-agent.git
cd github-issue-agent

# 2. Setup Backend (Python 3.10+)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest-cov

# 3. Setup Frontend (Node 18+)
cd ../frontend
npm install`,
    env: `# Root .env file configuration
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# GitHub Credentials (Personal Access Token or GitHub App)
GITHUB_TOKEN=ghp_...your_github_token_here
GITHUB_WEBHOOK_SECRET=your_hmac_secret_here

# Execution Limits & Policies
AUTONOMOUS_MODE=false            # Strict human-in-the-loop gate
MAX_TEST_TIMEOUT_SECONDS=120     # Subprocess runner timeout
MAX_OUTPUT_BYTES=102400          # 100KB stdout/stderr cap
MAX_FIX_ATTEMPTS=3               # Max test retry cycles`,
    run: `# Terminal 1: Run Backend FastAPI Server
cd backend
./.venv/bin/uvicorn app.main:app --reload --port 8000

# Terminal 2: Run Frontend Next.js Client
cd frontend
npm run dev

# Open in Browser: http://localhost:3000`,
    curl: `# Submit any public GitHub issue to the agent
curl -X POST "http://localhost:8000/api/jobs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/ruvnet/RuView",
    "issue_number": 55,
    "issue_title": "Backend unavailable - start sensing-server",
    "issue_body": "sensing-server failed to bind to port 8080 during initialization."
  }'`,
  };

  const faqItems = [
    {
      q: "Does this agent work with ANY public GitHub repository?",
      a: "Yes! You can provide any public GitHub repository URL (e.g. facebook/react, pallets/flask, ruvnet/RuView). The agent performs an isolated shallow clone into a local sandboxed directory, inspects the codebase structure, and identifies the correct test runner automatically.",
    },
    {
      q: "How does the agent guarantee that it will never auto-merge dangerous code?",
      a: "The system enforces an immutable Zero Auto-Merge Policy. Even in autonomous mode, the agent creates dedicated git branches, runs isolated tests, and opens a Pull Request on GitHub with a comprehensive diff and test report. The final merge action is strictly left to repository maintainers and your standard GitHub branch protection rules.",
    },
    {
      q: "How are private API keys and tokens protected during test execution?",
      a: "The test runner operates inside an isolated subprocess with environment variable scrubbing. Before any command executes, all environment keys containing 'KEY', 'TOKEN', 'SECRET', 'AUTH', or 'PASS' are completely expunged. Subprocess tests cannot access your Gemini API key or GitHub token.",
    },
    {
      q: "What happens if a public repository has missing external system dependencies?",
      a: "Our testing engine features smart resilience: if a repository fails due to missing C-libraries or system plugins (such as custom pytest coverage flags), it automatically attempts clean fallback flags (pytest -o addopts=). If tests still cannot execute due to missing OS dependencies, the agent issues a transparent 'Test Limitation Disclosure' and safely proceeds to the Human Approval Gate for engineer review.",
    },
    {
      q: "How does the agent push code if I don't own the public repository?",
      a: "When you configure your GITHUB_TOKEN, the agent automatically forks the target public repository to your GitHub account, pushes the fix branch to your fork, and opens a cross-repository Pull Request against the upstream repository.",
    },
    {
      q: "Can I connect GitHub Webhooks for real-time automatic issue resolution?",
      a: "Yes! You can configure a GitHub App or repository webhook pointing to /api/webhooks/github. All incoming payloads are verified using HMAC-SHA256 signatures with your GITHUB_WEBHOOK_SECRET, ensuring authentic issue events.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col selection:bg-charcoal selection:text-cream">
      <Navbar />

      <main className="flex-1 w-full space-y-24 pb-24">
        {/* ============================================================ */}
        {/* 1. HERO SECTION                                              */}
        {/* ============================================================ */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            {/* Tagline Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-beige shadow-subtle text-charcoal text-xs font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-sage animate-pulse-glow"></span>
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

              <a
                href="#architecture-docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-beige hover:border-beige-strong bg-white hover:bg-cream-soft text-charcoal font-sans font-medium text-sm sm:text-base transition-all flex items-center justify-center space-x-2 shadow-subtle"
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Read Documentation</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs font-sans text-charcoal-muted pt-2">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                <span>Strictly Never Auto-Merges</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-charcoal" />
                <span>Subprocess Sandboxed</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-ochre" />
                <span>Full Human-in-the-Loop Oversight</span>
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. INTERACTIVE RESOLUTION SIMULATOR WIDGET                   */}
        {/* ============================================================ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="bg-white border border-beige rounded-2xl p-6 sm:p-10 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-beige">
              <div>
                <div className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
                  Autonomous Lifecycle Simulator
                </div>
                <h2 className="font-serif text-2xl font-medium text-charcoal">
                  Deterministic State Machine Execution
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isAutoPlaying
                      ? "bg-sage-light border-sage text-sage"
                      : "bg-cream-soft border-beige text-charcoal hover:bg-cream-subtle"
                  }`}
                >
                  <Play className={`w-3 h-3 ${isAutoPlaying ? "fill-current" : ""}`} />
                  <span>{isAutoPlaying ? "Auto-Playing (4s)" : "Auto-Play Simulator"}</span>
                </button>
                <Link
                  href="/dashboard"
                  className="text-xs font-sans text-charcoal-muted hover:text-charcoal flex items-center space-x-1 transition-colors"
                >
                  <span>Launch Live Jobs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Horizontal Step Selector Pill Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {lifecycleSteps.map((s, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <button
                    key={s.step}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isActive
                        ? "bg-[#1C1B1A] border-[#3A3935] text-[#FAF9F5] shadow-sm transform -translate-y-0.5"
                        : "bg-cream/40 border-beige text-charcoal hover:bg-cream-soft hover:border-beige-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold ${isActive ? "text-cream-muted" : "text-charcoal-light"}`}>
                        STEP {s.step}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span>}
                    </div>
                    <div className="font-serif text-xs font-medium mt-1 truncate">
                      {s.name.split(" ")[0]}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Detailed Inspector View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left Column: Stage Metadata */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cream-soft border border-beige text-[11px] font-mono text-charcoal-muted">
                    <span>Agent: {lifecycleSteps[activeStepIndex].agent}</span>
                  </div>
                  <h3 className="font-serif text-xl text-charcoal font-medium">
                    {lifecycleSteps[activeStepIndex].name}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                    {lifecycleSteps[activeStepIndex].summary}
                  </p>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : lifecycleSteps.length - 1));
                      setIsAutoPlaying(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-beige bg-cream text-xs font-sans text-charcoal hover:bg-cream-soft transition-colors cursor-pointer"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={() => {
                      setActiveStepIndex((prev) => (prev + 1) % lifecycleSteps.length);
                      setIsAutoPlaying(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-beige bg-[#1C1B1A] text-[#FAF9F5] text-xs font-sans font-medium hover:bg-[#2A2A28] transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Next Step</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Simulated Terminal Stream */}
              <div className="lg:col-span-7 bg-[#141413] border border-[#2D2D2A] rounded-xl p-4 sm:p-5 font-mono text-xs text-[#FAF9F5] space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-[#2D2D2A]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]/80"></span>
                    <span className="text-[11px] text-cream-muted ml-2">
                      {lifecycleSteps[activeStepIndex].terminalTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-cream-muted px-1.5 py-0.5 rounded bg-[#222220]">
                    SANDBOX SUBPROCESS
                  </span>
                </div>

                <pre className="text-xs text-[#E8E6DC] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {lifecycleSteps[activeStepIndex].terminalOutput}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. LIVE TELEMETRY BAR                                         */}
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
        {/* 4. COMPREHENSIVE ARCHITECTURE & AGENT BREAKDOWN              */}
        {/* ============================================================ */}
        <section id="architecture-docs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
              Deep Architectural Specification
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal font-normal">
              Specialized Multi-Agent Ecosystem
            </h2>
            <p className="font-sans text-sm sm:text-base text-charcoal-secondary">
              Rather than relying on a single monolith prompt, GitHub Issue Agent separates cognitive responsibilities across specialized, deterministic agents wired together using a compiled LangGraph state machine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Search,
                name: "1. Issue Detector",
                desc: "Validates HMAC-SHA256 signatures, deduplicates incoming GitHub webhooks, parses issue titles and bodies, and registers unique job records.",
              },
              {
                icon: Sparkles,
                name: "2. Gemini Issue Analyzer",
                desc: "Uses Gemini 2.5 Flash with structured Pydantic output schemas to categorize bugs vs features, assign severity, and assess actionable clarity.",
              },
              {
                icon: FileCode2,
                name: "3. Repo & AST Analyzer",
                desc: "Creates a shallow git clone in an isolated sandbox. Parses Python AST, TypeScript symbols, package manifests, and identifies active test runners.",
              },
              {
                icon: Layers,
                name: "4. Root Cause Investigator",
                desc: "Traces call graphs and runtime execution paths. Correlates error logs to candidate source files and isolates the exact suspect functions.",
              },
              {
                icon: Code2,
                name: "5. Code Fix Engine",
                desc: "Produces minimal unified code diffs matching existing code styles. Follows defensive programming rules without introducing bloat.",
              },
              {
                icon: ShieldCheck,
                name: "6. Patch & Secret Validator",
                desc: "Scans every generated patch line against regexes for private keys, AWS tokens, GitHub PATs, and Google API credentials before execution.",
              },
              {
                icon: Terminal,
                name: "7. Sandbox Test Runner",
                desc: "Executes allowlisted test runners in an isolated subprocess with stripped environment variables. Automatically applies coverage overrides.",
              },
              {
                icon: GitPullRequest,
                name: "8. Pull Request Agent",
                desc: "Forks the upstream repo, creates a clean branch, commits the verified patch, and opens a GitHub Pull Request gated by human sign-off.",
              },
            ].map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.name}
                  className="bg-white border border-beige p-6 rounded-2xl shadow-subtle card-lift space-y-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-cream-soft border border-beige flex items-center justify-center">
                    <Icon className="w-4 h-4 text-charcoal" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-charcoal">
                    {agent.name}
                  </h3>
                  <p className="font-sans text-xs text-charcoal-secondary leading-relaxed">
                    {agent.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. SECURITY & SANDBOXING MATRIX                              */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-white border border-beige rounded-2xl p-8 sm:p-12 shadow-subtle space-y-8">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
                Defense in Depth
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                Enterprise Sandboxing &amp; Safety Matrix
              </h2>
              <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                Autonomous code agents can introduce significant risk if unchecked. Our architecture implements multi-tier runtime boundaries:
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-beige text-charcoal font-medium">
                    <th className="py-3 px-4">Security Layer</th>
                    <th className="py-3 px-4">Threat Prevented</th>
                    <th className="py-3 px-4">Implementation Mechanism</th>
                    <th className="py-3 px-4">Default State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/60 text-charcoal-secondary">
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-charcoal">Path Traversal Defense</td>
                    <td className="py-3.5 px-4">Directory escapes (<code className="font-mono text-[11px]">../../etc/passwd</code>)</td>
                    <td className="py-3.5 px-4"><code className="font-mono text-[11px]">validate_file_path()</code> strictly enforces resolution inside job directory</td>
                    <td className="py-3.5 px-4 text-sage font-medium">Always Enforced</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-charcoal">Environment Variable Sanitization</td>
                    <td className="py-3.5 px-4">Test suites exfiltrating host credentials</td>
                    <td className="py-3.5 px-4">Strips any environment variable containing KEY, TOKEN, SECRET, AUTH, PASS</td>
                    <td className="py-3.5 px-4 text-sage font-medium">Always Enforced</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-charcoal">Command Execution Allowlist</td>
                    <td className="py-3.5 px-4">Arbitrary command execution &amp; shell escapes</td>
                    <td className="py-3.5 px-4">Executes without shell=True; validates prefix against strictly approved test commands</td>
                    <td className="py-3.5 px-4 text-sage font-medium">Allowlist Only</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-charcoal">Pre-Commit Secret Scanning</td>
                    <td className="py-3.5 px-4">Accidentally pushing private keys or tokens</td>
                    <td className="py-3.5 px-4">Regex inspection for AWS, GitHub PATs, private SSH keys, and Google API keys</td>
                    <td className="py-3.5 px-4 text-sage font-medium">Pre-Commit Block</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-charcoal">Zero Auto-Merge Policy</td>
                    <td className="py-3.5 px-4">Untracked, unreviewed production merges</td>
                    <td className="py-3.5 px-4">Creates isolated branches &amp; PRs; merge action strictly requires repository maintainer approval</td>
                    <td className="py-3.5 px-4 text-sage font-medium">Hard Policy</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. INTERACTIVE CODE & SETUP REFERENCE                        */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
                  Developer Quick Reference
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Installation, Config &amp; API Invocation
                </h2>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-cream-soft border border-beige">
                {[
                  { id: "install", label: "1. Setup & Install" },
                  { id: "env", label: "2. Environment (.env)" },
                  { id: "run", label: "3. Run Servers" },
                  { id: "curl", label: "4. cURL API Call" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      activeCodeTab === tab.id
                        ? "bg-white text-charcoal shadow-subtle border border-beige"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabbed Code Box */}
            <div className="relative group">
              <pre className="bg-[#1C1B1A] text-[#FAF9F5] p-5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3A3935]">
                {codeSnippets[activeCodeTab]}
              </pre>
              <button
                onClick={() => copyToClipboard(codeSnippets[activeCodeTab], activeCodeTab)}
                className="absolute top-3.5 right-3.5 p-2 rounded-lg bg-[#2A2A28] border border-[#3A3935] text-cream hover:bg-[#3A3935] transition-colors cursor-pointer"
                title="Copy code snippet"
              >
                {copiedCodeId === activeCodeTab ? (
                  <Check className="w-3.5 h-3.5 text-sage" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. ARCHITECTURAL COMPARISON: SCRIPT VS AGENT                 */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
                Design Principles
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                Traditional AI Scripting vs. GitHub Issue Agent
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-sans text-xs sm:text-sm">
              <div className="p-6 rounded-xl border border-beige bg-cream/30 space-y-3">
                <div className="font-serif text-base font-medium text-rust flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rust" />
                  <span>Traditional AI Coding Bots</span>
                </div>
                <ul className="space-y-2 text-charcoal-secondary text-xs leading-relaxed">
                  <li>❌ Hallucinates non-existent file paths and function signatures.</li>
                  <li>❌ Directly attempts to commit without running repository test suites.</li>
                  <li>❌ Crashes when external repos have strict coverage flags (<code className="font-mono">--cov</code>).</li>
                  <li>❌ Leaks host environment API keys into unisolated subprocesses.</li>
                  <li>❌ Auto-merges untested code straight into main branch.</li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-beige bg-cream-soft/60 space-y-3">
                <div className="font-serif text-base font-medium text-sage flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-sage" />
                  <span>GitHub Issue Agent (Antigravity Architecture)</span>
                </div>
                <ul className="space-y-2 text-charcoal-secondary text-xs leading-relaxed">
                  <li>✅ Parses AST symbols &amp; verifies culprit files actually exist in repository.</li>
                  <li>✅ Executes allowlisted tests in an isolated, scrubbed sandbox subprocess.</li>
                  <li>✅ Gracefully handles coverage flags with <code className="font-mono">pytest -o addopts=</code> fallback.</li>
                  <li>✅ Pre-commit secret scanning checks against AWS, GitHub, and private keys.</li>
                  <li>✅ Strict Human Approval Gate ensures maintainers retain 100% control.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. INTERACTIVE FAQ ACCORDION                                 */}
        {/* ============================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif text-3xl text-charcoal font-medium">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3 pt-4">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="bg-white border border-beige rounded-2xl overflow-hidden shadow-subtle transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer hover:bg-cream-soft/40 transition-colors"
                  >
                    <span className="font-serif text-base sm:text-lg font-medium text-charcoal">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-charcoal-muted transition-transform duration-200 flex-shrink-0 ml-4 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm font-sans text-charcoal-secondary leading-relaxed border-t border-beige/60 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. BOTTOM CALL TO ACTION                                     */}
        {/* ============================================================ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-white border border-beige p-10 sm:p-14 rounded-2xl shadow-subtle text-center space-y-6 max-w-4xl mx-auto card-lift">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream-soft border border-beige text-charcoal-secondary text-xs font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span>
              <span>Ready for Production Workloads</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl text-charcoal font-medium tracking-tight">
              Start Resolving Issues with Gemini &amp; LangGraph
            </h2>

            <p className="font-sans text-sm sm:text-base text-charcoal-secondary max-w-xl mx-auto leading-relaxed">
              Launch your workspace now. Enter any public GitHub repository URL or issue number and let the agent investigate, patch, test, and open your Pull Request.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
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
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-beige hover:border-beige-strong bg-cream-soft/60 hover:bg-cream-soft text-charcoal font-sans font-medium text-sm sm:text-base transition-all flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4 text-charcoal-muted" />
                <span>Full Docs Page</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-beige py-10 bg-cream text-center text-xs font-sans text-charcoal-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-serif text-charcoal text-base">Autonomous GitHub Issue Agent</p>
          <p className="text-xs text-charcoal-light max-w-2xl mx-auto">
            Powered by Google Gemini 2.5 Flash &amp; LangGraph • Designed with Anthropic Editorial Warm Ivory Aesthetics • Strictly Never Auto-Merges Pull Requests
          </p>
          <div className="pt-3 flex items-center justify-center space-x-6 text-xs text-charcoal-secondary font-sans">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">Dashboard</Link>
            <span>•</span>
            <Link href="/docs" className="hover:text-charcoal transition-colors">Documentation</Link>
            <span>•</span>
            <Link href="/repos" className="hover:text-charcoal transition-colors">Repositories</Link>
            <span>•</span>
            <Link href="/pull-requests" className="hover:text-charcoal transition-colors">Pull Requests</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

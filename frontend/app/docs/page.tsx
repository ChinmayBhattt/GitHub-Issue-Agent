"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  BookOpen,
  Terminal,
  ShieldCheck,
  Cpu,
  GitPullRequest,
  Key,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  Code2,
  PlayCircle
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sections = [
    { id: "overview", label: "Overview & Mission", icon: Sparkles },
    { id: "quickstart", label: "Quick Start Guide", icon: Terminal },
    { id: "env-config", label: "Environment & Keys", icon: Key },
    { id: "github-setup", label: "GitHub Token & App", icon: Lock },
    { id: "agent-workflow", label: "Agent Architecture", icon: Layers },
    { id: "security", label: "Security & Sandbox", icon: ShieldCheck },
    { id: "testing-engine", label: "Test Runner Engine", icon: Cpu },
    { id: "api-reference", label: "REST API Reference", icon: Code2 },
    { id: "faq", label: "FAQ & Troubleshooting", icon: HelpCircle },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-cream text-charcoal flex flex-col">
        {/* Docs Header Banner */}
        <div className="border-b border-beige bg-cream-soft/60 backdrop-blur-sm py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream border border-beige text-charcoal-secondary text-xs font-sans font-medium">
                <BookOpen className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>Developer Documentation & Architecture</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-charcoal font-normal tracking-tight">
                ZORVEX Architecture &amp; Guide
              </h1>
              <p className="text-sm sm:text-base text-charcoal-secondary font-sans max-w-2xl">
                Comprehensive guide to configuring, operating, and extending ZORVEX — the autonomous multi-agent code resolution pipeline powered by Google Gemini and LangGraph.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="btn-metallic px-5 py-2.5 rounded-xl font-sans font-medium text-xs sm:text-sm flex items-center space-x-2"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Documentation Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-1 bg-white border border-beige rounded-2xl p-3 shadow-subtle">
              <div className="px-3 py-2 text-xs font-serif font-medium text-charcoal uppercase tracking-wider">
                Contents
              </div>
              <nav className="space-y-0.5">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        const el = document.getElementById(sec.id);
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-sans transition-all text-left ${isActive
                        ? "bg-cream-soft font-medium text-charcoal border border-beige"
                        : "text-charcoal-muted hover:text-charcoal hover:bg-cream-soft/40"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-charcoal" : "text-charcoal-light"}`} />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-beige px-3 pb-2 space-y-2">
                <div className="text-[11px] font-sans text-charcoal-muted">Quick Resources</div>
                <div className="flex flex-col space-y-1.5 text-xs font-sans">
                  <a
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-charcoal-secondary hover:text-charcoal flex items-center justify-between group"
                  >
                    <span>Google Gemini API</span>
                    <ExternalLink className="w-3 h-3 text-charcoal-light group-hover:text-charcoal" />
                  </a>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-charcoal-secondary hover:text-charcoal flex items-center justify-between group"
                  >
                    <span>GitHub Personal Tokens</span>
                    <ExternalLink className="w-3 h-3 text-charcoal-light group-hover:text-charcoal" />
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="lg:col-span-9 space-y-12">
            {/* 1. Overview */}
            <section id="overview" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Architecture & Core Mission</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  What is ZORVEX?
                </h2>
              </div>

              <p className="font-sans text-sm sm:text-base text-charcoal-secondary leading-relaxed">
                ZORVEX is an enterprise-grade autonomous engineering agent designed to investigate, trace, and repair issues in <strong>any public or private GitHub repository</strong>. It orchestrates Google Gemini models and LangGraph to emulate a senior software engineer’s investigation loop:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-beige rounded-xl p-5 bg-cream/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cream-soft border border-beige flex items-center justify-center">
                    <Layers className="w-4 h-4 text-charcoal" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-charcoal">Multi-Agent State Machine</h3>
                  <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                    Uses LangGraph to structure the resolution process through discrete, deterministic steps with clear rollback, retry loops, and fail-safe transitions.
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cream-soft border border-beige flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-sage" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-charcoal">Zero Auto-Merge Policy</h3>
                  <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                    Guaranteed safety boundary: the agent writes code, validates tests, and opens a structured PR, but <strong>never</strong> merges directly into main branches without human sign-off.
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cream-soft border border-beige flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-charcoal" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-charcoal">Isolated Local Sandbox</h3>
                  <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                    All git clones and test executions execute inside ephemeral, path-traversal-guarded workspaces with sanitized environment variables (no leaking API keys).
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cream-soft border border-beige flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-ochre" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-charcoal">Gemini 2.5 Flash Intelligence</h3>
                  <p className="font-sans text-xs sm:text-sm text-charcoal-secondary leading-relaxed">
                    Fast structured inference produces Pydantic-enforced schemas for issue classification, root cause analysis, AST modifications, and patch diff generation.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Quick Start */}
            <section id="quickstart" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Getting Started</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  5-Minute Setup Guide
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-sans font-medium text-charcoal">
                    <span className="w-6 h-6 rounded-full bg-cream-soft border border-beige flex items-center justify-center text-xs">1</span>
                    <span>Clone the repository & install dependencies</span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-[#1C1B1A] text-[#FAF9F5] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3A3935]">
                      {`git clone https://github.com/ChinmayBhatt/github-issue-agent.git
cd github-issue-agent

# Backend setup (Python 3.10+)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest-cov

# Frontend setup (Node 18+)
cd ../frontend
npm install`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`git clone https://github.com/ChinmayBhatt/github-issue-agent.git\ncd github-issue-agent\ncd backend\npython3 -m venv .venv\nsource .venv/bin/activate\npip install -r requirements.txt\npip install pytest-cov\ncd ../frontend\nnpm install`, "cmd1")}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#2A2A28] border border-[#3A3935] text-cream hover:bg-[#3A3935] transition-colors"
                      title="Copy commands"
                    >
                      {copiedIndex === "cmd1" ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-sans font-medium text-charcoal">
                    <span className="w-6 h-6 rounded-full bg-cream-soft border border-beige flex items-center justify-center text-xs">2</span>
                    <span>Start Backend & Frontend Servers</span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-[#1C1B1A] text-[#FAF9F5] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3A3935]">
                      {`# Terminal 1 - Backend FastAPI (Port 8000)
cd backend
./.venv/bin/uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend Next.js (Port 3000)
cd frontend
npm run dev`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000\ncd frontend && npm run dev`, "cmd2")}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#2A2A28] border border-[#3A3935] text-cream hover:bg-[#3A3935] transition-colors"
                      title="Copy commands"
                    >
                      {copiedIndex === "cmd2" ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream-soft border border-beige text-xs sm:text-sm font-sans space-y-1">
                <span className="font-medium text-charcoal">Interactive Verification:</span>
                <p className="text-charcoal-secondary">
                  Open <code className="px-1.5 py-0.5 rounded bg-white border border-beige text-xs font-mono">http://localhost:3000</code> in your browser. You will see the system status badge turn <span className="text-sage font-medium">Online • v0.1.0</span>.
                </p>
              </div>
            </section>

            {/* 3. Environment Variables */}
            <section id="env-config" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Configuration Reference</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Environment Variables (<code className="font-mono text-xl">.env</code>)
                </h2>
              </div>

              <p className="text-sm font-sans text-charcoal-secondary leading-relaxed">
                Configure your root <code className="font-mono text-xs bg-cream-soft px-1.5 py-0.5 rounded border border-beige">.env</code> file. The agent automatically detects keys from both project root and backend environments:
              </p>

              <div className="relative group">
                <pre className="bg-[#1C1B1A] text-[#FAF9F5] p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#3A3935]">
                  {`# ==========================================
# Google Gemini API
# ==========================================
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# ==========================================
# GitHub Credentials
# ==========================================
# Personal Access Token (classic or fine-grained)
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere

# GitHub App / Webhook Secret for HMAC verification
GITHUB_WEBHOOK_SECRET=your_webhook_hmac_secret_here

# ==========================================
# Execution Engine Safety Defaults
# ==========================================
AUTONOMOUS_MODE=false               # Keep false to require Human Approval before PR
MAX_TEST_TIMEOUT_SECONDS=120        # Timeout for sandbox test runner
MAX_OUTPUT_BYTES=102400             # Truncate runner output to 100KB
MAX_FIX_ATTEMPTS=3                  # Max test retry cycles before failing gracefully

# ==========================================
# Frontend API URL
# ==========================================
NEXT_PUBLIC_API_URL=http://localhost:8000`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`GEMINI_API_KEY=your_key\nGEMINI_MODEL=gemini-2.5-flash\nGITHUB_TOKEN=ghp_your_token\nGITHUB_WEBHOOK_SECRET=secret\nAUTONOMOUS_MODE=false\nMAX_TEST_TIMEOUT_SECONDS=120\nMAX_OUTPUT_BYTES=102400\nMAX_FIX_ATTEMPTS=3\nNEXT_PUBLIC_API_URL=http://localhost:8000`, "env1")}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#2A2A28] border border-[#3A3935] text-cream hover:bg-[#3A3935] transition-colors"
                  title="Copy sample .env"
                >
                  {copiedIndex === "env1" ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Table of parameters */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-beige text-charcoal font-medium">
                      <th className="py-2.5 px-3">Variable</th>
                      <th className="py-2.5 px-3">Required</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beige/60 text-charcoal-secondary">
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-charcoal font-medium">GEMINI_API_KEY</td>
                      <td className="py-2.5 px-3 text-terracotta">Yes</td>
                      <td className="py-2.5 px-3 font-mono">-</td>
                      <td className="py-2.5 px-3">Google AI Studio API key used by LLM triage, root cause, and code generator agents.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-charcoal font-medium">GITHUB_TOKEN</td>
                      <td className="py-2.5 px-3 text-charcoal-muted">Optional*</td>
                      <td className="py-2.5 px-3 font-mono">-</td>
                      <td className="py-2.5 px-3">Used to fork public repositories, push branches, and create real Pull Requests on GitHub. If omitted, uses simulated PR fallback.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-charcoal font-medium">AUTONOMOUS_MODE</td>
                      <td className="py-2.5 px-3 text-charcoal-muted">No</td>
                      <td className="py-2.5 px-3 font-mono">false</td>
                      <td className="py-2.5 px-3">When false, stops at the Human Approval Gate for one-click review before opening PRs.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. GitHub Token & App Setup */}
            <section id="github-setup" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Authentication Guide</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Obtaining Your GitHub Token
                </h2>
              </div>

              <p className="text-sm font-sans text-charcoal-secondary leading-relaxed">
                To allow the agent to clone repos, fork public repositories to your account, and open Pull Requests on your behalf, generate a Personal Access Token (PAT):
              </p>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-charcoal-secondary">
                <div className="p-4 rounded-xl border border-beige bg-cream/30 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal">Recommended: Fine-grained Personal Access Token</h3>
                  <ol className="list-decimal list-inside space-y-1 text-charcoal-secondary pl-1">
                    <li>Navigate to GitHub: <strong>Settings &gt; Developer Settings &gt; Personal access tokens &gt; Fine-grained tokens</strong>.</li>
                    <li>Click <strong>Generate new token</strong>.</li>
                    <li>Under <strong>Repository access</strong>, select <em>All repositories</em> or select individual repositories you want the agent to manage.</li>
                    <li>Under <strong>Permissions</strong>, grant:
                      <ul className="list-disc list-inside pl-4 pt-1 space-y-0.5 text-xs text-charcoal">
                        <li><strong>Contents:</strong> Read and Write (to push fix branches)</li>
                        <li><strong>Pull requests:</strong> Read and Write (to open PRs)</li>
                        <li><strong>Issues:</strong> Read and Write (to inspect issue details)</li>
                      </ul>
                    </li>
                    <li>Copy the generated token string (starts with <code className="font-mono text-xs">github_pat_</code>) and paste into your <code className="font-mono text-xs">.env</code> as <code className="font-mono text-xs">GITHUB_TOKEN</code>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-beige bg-cream/30 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal">Alternative: Classic Token (Fastest)</h3>
                  <p className="text-xs text-charcoal-secondary leading-relaxed">
                    Create a classic token with the <code className="font-mono text-xs">repo</code> and <code className="font-mono text-xs">workflow</code> scopes enabled. Tokens start with <code className="font-mono text-xs">ghp_</code>.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Agent Architecture */}
            <section id="agent-workflow" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">State Machine Lifecycle</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  The 7-Stage Resolution Graph
                </h2>
              </div>

              <p className="text-sm font-sans text-charcoal-secondary leading-relaxed">
                The core execution engine is governed by a compiled <strong>LangGraph</strong> state graph. Every stage is sandboxed and emits audit logs:
              </p>

              {/* Step progression visual */}
              <div className="space-y-3 font-sans">
                {[
                  {
                    step: "01",
                    name: "Issue Detection & Ingestion",
                    desc: "Parses issue input from webhook or REST API, checks duplication, and establishes the unique job ID.",
                  },
                  {
                    step: "02",
                    name: "Issue Understanding & Triage",
                    desc: "Gemini classifies the issue category (Bug, Feature, Security), assesses actionability, and extracts core requirements.",
                  },
                  {
                    step: "03",
                    name: "Repository Analysis & AST Extraction",
                    desc: "Clones the public repo into an isolated workspace directory, analyzes file trees, AST symbols, and identifies test runners.",
                  },
                  {
                    step: "04",
                    name: "Root Cause Investigation",
                    desc: "Traces call paths, reviews candidate files, and isolates the culprit files and suspect functions causing the failure.",
                  },
                  {
                    step: "05",
                    name: "Code Patch Generation & Secret Scanning",
                    desc: "Produces minimal unified code diffs. Pre-commit secret scanning checks against AWS, GitHub, Google, and private key regexes.",
                  },
                  {
                    step: "06",
                    name: "Subprocess Test Execution",
                    desc: "Executes allowlisted test commands (pytest, npm test, etc.) in a scrubbed subprocess. If tests fail, it retries up to 3 times with feedback.",
                  },
                  {
                    step: "07",
                    name: "Human Approval Gate & PR Creation",
                    desc: "The agent pauses for review. Once approved, it forks the repository, creates a dedicated branch, commits changes, and opens a GitHub Pull Request.",
                  },
                ].map((st) => (
                  <div key={st.step} className="flex items-start space-x-4 p-4 rounded-xl border border-beige bg-cream/20">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-cream-soft border border-beige text-charcoal">
                      {st.step}
                    </span>
                    <div className="space-y-1">
                      <div className="font-serif text-sm font-medium text-charcoal">{st.name}</div>
                      <div className="text-xs text-charcoal-secondary leading-relaxed">{st.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Security & Sandbox */}
            <section id="security" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Security Model</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Sandboxing & Safety Guardrails
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs sm:text-sm">
                <div className="border border-beige rounded-xl p-5 bg-cream/20 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-sage" />
                    <span>Path Traversal Defense</span>
                  </h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    Every file operation resolves paths strictly against the job’s workspace directory. Traversal attacks (<code className="font-mono">../../etc/passwd</code>) raise immediate security exceptions.
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/20 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-terracotta" />
                    <span>Environment Scrubbing</span>
                  </h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    Subprocesses never inherit host environment variables containing <code className="font-mono">KEY</code>, <code className="font-mono">TOKEN</code>, or <code className="font-mono">SECRET</code>, preventing test suites from exfiltrating credentials.
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/20 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-charcoal" />
                    <span>Strict Command Allowlist</span>
                  </h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    Only authorized test runners (<code className="font-mono">pytest</code>, <code className="font-mono">npm test</code>, <code className="font-mono">cargo test</code>, <code className="font-mono">go test</code>) can execute. Shell chaining (<code className="font-mono">;&amp;&amp;|</code>) is blocked.
                  </p>
                </div>

                <div className="border border-beige rounded-xl p-5 bg-cream/20 space-y-2">
                  <h3 className="font-serif text-sm font-medium text-charcoal flex items-center space-x-2">
                    <GitPullRequest className="w-4 h-4 text-ochre" />
                    <span>Pre-Commit Secret Scanner</span>
                  </h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    All diffs are scanned before git commits. Any detected private keys, AWS tokens, or API credentials immediately abort the patch.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. Testing Engine */}
            <section id="testing-engine" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Execution Engine</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Test Runner & External Repositories
                </h2>
              </div>

              <p className="text-sm font-sans text-charcoal-secondary leading-relaxed">
                When working on arbitrary open-source repositories (such as <code className="font-mono text-xs bg-cream-soft px-1 rounded">ruvnet/RuView</code>), repos may contain custom coverage arguments in <code className="font-mono text-xs">pyproject.toml</code>:
              </p>

              <div className="p-4 rounded-xl bg-cream-soft border border-beige space-y-2 font-sans text-xs sm:text-sm">
                <div className="font-medium text-charcoal">Resilience Mechanisms:</div>
                <ul className="list-disc list-inside space-y-1.5 text-charcoal-secondary text-xs">
                  <li><strong>Coverage Fallback (<code className="font-mono">pytest -o addopts=</code>):</strong> If a repository’s pyproject flags fail due to missing coverage plugins, the agent automatically re-runs with clean test options.</li>
                  <li><strong>Limitation Disclosure:</strong> If a public repository requires heavy OS-level C-bindings or uninstalled dependencies, the agent does not abort with an unhandled exception. It tags the patch with a <em>Test Limitation Notice</em> and safely proceeds to the <strong>Human Approval Gate</strong> so engineers can review the diff.</li>
                </ul>
              </div>
            </section>

            {/* 8. REST API Reference */}
            <section id="api-reference" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Integration Reference</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  REST API Endpoints
                </h2>
              </div>

              <div className="space-y-4 font-sans text-xs">
                {[
                  { method: "GET", path: "/api/health", desc: "System health, version, active worker telemetry, and aggregate metrics." },
                  { method: "GET", path: "/api/jobs", desc: "List all resolution jobs with status filtering (QUEUED, INVESTIGATING, WAITING_FOR_APPROVAL, COMPLETED, FAILED)." },
                  { method: "POST", path: "/api/jobs", desc: "Start a resolution job for any GitHub repository URL and issue number." },
                  { method: "GET", path: "/api/jobs/{job_id}", desc: "Fetch complete state, logs, AST classification, diff, and test results for a specific job." },
                  { method: "POST", path: "/api/jobs/{job_id}/approve", desc: "Approve or reject a patch at the Human Approval Gate, triggering PR creation." },
                  { method: "GET", path: "/api/repositories", desc: "List all connected repositories and recent sync metrics." },
                  { method: "POST", path: "/api/repositories/connect", desc: "Connect a repository by URL or shorthand (e.g. facebook/react)." },
                  { method: "GET", path: "/api/pull-requests", desc: "List all Pull Requests opened by the agent across all repositories." },
                  { method: "POST", path: "/api/webhooks/github", desc: "GitHub Webhook ingestion endpoint supporting HMAC-SHA256 verification." },
                ].map((ep) => (
                  <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-beige bg-cream/20 gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${ep.method === "GET" ? "bg-sage-light text-sage border border-sage-border" : "bg-ochre-light text-ochre border border-ochre-border"
                        }`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-charcoal font-medium">{ep.path}</span>
                    </div>
                    <span className="text-charcoal-muted text-[11px] sm:text-xs">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 9. FAQ */}
            <section id="faq" className="bg-white border border-beige rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-sans text-charcoal-light uppercase tracking-wider font-semibold">Troubleshooting</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4 font-sans text-xs sm:text-sm">
                <div className="p-4 rounded-xl border border-beige bg-cream/20 space-y-1.5">
                  <h3 className="font-serif text-sm font-medium text-charcoal">Can I use this on private repositories?</h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    Yes. Supply a GitHub Personal Access Token that has read/write access to your private repository, or install the GitHub App onto your organization.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-beige bg-cream/20 space-y-1.5">
                  <h3 className="font-serif text-sm font-medium text-charcoal">Does the agent ever merge a Pull Request?</h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    <strong>Never.</strong> The system strictly adheres to the Zero Auto-Merge Policy. Even in autonomous mode, it creates and describes the PR, but merging requires your repository’s normal CI checks and human code review.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-beige bg-cream/20 space-y-1.5">
                  <h3 className="font-serif text-sm font-medium text-charcoal">What happens if tests fail during resolution?</h3>
                  <p className="text-charcoal-secondary leading-relaxed text-xs">
                    The agent captures stdout/stderr test failure output, feeds it back to the Gemini code generator, and generates a refined patch (up to 3 attempts).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-beige flex items-center justify-between">
                <span className="text-xs font-sans text-charcoal-muted">Ready to test the agent?</span>
                <Link
                  href="/dashboard?start=true"
                  className="btn-metallic px-5 py-2.5 rounded-xl font-sans font-medium text-xs sm:text-sm flex items-center space-x-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Now</span>
                </Link>
              </div>
            </section>
          </main>
        </div>

        {/* Footer */}
        <Footer className="mt-12" />
      </div>
    </>
  );
}


"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Key,
  ShieldCheck,
  X,
  Play,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { api, KeyConfigData } from "../services/api";

interface WebTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobStarted?: (jobId: string) => void;
  onKeysUpdated?: () => void;
}

interface TerminalLine {
  id: string;
  type: "system" | "prompt" | "input" | "success" | "error" | "info" | "highlight";
  content: string;
}

export const WebTerminal: React.FC<WebTerminalProps> = ({
  isOpen,
  onClose,
  onJobStarted,
  onKeysUpdated,
}) => {
  const [keyConfig, setKeyConfig] = useState<KeyConfigData | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isMasked, setIsMasked] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Configuration Wizard State: "idle" | "awaiting_gemini" | "awaiting_github"
  const [wizardStep, setWizardStep] = useState<
    "idle" | "awaiting_gemini" | "awaiting_github"
  >("idle");

  const [tempKeys, setTempKeys] = useState<{
    gemini?: string;
    github?: string;
  }>({});

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on output change
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Initial load: check configured keys
  useEffect(() => {
    loadKeyStatus(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const addLine = (type: TerminalLine["type"], content: string) => {
    setLines((prev) => [...prev, { id: Math.random().toString(), type, content }]);
  };

  const loadKeyStatus = async (initial = false) => {
    try {
      const res = await api.getKeysConfig();
      setKeyConfig(res);

      if (initial) {
        setLines([]);
        addLine("system", "=============================================================");
        addLine("system", "  ZORVEX — Interactive Web Terminal Console");
        addLine("system", "  Version 0.1.0 • Autonomous AI Engineering Engine");
        addLine("system", "=============================================================");

        if (!res.gemini_api_key_configured || !res.github_token_configured) {
          addLine("highlight", "👋 Welcome! To get started, we need your API credentials.");
          addLine("info", "The agent will guide you through 2 simple steps to configure them.");
          addLine("info", "");
          startWizard();
        } else {
          addLine("success", "=============================================================");
          addLine("success", "  ✓ CREDENTIALS ARE ACTIVE & READY");
          addLine("success", `  • GEMINI_API_KEY: Configured (${res.gemini_api_key_preview || "Active"})`);
          addLine("success", `  • GITHUB_TOKEN: Configured (${res.github_token_preview || "Active"})`);
          if (res.github_webhook_secret_configured) {
            addLine("success", `  • GITHUB_WEBHOOK_SECRET: Configured (${res.github_webhook_secret_preview})`);
          }
          addLine("success", "=============================================================");
          addLine("info", "👉 To re-enter or update keys, type 'configure' or click [Reset Keys].");
          addLine("info", "👉 Type 'help' for available commands, or close this sidebar to continue.");
        }
      }
    } catch {
      addLine("error", "[ERROR] Could not connect to backend configuration service at port 8000.");
    }
  };

  const startWizard = () => {
    setWizardStep("awaiting_gemini");
    setTempKeys({});
    addLine("highlight", "👉 STEP 1/2: Please enter your Google Gemini API Key");
    addLine("info", "   • Get a free key at: https://aistudio.google.com");
    addLine("info", "   • Key format: starts with 'AIzaSy...'");
    addLine("prompt", "Enter GEMINI_API_KEY below and press Enter:");
    setIsMasked(true);
  };

  const handleResetKeys = async () => {
    setIsLoading(true);
    addLine("system", "");
    addLine("system", "[RESETTING] Wiping stored credentials and clearing environment...");
    try {
      const res = await api.resetKeysConfig();
      setKeyConfig(res);
      addLine("success", "✓ All credentials have been cleared and reset successfully.");
      addLine("info", "");
      if (onKeysUpdated) onKeysUpdated();
      // Restart wizard immediately
      startWizard();
    } catch (e: any) {
      addLine("error", `[ERROR] Failed to reset keys: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed && wizardStep === "idle") return;

    // Record command history
    if (wizardStep === "idle" && trimmed) {
      setHistory((prev) => [...prev, trimmed]);
      setHistoryIdx(-1);
    }

    // Display user input line
    const displayVal =
      isMasked && wizardStep !== "idle" && trimmed
        ? "••••••••••••••••••••"
        : trimmed;
    addLine("input", `$ ${displayVal}`);

    // --- WIZARD STEP 1: GEMINI ---
    if (wizardStep === "awaiting_gemini") {
      if (!trimmed) {
        addLine("error", "⚠️ GEMINI_API_KEY cannot be empty! Please paste your Gemini API key:");
        return;
      }
      setTempKeys((prev) => ({ ...prev, gemini: trimmed }));
      setWizardStep("awaiting_github");
      addLine("success", `✓ GEMINI_API_KEY received (${trimmed.slice(0, 6)}••••${trimmed.slice(-4)})`);
      addLine("info", "");
      addLine("highlight", "👉 STEP 2/2: Please enter your GitHub Personal Access Token (PAT)");
      addLine("info", "   • Generate at: https://github.com/settings/tokens");
      addLine("info", "   • Permissions required: repo (or contents/pull-requests: read & write)");
      addLine("info", "   • Key format: starts with 'ghp_...' or 'github_pat_...'");
      addLine("prompt", "Enter GITHUB_TOKEN below and press Enter:");
      return;
    }

    // --- WIZARD STEP 2: GITHUB (FINAL STEP - SAVES IMMEDIATELY) ---
    if (wizardStep === "awaiting_github") {
      if (!trimmed) {
        addLine("error", "⚠️ GITHUB_TOKEN cannot be empty! Please paste your GitHub token:");
        return;
      }

      const finalGemini = tempKeys.gemini;
      const finalGithub = trimmed;

      setWizardStep("idle");
      setIsMasked(false);

      addLine("success", `✓ GITHUB_TOKEN received (${trimmed.slice(0, 6)}••••${trimmed.slice(-4)})`);
      addLine("info", "");
      addLine("info", "[SAVING] Persisting credentials to .env and reloading agents...");
      setIsLoading(true);

      try {
        const res = await api.saveKeysConfig({
          gemini_api_key: finalGemini,
          github_token: finalGithub,
        });

        setKeyConfig(res);
        addLine("success", "=============================================================");
        addLine("success", "  🎉 CONGRATULATIONS! ALL CREDENTIALS CONFIGURED!");
        addLine("success", "=============================================================");
        addLine("success", `  ✓ GEMINI_API_KEY: Saved & Verified (${res.gemini_api_key_preview || "Active"})`);
        addLine("success", `  ✓ GITHUB_TOKEN: Saved & Connected (${res.github_token_preview || "Active"})`);
        addLine("success", "  ✓ Gemini 2.5 Flash Client: Reloaded & Ready");
        addLine("success", "  ✓ PyGithub Client: Ready for forks & Pull Requests");
        addLine("success", "=============================================================");
        addLine("highlight", "🚀 You are all set! You can close this sidebar and start resolving issues.");
        addLine("info", "Tip: You can also run 'resolve <repo> <issue>' directly from this terminal.");

        if (onKeysUpdated) onKeysUpdated();
      } catch (e: any) {
        addLine("error", `[ERROR] Failed to save credentials: ${e.message || e}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- STANDARD COMMANDS ---
    const [cmd, ...args] = trimmed.split(" ");
    const lowerCmd = cmd.toLowerCase();

    switch (lowerCmd) {
      case "help":
        addLine("info", "Available Terminal Commands:");
        addLine("info", "  configure / set-keys    - Launch interactive credential wizard");
        addLine("info", "  status                  - Check active keys and backend health");
        addLine("info", "  reset                   - Clear all stored credentials");
        addLine("info", "  resolve <repo> <issue>  - Start issue resolution job (e.g. resolve ruvnet/RuView 55)");
        addLine("info", "  clear                   - Clear the terminal display");
        addLine("info", "  help                    - Show this command reference");
        break;

      case "clear":
        setLines([]);
        break;

      case "status":
        setIsLoading(true);
        try {
          const res = await api.getKeysConfig();
          setKeyConfig(res);
          addLine("info", "--- System Credentials Status ---");
          addLine(
            res.gemini_api_key_configured ? "success" : "error",
            `GEMINI_API_KEY: ${res.gemini_api_key_configured ? `Active (${res.gemini_api_key_preview})` : "MISSING (Required for LLM)"}`
          );
          addLine(
            res.github_token_configured ? "success" : "error",
            `GITHUB_TOKEN: ${res.github_token_configured ? `Active (${res.github_token_preview})` : "MISSING (Required for PRs)"}`
          );
          addLine(
            res.github_webhook_secret_configured ? "success" : "info",
            `GITHUB_WEBHOOK_SECRET: ${res.github_webhook_secret_configured ? `Active (${res.github_webhook_secret_preview})` : "Not configured (Optional)"}`
          );
        } catch (e: any) {
          addLine("error", `[ERROR] Could not query status: ${e.message || e}`);
        } finally {
          setIsLoading(false);
        }
        break;

      case "configure":
      case "set-keys":
      case "keys":
        startWizard();
        break;

      case "reset":
        await handleResetKeys();
        break;

      case "resolve":
      case "run":
        if (args.length < 2) {
          addLine("error", "Usage: resolve <owner/repo> <issue_number>");
          addLine("info", "Example: resolve ruvnet/RuView 55");
          return;
        }
        const repo = args[0];
        const issueNum = parseInt(args[1], 10);
        if (isNaN(issueNum)) {
          addLine("error", `Invalid issue number: ${args[1]}`);
          return;
        }

        setIsLoading(true);
        addLine("info", `[STARTING] Queueing autonomous job for ${repo}#${issueNum}...`);
        try {
          const res = await api.resolveIssue({
            repo_url: repo,
            issue_number: issueNum,
          });
          addLine("success", `[SUCCESS] Job initialized: ${res.job_id}`);
          addLine("info", `[PIPELINE] Tracing root cause, tests, and patch in background...`);
          if (onJobStarted) onJobStarted(res.job_id);
        } catch (e: any) {
          addLine("error", `[ERROR] Could not start resolution job: ${e.message || e}`);
        } finally {
          setIsLoading(false);
        }
        break;

      default:
        addLine("error", `Command not recognized: '${trimmed}'. Type 'help' for available commands.`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = inputValue;
      setInputValue("");
      handleCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputValue(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInputValue("");
        } else {
          setHistoryIdx(nextIdx);
          setInputValue(history[nextIdx]);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Sidebar Drawer */}
      <aside className="fixed inset-y-0 right-0 w-full sm:w-[560px] md:w-[620px] bg-[#141413] border-l border-[#2D2D2A] shadow-2xl z-50 flex flex-col font-mono text-xs text-[#FAF9F5] animate-slide-in-right">
        {/* Top Header Window Bar */}
        <div className="bg-[#1C1B1A] border-b border-[#2D2D2A] px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Left: Window Dots & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#B91C1C] inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#B45309] inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#2E7D5B] inline-block"></span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-sans">
              <TerminalIcon className="w-4 h-4 text-cream-muted" />
              <span className="font-medium text-cream">Terminal &amp; Key Manager</span>
            </div>
          </div>

          {/* Right Actions: Status, Reset, Mask, Close */}
          <div className="flex items-center space-x-2 font-sans text-xs">
            {/* Status Pill */}
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#222220] border border-[#3A3935] text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${keyConfig?.gemini_api_key_configured && keyConfig?.github_token_configured
                  ? "bg-sage animate-pulse"
                  : "bg-ochre animate-pulse"
                  }`}
              ></span>
              <span className="text-[#C5C3BB]">
                {keyConfig?.gemini_api_key_configured && keyConfig?.github_token_configured
                  ? "Keys Active"
                  : "Setup Required"}
              </span>
            </div>

            {/* Reset Keys Button (Explicitly requested by user) */}
            <button
              onClick={handleResetKeys}
              disabled={isLoading}
              title="Clear all credentials and re-enter"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-[#3A3935] hover:border-rust/60 bg-[#222220] hover:bg-rust/20 text-[#E8E6DC] hover:text-rust text-[11px] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Keys</span>
            </button>

            {/* Mask Toggle */}
            <button
              onClick={() => setIsMasked(!isMasked)}
              title={isMasked ? "Show characters" : "Mask input"}
              className="p-1 rounded-lg border border-[#3A3935] hover:bg-[#2A2A28] text-cream-muted hover:text-cream transition-colors cursor-pointer"
            >
              {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-ochre" />}
            </button>

            {/* Close Sidebar Button */}
            <button
              onClick={onClose}
              title="Close terminal (Esc)"
              className="p-1 rounded-lg border border-[#3A3935] hover:bg-[#2A2A28] text-cream-muted hover:text-cream transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Screen Output */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-5 overflow-y-auto space-y-2 cursor-text bg-[#141413] font-mono text-xs"
        >
          {lines.map((line) => {
            let color = "text-[#E8E6DC]";
            if (line.type === "system") color = "text-[#8F8D84]";
            if (line.type === "prompt") color = "text-ochre font-semibold";
            if (line.type === "input") color = "text-[#FAF9F5] font-bold";
            if (line.type === "success") color = "text-sage font-medium";
            if (line.type === "error") color = "text-rust font-medium";
            if (line.type === "info") color = "text-[#B8B6AD]";
            if (line.type === "highlight") color = "text-cream font-medium bg-[#1F1E1D] p-1.5 rounded border border-[#33322E]";

            return (
              <div key={line.id} className={`${color} leading-relaxed break-all whitespace-pre-wrap`}>
                {line.content}
              </div>
            );
          })}

          {/* Active Command Input Line */}
          <div className="flex items-center space-x-2 pt-2 text-xs font-mono">
            <span className="text-sage select-none font-bold">❯</span>
            <input
              ref={inputRef}
              type={isMasked && wizardStep !== "idle" ? "password" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                wizardStep === "awaiting_gemini"
                  ? "Paste your GEMINI_API_KEY here and press Enter..."
                  : wizardStep === "awaiting_github"
                    ? "Paste your GITHUB_TOKEN here and press Enter..."
                    : "Type command (e.g. 'status', 'configure', 'help')..."
              }
              className="flex-1 bg-transparent text-[#FAF9F5] outline-none placeholder-[#636159] text-xs font-mono"
              autoFocus
            />
          </div>
          <div ref={terminalEndRef} />
        </div>

        {/* Bottom Quick Actions Toolbar */}
        <div className="border-t border-[#2D2D2A] bg-[#191918] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8F8D84] font-sans flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCommand("configure")}
              className="px-2 py-1 rounded bg-[#222220] hover:bg-[#2D2D2A] text-cream-muted hover:text-cream border border-[#3A3935] transition-colors"
            >
              Configure Keys
            </button>
            <button
              onClick={() => handleCommand("status")}
              className="px-2 py-1 rounded bg-[#222220] hover:bg-[#2D2D2A] text-cream-muted hover:text-cream border border-[#3A3935] transition-colors"
            >
              Check Status
            </button>
            <button
              onClick={() => handleCommand("clear")}
              className="px-2 py-1 rounded bg-[#222220] hover:bg-[#2D2D2A] text-cream-muted hover:text-cream border border-[#3A3935] transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-cream-muted">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-[#2D2D2A] text-[10px]">Enter ↵</kbd> to submit</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[#2D2D2A] text-[10px]">Esc</kbd> to close</span>
          </div>
        </div>
      </aside>
    </>
  );
};

"use client";
import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { api } from "../services/api";

interface IssueSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
}

export const IssueSubmissionModal: React.FC<IssueSubmissionModalProps> = ({
  isOpen,
  onClose,
  onJobStarted,
}) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [issueNumber, setIssueNumber] = useState<string>("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL, shorthand (owner/repo), or issue link.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await api.analyzeIssue({
        repo_url: repoUrl.trim(),
        issue_number: issueNumber ? parseInt(issueNumber, 10) : undefined,
        issue_title: issueTitle.trim() || undefined,
        issue_body: issueBody.trim() || undefined,
      });
      setAnalysisResult(res);
      if (res.detection?.title && !issueTitle) {
        setIssueTitle(res.detection.title);
      }
      if (res.detection?.body && !issueBody) {
        setIssueBody(res.detection.body);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze issue.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setError("Repository identifier is required.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.resolveIssue({
        repo_url: repoUrl.trim(),
        issue_number: issueNumber ? parseInt(issueNumber, 10) : undefined,
        issue_title: issueTitle.trim() || undefined,
        issue_body: issueBody.trim() || undefined,
        auto_approve: autoApprove,
      });
      onClose();
      onJobStarted(res.job_id);
    } catch (err: any) {
      setError(err.message || "Failed to start resolution job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-beige rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-beige flex items-center justify-between bg-cream-soft/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg btn-metallic flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cream" />
            </div>
            <h2 className="font-serif text-xl font-medium text-charcoal">
              Submit GitHub Issue
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-muted hover:text-charcoal p-1.5 rounded-lg hover:bg-cream-soft transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleResolve} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rust-light border border-rust-border text-rust text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
              Public Repository / Issue URL <span className="text-charcoal">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. pallets/flask, https://github.com/owner/repo/issues/123"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cream-soft/30 border border-beige text-charcoal placeholder-charcoal-light text-xs font-sans focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Issue # (Optional)
              </label>
              <input
                type="number"
                placeholder="42"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream-soft/30 border border-beige text-charcoal placeholder-charcoal-light text-xs font-sans focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Issue Title (Optional Fallback)
              </label>
              <input
                type="text"
                placeholder="Brief description of the problem"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream-soft/30 border border-beige text-charcoal placeholder-charcoal-light text-xs font-sans focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
              Issue Body / Reproduction Context
            </label>
            <textarea
              rows={3}
              placeholder="Paste error logs, reproduction steps, or expected vs actual behavior..."
              value={issueBody}
              onChange={(e) => setIssueBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cream-soft/30 border border-beige text-charcoal placeholder-charcoal-light text-xs font-sans focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition resize-none"
            />
          </div>

          {/* AI Pre-Flight Triage Card */}
          {analysisResult && (
            <div className="p-4 rounded-xl bg-cream-soft border border-beige space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-charcoal uppercase tracking-wider">
                  AI Pre-Flight Triage
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-beige text-charcoal-secondary font-medium">
                  {analysisResult.classification?.category}
                </span>
              </div>
              <p className="text-xs text-charcoal-secondary font-sans leading-relaxed">
                {analysisResult.classification?.summary}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-sans text-charcoal-muted pt-1">
                <span>Severity: <strong className="text-charcoal font-medium">{analysisResult.classification?.severity}</strong></span>
                <span>Priority: <strong className="text-charcoal font-medium">{analysisResult.classification?.priority}</strong></span>
                <span>Actionable: <strong className="text-sage font-medium">{analysisResult.classification?.actionable ? "Yes" : "Needs info"}</strong></span>
              </div>
            </div>
          )}

          {/* Autonomous PR Mode Option */}
          <div className="flex items-center space-x-2.5 pt-2">
            <input
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="w-4 h-4 rounded border-beige text-charcoal focus:ring-charcoal"
            />
            <label htmlFor="autoApprove" className="text-xs font-sans text-charcoal-secondary cursor-pointer">
              Autonomous PR Mode (Open Pull Request immediately upon test passage without pausing for human approval)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-beige">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || loading}
              className="px-4 py-2 rounded-xl border border-beige hover:border-beige-strong bg-white hover:bg-cream-soft text-charcoal text-xs font-sans font-medium transition flex items-center space-x-1.5 shadow-subtle cursor-pointer"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-charcoal-muted" />}
              <span>Pre-Flight Triage</span>
            </button>
            <button
              type="submit"
              disabled={loading || analyzing}
              className="btn-metallic px-5 py-2.5 rounded-xl text-xs font-sans font-medium flex items-center space-x-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Start Autonomous Fix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

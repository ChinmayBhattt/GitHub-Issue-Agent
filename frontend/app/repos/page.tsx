"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ConnectedRepo } from "@/services/api";
import { FolderGit2, Link as LinkIcon, PlusCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ReposPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRepos = async () => {
    try {
      const data = await api.getRepositories();
      setRepos(data);
    } catch {
      // Graceful
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await api.connectRepository(repoUrl.trim());
      setMsg({ type: "success", text: res.message });
      setRepoUrl("");
      loadRepos();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to connect repository" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl text-charcoal font-normal tracking-tight">
            Connected Repositories
          </h1>
          <p className="text-sm font-sans text-charcoal-secondary">
            Connect public GitHub repositories to monitor issues, test resolutions, or configure incoming webhook triggers.
          </p>
        </div>

        {/* Connect Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-beige shadow-subtle space-y-4 max-w-2xl">
          <h2 className="font-serif text-lg font-medium text-charcoal flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-terracotta" />
            <span>Connect a Public GitHub Repository</span>
          </h2>

          <form onSubmit={handleConnect} className="space-y-3.5">
            <div>
              <input
                type="text"
                placeholder="e.g. pallets/flask or https://github.com/fastapi/fastapi"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream-soft/30 border border-beige text-charcoal placeholder-charcoal-light text-xs font-sans focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/20 transition"
                required
              />
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-sans flex items-center space-x-2 ${
                  msg.type === "success"
                    ? "bg-sage-light border border-sage-border text-sage"
                    : "bg-rust-light border border-rust-border text-rust"
                }`}
              >
                {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{msg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-metallic px-5 py-2.5 rounded-xl text-xs font-sans font-medium flex items-center space-x-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>Connect Repository</span>
            </button>
          </form>
        </div>

        {/* Repositories List */}
        <div className="bg-white border border-beige rounded-xl overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-beige flex items-center justify-between bg-cream-soft/40">
            <span className="font-serif text-sm font-medium text-charcoal">
              Active Repositories ({repos.length})
            </span>
          </div>

          <div className="divide-y divide-beige-subtle">
            {loading ? (
              <div className="p-10 text-center font-serif italic text-charcoal-muted text-xs">Loading repositories...</div>
            ) : repos.length === 0 ? (
              <div className="p-10 text-center font-serif italic text-charcoal-muted text-xs">
                No repositories connected yet. Use the form above to connect any public repository.
              </div>
            ) : (
              repos.map((r, i) => (
                <div key={i} className="p-4 sm:p-5 hover:bg-cream-soft/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2 rounded-lg bg-cream-soft border border-beige text-charcoal">
                      <FolderGit2 className="w-4 h-4 text-terracotta" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-medium text-charcoal">{r.owner}/{r.name}</h4>
                      <a
                        href={r.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-sans text-charcoal-muted hover:text-terracotta transition"
                      >
                        {r.repo_url}
                      </a>
                    </div>
                  </div>
                  <span className="text-xs font-sans text-charcoal-light">
                    Connected: {new Date(r.connected_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Webhook Guide Card */}
        <div className="p-6 rounded-2xl bg-cream-soft border border-beige shadow-subtle text-xs font-sans text-charcoal-secondary space-y-2.5">
          <h3 className="font-serif text-base font-medium text-charcoal">GitHub Webhook Integration</h3>
          <p className="leading-relaxed">
            To receive automatic triggers whenever issues are opened or reopened in your repository, register a Webhook under your GitHub Repository Settings:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-charcoal-muted pl-1">
            <li>Payload URL: <code className="text-charcoal bg-white px-2 py-0.5 rounded border border-beige font-mono">https://your-domain/webhooks/github</code></li>
            <li>Content type: <code className="text-charcoal bg-white px-2 py-0.5 rounded border border-beige font-mono">application/json</code></li>
            <li>Secret: Match value configured in <code className="text-charcoal bg-white px-2 py-0.5 rounded border border-beige font-mono">GITHUB_WEBHOOK_SECRET</code></li>
            <li>Events: Select &quot;Issues&quot;</li>
          </ul>
        </div>
      </main>
      <Footer className="mt-12" />
    </>
  );
}

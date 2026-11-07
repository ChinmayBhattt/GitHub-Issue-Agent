"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, PullRequest } from "@/services/api";
import { ExternalLink, GitBranch, GitPullRequest, ShieldAlert } from "lucide-react";

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPullRequests()
      .then(setPrs)
      .catch(() => setPrs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl text-charcoal font-normal tracking-tight">
            Pull Requests Created
          </h1>
          <p className="text-sm font-sans text-charcoal-secondary">
            All pull requests opened by the Autonomous Agent across monitored GitHub repositories.
          </p>
        </div>

        {/* Policy Alert Banner */}
        <div className="p-5 rounded-2xl bg-cream-soft border border-beige shadow-subtle text-xs font-sans text-charcoal-secondary flex items-start space-x-3.5">
          <ShieldAlert className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-medium text-charcoal block">Safety & Merge Policy</span>
            <p className="leading-relaxed text-charcoal-muted">
              The agent never merges pull requests automatically. All generated branches require human review, continuous integration verification, and manual approval workflows on GitHub.
            </p>
          </div>
        </div>

        {/* PR List Table */}
        <div className="bg-white border border-beige rounded-xl overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-beige flex items-center justify-between bg-cream-soft/40">
            <span className="font-serif text-sm font-medium text-charcoal">
              Generated Pull Requests ({prs.length})
            </span>
          </div>

          <div className="divide-y divide-beige-subtle">
            {loading ? (
              <div className="p-10 text-center font-serif italic text-charcoal-muted text-xs">Loading pull requests...</div>
            ) : prs.length === 0 ? (
              <div className="p-10 text-center font-serif italic text-charcoal-muted text-xs">
                No pull requests created yet. Run an issue resolution job to generate a fix and open a PR!
              </div>
            ) : (
              prs.map((pr, i) => (
                <div key={i} className="p-4 sm:p-5 hover:bg-cream-soft/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <GitPullRequest className="w-4 h-4 text-purple-700" />
                      <span className="font-serif text-base font-medium text-charcoal">
                        {pr.owner}/{pr.repo}
                      </span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-cream-soft text-charcoal border border-beige">
                        #{pr.pr_number}
                      </span>
                      {pr.simulated && (
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-ochre-light text-ochre border border-ochre-border font-medium">
                          Dry-Run Simulation
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-sans font-medium text-charcoal-secondary">{pr.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-charcoal-muted pt-0.5">
                      <span className="flex items-center space-x-1">
                        <GitBranch className="w-3.5 h-3.5 text-charcoal-light" />
                        <code className="text-charcoal-secondary font-mono">{pr.head_branch}</code> → <code className="font-mono">{pr.base_branch}</code>
                      </span>
                      <span>Ref Issue: <strong className="text-charcoal font-medium">#{pr.issue_number}</strong></span>
                      <span className="text-charcoal-light">
                        Created: {new Date(pr.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end sm:self-center">
                    <Link
                      href={`/jobs/${pr.job_id}`}
                      className="px-3.5 py-1.5 rounded-xl border border-beige hover:border-beige-strong bg-cream-soft/60 hover:bg-cream-soft text-xs font-sans font-medium text-charcoal transition shadow-subtle"
                    >
                      Job Logs
                    </Link>
                    <a
                      href={pr.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-metallic px-4 py-1.5 rounded-xl text-xs font-sans font-medium flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cream-soft" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer className="mt-12" />
    </>
  );
}

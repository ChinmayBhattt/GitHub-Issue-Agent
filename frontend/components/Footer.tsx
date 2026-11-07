"use client";
import React from "react";
import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";

export function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface FooterProps {
  showNav?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ showNav = true, className = "" }) => {
  return (
    <footer className={`border-t border-beige py-10 bg-cream text-xs font-sans text-charcoal-muted ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="w-5 h-5 rounded-md btn-metallic flex items-center justify-center text-cream">
                <Sparkles className="w-3 h-3 text-cream" />
              </span>
              <span className="font-serif text-charcoal font-medium text-base tracking-tight">
                ZORVEX
              </span>
              <span className="text-[10px] uppercase tracking-wider text-charcoal-muted px-1.5 py-0.5 rounded bg-cream-soft border border-beige">
                Autonomous
              </span>
            </div>
            <p className="text-xs text-charcoal-light max-w-md">
              Autonomous AI engineering platform powered by Google Gemini 2.5 Flash &amp; LangGraph. Strictly never auto-merges Pull Requests.
            </p>
          </div>

          {showNav && (
            <div className="flex items-center space-x-5 text-xs text-charcoal-secondary">
              <Link href="/dashboard" className="hover:text-charcoal transition-colors">
                Dashboard
              </Link>
              <span>•</span>
              <Link href="/docs" className="hover:text-charcoal transition-colors">
                Documentation
              </Link>
              <span>•</span>
              <Link href="/repos" className="hover:text-charcoal transition-colors">
                Repositories
              </Link>
              <span>•</span>
              <Link href="/pull-requests" className="hover:text-charcoal transition-colors">
                Pull Requests
              </Link>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-beige/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-charcoal-light text-[11px]">
            © {new Date().getFullYear()} ZORVEX • Deterministic multi-agent issue resolution
          </p>

          <div className="flex items-center space-x-2 text-charcoal-secondary">
            <span className="text-[11px]">Made by</span>
            <a
              href="https://github.com/ChinmayBhattt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cream-soft border border-beige hover:border-charcoal/40 text-charcoal font-medium text-xs shadow-xs hover:shadow transition-all group"
            >
              <GithubIcon className="w-3.5 h-3.5 text-charcoal group-hover:scale-110 transition-transform" />
              <span>Chinmay Bhatt</span>
              <ExternalLink className="w-3 h-3 text-charcoal-light group-hover:text-charcoal" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


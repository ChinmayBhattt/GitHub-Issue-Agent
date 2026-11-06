"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitPullRequest, FolderGit2, Activity, PlusCircle, Sparkles } from "lucide-react";
import { api, HealthData } from "../services/api";

interface NavbarProps {
  onOpenNewIssue?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewIssue }) => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/repos", label: "Repositories", icon: FolderGit2 },
    { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  ];

  return (
    <header className="border-b border-beige bg-cream/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center space-x-8 sm:space-x-10">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg btn-metallic flex items-center justify-center text-[#FAF9F5] shadow-sm">
              <Sparkles className="w-4 h-4 text-cream" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif text-xl font-medium tracking-tight text-charcoal">
                GitHub Issue Agent
              </span>
              <span className="hidden sm:inline-block text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-cream-soft text-charcoal-muted border border-beige">
                Autonomous
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-sans">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 py-1 transition-colors ${
                    isActive
                      ? "text-charcoal font-medium"
                      : "text-charcoal-muted hover:text-charcoal"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-charcoal" : "text-charcoal-light"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3.5">
          {health ? (
            <div className="hidden sm:flex items-center space-x-2 text-xs font-sans px-2.5 py-1 rounded-full bg-sage-light border border-sage-border text-sage">
              <span className="w-1.5 h-1.5 rounded-full bg-sage"></span>
              <span>Online • v{health.version}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 text-xs font-sans px-2.5 py-1 rounded-full bg-ochre-light border border-ochre-border text-ochre">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre animate-pulse"></span>
              <span>Connecting...</span>
            </div>
          )}

          {onOpenNewIssue && (
            <button
              onClick={onOpenNewIssue}
              className="btn-metallic flex items-center space-x-1.5 text-xs font-sans font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Issue</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

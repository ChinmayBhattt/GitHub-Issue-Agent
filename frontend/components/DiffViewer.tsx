"use client";
import React, { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";

interface DiffViewerProps {
  diff: string;
  modifiedFiles?: string[];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, modifiedFiles }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!diff || !diff.trim()) {
    return (
      <div className="p-10 text-center text-xs font-serif italic text-charcoal-muted bg-white border border-beige rounded-xl shadow-subtle">
        No code changes generated yet.
      </div>
    );
  }

  const lines = diff.split("\n");

  return (
    <div className="bg-white border border-beige rounded-xl overflow-hidden shadow-subtle">
      {/* Header */}
      <div className="px-4 py-3 bg-cream-soft/60 border-b border-beige flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileCode2 className="w-4 h-4 text-terracotta" />
          <span className="font-serif text-sm font-medium text-charcoal">
            Unified Git Diff
          </span>
          {modifiedFiles && modifiedFiles.length > 0 && (
            <span className="text-xs text-charcoal-muted font-mono">
              ({modifiedFiles.join(", ")})
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs font-sans text-charcoal-secondary hover:text-charcoal px-3 py-1 rounded-lg border border-beige hover:border-beige-strong bg-white transition shadow-subtle cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5 text-charcoal-muted" />}
          <span>{copied ? "Copied" : "Copy Diff"}</span>
        </button>
      </div>

      {/* Code diff lines */}
      <div className="p-3.5 overflow-x-auto font-mono text-xs leading-5 select-text max-h-[500px] bg-[#FAF8F5]">
        {lines.map((line, idx) => {
          let lineClass = "text-charcoal-secondary";
          let bgClass = "";

          if (line.startsWith("+++") || line.startsWith("---")) {
            lineClass = "text-ochre font-semibold";
            bgClass = "bg-ochre-light/70";
          } else if (line.startsWith("+")) {
            lineClass = "text-[#1E6144]";
            bgClass = "bg-[#EAF5EF]";
          } else if (line.startsWith("-")) {
            lineClass = "text-[#A63C25]";
            bgClass = "bg-[#FDF0ED]";
          } else if (line.startsWith("@@")) {
            lineClass = "text-charcoal-muted font-medium";
            bgClass = "bg-beige-subtle/80";
          } else if (line.startsWith("diff --git")) {
            lineClass = "text-charcoal font-semibold";
            bgClass = "bg-cream-soft mt-2";
          }

          return (
            <div key={idx} className={`px-2 py-0.5 rounded-sm whitespace-pre ${lineClass} ${bgClass}`}>
              {line || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};

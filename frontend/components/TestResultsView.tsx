"use client";
import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TestResultsViewProps {
  testResults?: {
    passed: boolean;
    command: string;
    returncode: number;
    stdout: string;
    stderr: string;
    execution_time_s: number;
    cannot_run_tests?: boolean;
    limitation_disclosure?: string;
  };
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({ testResults }) => {
  const [tab, setTab] = useState<"stdout" | "stderr">("stdout");

  if (!testResults) {
    return (
      <div className="p-10 text-center text-xs font-serif italic text-charcoal-muted bg-white border border-beige rounded-xl shadow-subtle">
        Tests have not been executed yet.
      </div>
    );
  }

  const { passed, command, returncode, stdout, stderr, execution_time_s, limitation_disclosure } = testResults;

  return (
    <div className="bg-white border border-beige rounded-xl overflow-hidden shadow-subtle space-y-4 p-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-beige">
        <div className="flex items-center space-x-3">
          {passed ? (
            <div className="p-2 rounded-lg bg-sage-light text-sage border border-sage-border">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : limitation_disclosure ? (
            <div className="p-2 rounded-lg bg-ochre-light text-ochre border border-ochre-border">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-rust-light text-rust border border-rust-border">
              <XCircle className="w-5 h-5" />
            </div>
          )}

          <div>
            <h4 className="font-serif text-base font-medium text-charcoal">
              {passed
                ? "All Verification Tests Passed"
                : limitation_disclosure
                ? "Test Suite Limitation Noted"
                : "Test Suite Failed"}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-charcoal-muted pt-0.5">
              <span>Command: <code className="text-charcoal font-mono bg-cream-soft px-1.5 py-0.5 rounded border border-beige">{command}</code></span>
              <span>Exit Code: <strong className={passed ? "text-sage" : "text-rust"}>{returncode}</strong></span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-charcoal-light" />
                <span>{execution_time_s}s</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex space-x-1 bg-cream-soft p-1 rounded-lg border border-beige self-start sm:self-auto">
          <button
            onClick={() => setTab("stdout")}
            className={`px-3 py-1 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
              tab === "stdout" ? "bg-white text-charcoal shadow-subtle border border-beige/60" : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            stdout
          </button>
          <button
            onClick={() => setTab("stderr")}
            className={`px-3 py-1 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
              tab === "stderr" ? "bg-white text-charcoal shadow-subtle border border-beige/60" : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            stderr
          </button>
        </div>
      </div>

      {limitation_disclosure && (
        <div className="p-3.5 rounded-xl bg-ochre-light border border-ochre-border text-xs font-sans text-ochre flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{limitation_disclosure}</span>
        </div>
      )}

      {/* Terminal Output Display */}
      <div className="bg-[#181817] p-3.5 rounded-xl border border-beige-strong font-mono text-xs overflow-x-auto max-h-[300px]">
        {tab === "stdout" ? (
          <pre className="text-[#D8D6CD] whitespace-pre-wrap">{stdout || "No stdout output produced."}</pre>
        ) : (
          <pre className="text-[#E06C60] whitespace-pre-wrap">{stderr || "No stderr output produced."}</pre>
        )}
      </div>
    </div>
  );
};

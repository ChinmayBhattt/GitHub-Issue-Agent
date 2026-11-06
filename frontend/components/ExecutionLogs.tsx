"use client";
import React, { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { LogEntry } from "../services/api";

interface ExecutionLogsProps {
  logs: LogEntry[];
}

export const ExecutionLogs: React.FC<ExecutionLogsProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getAgentBadge = (agent: string) => {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-[#F5F3EC] border border-white/15">
        {agent}
      </span>
    );
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "SUCCESS":
        return "text-[#5CB887]";
      case "WARNING":
        return "text-[#E6A15C]";
      case "ERROR":
        return "text-[#E06C60]";
      default:
        return "text-[#D8D6CD]";
    }
  };

  return (
    <div className="bg-[#181817] border border-beige-strong rounded-xl overflow-hidden shadow-card flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#20201E] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-terracotta" />
          <span className="font-serif text-sm font-medium text-[#FAF9F5]">
            Agent Execution Stream
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#D8D6CD] font-mono text-[10px]">
            {logs.length} events
          </span>
        </div>
      </div>

      {/* Logs stream */}
      <div className="p-4 overflow-y-auto font-mono text-xs leading-6 space-y-2 flex-1 bg-[#141413]">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-[#8F8D84] font-serif italic">
            Waiting for agent execution logs...
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2.5">
              <span className="text-[#636159] text-[10px] select-none pt-0.5">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="flex-shrink-0">{getAgentBadge(log.agent)}</div>
              <p className={`flex-1 break-words ${getLevelColor(log.level)}`}>
                {log.message}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

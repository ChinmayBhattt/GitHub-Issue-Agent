import React from "react";
import { CheckCircle2, Clock, GitPullRequest, ListTodo, XCircle } from "lucide-react";
import { DashboardStats } from "../services/api";

interface StatsOverviewProps {
  stats: DashboardStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const cards = [
    {
      title: "Total Processed",
      value: stats.total_issues_processed,
      icon: ListTodo,
      color: "text-charcoal",
      bg: "bg-cream-soft",
    },
    {
      title: "Under Investigation",
      value: stats.under_investigation,
      icon: Clock,
      color: "text-charcoal-secondary",
      bg: "bg-cream-soft",
    },
    {
      title: "Successful Fixes",
      value: stats.successful_fixes,
      icon: CheckCircle2,
      color: "text-sage",
      bg: "bg-sage-light",
    },
    {
      title: "Failed Executions",
      value: stats.failed_executions,
      icon: XCircle,
      color: "text-rust",
      bg: "bg-rust-light",
    },
    {
      title: "Pull Requests",
      value: stats.pull_requests_created,
      icon: GitPullRequest,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-xl bg-white border border-beige hover:border-beige-strong shadow-subtle transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-medium text-charcoal-muted tracking-wide">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl font-medium text-charcoal tracking-tight">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

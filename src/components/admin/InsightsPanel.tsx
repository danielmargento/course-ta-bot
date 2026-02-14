"use client";

import { UsageInsight } from "@/lib/types";

interface Props {
  insights: UsageInsight | null;
}

export default function InsightsPanel({ insights }: Props) {
  if (!insights) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">No usage data yet.</p>
        <p className="text-muted/60 text-xs mt-1">
          Insights will appear once students start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Usage Insights</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-lg p-4">
          <p className="text-xs text-muted">Total Sessions</p>
          <p className="text-2xl font-bold text-foreground">{insights.total_sessions}</p>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <p className="text-xs text-muted">Total Messages</p>
          <p className="text-2xl font-bold text-foreground">{insights.total_messages}</p>
        </div>
      </div>
      {insights.top_topics.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted mb-2">Top Topics</h4>
          <ul className="text-sm space-y-1">
            {insights.top_topics.map((t) => (
              <li key={t.topic} className="flex justify-between text-foreground">
                <span>{t.topic}</span>
                <span className="text-muted">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

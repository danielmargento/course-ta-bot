"use client";

import { UsageInsight } from "@/lib/types";

interface Props {
  insights: UsageInsight | null;
}

const DONUT_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe",
  "#818cf8", "#7c3aed", "#9333ea", "#a855f7", "#c084fc",
];

const BAR_COLOR = "#6366f1";

function DonutChart({ topics }: { topics: { topic: string; count: number }[] }) {
  const total = topics.reduce((s, t) => s + t.count, 0);
  if (total === 0) return null;

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const innerRadius = 35;

  let cumulative = 0;
  const slices = topics.map((t, i) => {
    const fraction = t.count / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = fraction > 0.5 ? 1 : 0;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    return (
      <path key={i} d={d} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
    );
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {topics.length === 1 ? (
          <>
            <circle cx={cx} cy={cy} r={radius} fill={DONUT_COLORS[0]} />
            <circle cx={cx} cy={cy} r={innerRadius} fill="var(--color-background)" />
          </>
        ) : (
          slices
        )}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {topics.slice(0, 6).map((t, i) => (
          <div key={t.topic} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="truncate max-w-[80px]">{t.topic}</span>
            <span className="text-muted/60">{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ assignments }: { assignments: { title: string; count: number }[] }) {
  if (assignments.length === 0) return null;

  const maxCount = Math.max(...assignments.map((a) => a.count));
  const barHeight = 24;
  const gap = 8;
  const labelWidth = 120;
  const chartWidth = 300;
  const totalWidth = labelWidth + chartWidth + 40;
  const totalHeight = assignments.length * (barHeight + gap) - gap;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="overflow-visible"
    >
      {assignments.map((a, i) => {
        const y = i * (barHeight + gap);
        const barW = maxCount > 0 ? (a.count / maxCount) * chartWidth : 0;
        return (
          <g key={a.title + i}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-muted text-[11px]"
            >
              {a.title.length > 18 ? a.title.slice(0, 18) + "..." : a.title}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={BAR_COLOR}
            />
            <text
              x={labelWidth + barW + 6}
              y={y + barHeight / 2}
              dominantBaseline="central"
              className="fill-muted text-[11px]"
            >
              {a.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
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

  const totalTopicQuestions = insights.top_topics.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-foreground">Usage Insights</h3>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions", value: insights.total_sessions },
          { label: "Total Messages", value: insights.total_messages },
          { label: "Avg Msgs / Session", value: insights.avg_messages_per_session },
          { label: "Active Topics", value: insights.top_topics.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-background border border-border rounded-lg p-4"
          >
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {(insights.top_topics.length > 0 || insights.top_assignments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.top_topics.length > 0 && (
            <div className="bg-background border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted mb-3">Top Topics</h4>
              <DonutChart topics={insights.top_topics} />
            </div>
          )}
          {insights.top_assignments.length > 0 && (
            <div className="bg-background border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted mb-3">Messages by Assignment</h4>
              <BarChart assignments={insights.top_assignments} />
            </div>
          )}
        </div>
      )}

      {/* Topic Breakdown Table */}
      {insights.top_topics.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-muted mb-3">Topic Breakdown</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="pb-2 font-medium">Topic</th>
                <th className="pb-2 font-medium text-right">Questions</th>
                <th className="pb-2 font-medium text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {insights.top_topics.map((t) => (
                <tr key={t.topic} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-foreground capitalize">{t.topic}</td>
                  <td className="py-2 text-muted text-right">{t.count}</td>
                  <td className="py-2 text-muted text-right">
                    {totalTopicQuestions > 0
                      ? Math.round((t.count / totalTopicQuestions) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

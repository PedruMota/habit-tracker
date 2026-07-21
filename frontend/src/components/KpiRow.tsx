import { StatTile } from "./ui";
import type { GlobalMetrics } from "../lib/stats";

export function KpiRow({ metrics }: { metrics: GlobalMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Success Rate"
        value={`${(metrics.successRate * 100).toFixed(1)}%`}
        secondary={`Hit: ${metrics.successCount} | Miss: ${metrics.failureCount}`}
        help="(Hits) / (Total Attempts). Ignores rest days."
      />
      <StatTile
        label="Best Month"
        value={metrics.bestMonth}
        secondary={`SR: ${(metrics.bestMonthRate * 100).toFixed(1)}%`}
        secondaryTone="success"
        help="The month with the highest average success rate."
      />
      <StatTile
        label="Worst Month"
        value={metrics.worstMonth}
        secondary={`SR: ${(metrics.worstMonthRate * 100).toFixed(1)}%`}
        secondaryTone="danger"
        help="The month with the lowest average success rate."
      />
      <StatTile
        label="Perfect Days"
        value={metrics.perfectDays}
        secondary="100% completion"
        help="Days where every active habit was completed."
      />
      <StatTile
        label="Current Streak"
        value={`${metrics.currentStreak}d`}
        secondary={metrics.currentStreak > 0 ? "Still going" : "Start today"}
        secondaryTone={metrics.currentStreak > 0 ? "success" : "muted"}
        help="Consecutive perfect days up to the most recent tracked date."
      />
      <StatTile
        label="Longest Streak"
        value={`${metrics.longestStreak}d`}
        secondary="All-time best"
        help="The longest run of consecutive perfect days in the filtered period."
      />
    </div>
  );
}

import { useMemo } from "react";
import { Card } from "./ui";
import type { HabitRecord } from "../types";

const STATUS_LABEL: Record<string, string> = { "1": "Hit", "0": "Miss", "-": "Rest" };

export function DataTable({ records }: { records: HabitRecord[] }) {
  const sorted = useMemo(() => [...records].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)), [records]);

  return (
    <Card className="p-0">
      <div className="max-h-[600px] overflow-auto rounded-2xl">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 bg-[var(--color-surface-2)] text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Habit</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={`${r.dateKey}-${r.habit}-${i}`} className="border-t border-[var(--color-border)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]">
                <td className="px-4 py-2 tabular-nums">{r.dateKey}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.habit}</td>
                <td className="px-4 py-2">{STATUS_LABEL[r.status]}</td>
                <td className="px-4 py-2 tabular-nums">{r.score ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

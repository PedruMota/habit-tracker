import { Fragment, useMemo } from "react";
import { Card, SectionTitle, InfoNote } from "../ui";
import { getCorrelationMatrix } from "../../lib/aggregations";
import { divergingScale, contrastText } from "../../lib/colors";
import type { HabitRecord } from "../../types";

export function CorrelationMatrix({ records, habits }: { records: HabitRecord[]; habits: string[] }) {
  const { matrix } = useMemo(() => getCorrelationMatrix(records, habits), [records, habits]);

  if (habits.length < 2) {
    return (
      <Card>
        <SectionTitle caption="Statistical correlation between habits.">Habit Correlation Matrix</SectionTitle>
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-[13px] text-[var(--color-ink-muted)]">
          Select at least 2 habits to view correlations.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle caption="Statistical correlation between habits.">Habit Correlation Matrix</SectionTitle>
      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${habits.length}, 44px)` }}>
          <div />
          {habits.map((h) => (
            <div key={h} className="flex h-[110px] items-end justify-center pb-1.5">
              <span className="origin-bottom-left translate-x-2 -rotate-45 whitespace-nowrap text-[10.5px] text-[var(--color-ink-muted)]">{h}</span>
            </div>
          ))}
          {habits.map((rowHabit, r) => (
            <Fragment key={rowHabit}>
              <div className="flex items-center truncate pr-2 text-[11px] text-[var(--color-ink-secondary)]" title={rowHabit}>
                {rowHabit}
              </div>
              {habits.map((colHabit, c) => {
                const v = matrix[r][c];
                const bg = v === null ? "var(--color-surface-3)" : divergingScale(v);
                return (
                  <div
                    key={colHabit}
                    title={`${rowHabit} × ${colHabit}: ${v === null ? "n/a" : v.toFixed(2)}`}
                    className="m-[1px] flex aspect-square items-center justify-center rounded-[4px] text-[10px] font-medium"
                    style={{ background: bg, color: v === null ? "var(--color-ink-muted)" : contrastText(bg) }}
                  >
                    {v === null ? "–" : v.toFixed(2)}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <InfoNote>
        Warm = habits you tend to do together (positive correlation). Cool = habits that compete with each other (negative correlation).
      </InfoNote>
    </Card>
  );
}

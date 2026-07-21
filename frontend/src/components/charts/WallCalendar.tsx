import { useMemo, useState } from "react";
import { Card, SectionTitle, InfoNote } from "../ui";
import { ScoringWidget } from "../ScoringWidget";
import { getCalendarMonths } from "../../lib/aggregations";
import { scoreToColor, contrastText } from "../../lib/colors";
import type { HabitRecord, ScoringConfig } from "../../types";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function WallCalendar({ records, totalHabits }: { records: HabitRecord[]; totalHabits: number }) {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const months = useMemo(() => getCalendarMonths(records, config?.scoreMap ?? { "1": 1, "0": -1, "-": 0 }), [records, config]);

  return (
    <Card>
      <SectionTitle>Monthly Calendar</SectionTitle>
      <ScoringWidget totalHabitsRef={totalHabits} onChange={setConfig} />

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => {
          const maxWeek = Math.max(...month.days.map((d) => d.weekOfMonth));
          return (
            <div key={month.key} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <div className="mb-2 text-center text-[12.5px] font-semibold text-[var(--color-ink-secondary)]">{month.label}</div>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-[var(--color-ink-muted)]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1" style={{ gridTemplateRows: `repeat(${maxWeek}, minmax(0,1fr))` }}>
                {month.days.map((day) => {
                  const bg = config ? scoreToColor(day.netPoints, config.range, config.scale) : "var(--color-surface-3)";
                  return (
                    <div
                      key={day.dateKey}
                      title={`${day.dateKey} · ${day.netPoints.toFixed(1)} pts`}
                      className="flex aspect-square items-center justify-center rounded-md text-[10.5px] font-medium transition-transform hover:scale-[1.08]"
                      style={{
                        gridColumn: day.dayOfWeek + 1,
                        gridRow: day.weekOfMonth,
                        background: bg,
                        color: config ? contrastText(bg) : "var(--color-ink-muted)",
                      }}
                    >
                      {day.dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <InfoNote>
        Classic monthly view. Cell color reflects the daily net score (points earned minus points lost) under the weights chosen above.
      </InfoNote>
    </Card>
  );
}

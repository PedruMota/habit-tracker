import { useMemo, useState } from "react";
import { Card, SectionTitle, InfoNote } from "../ui";
import { ScoringWidget } from "../ScoringWidget";
import { getHeatmapData } from "../../lib/aggregations";
import { scoreToColor, contrastText } from "../../lib/colors";
import type { HabitRecord, ScoringConfig } from "../../types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AnnualHeatmap({ records, totalHabits }: { records: HabitRecord[]; totalHabits: number }) {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const cells = useMemo(() => getHeatmapData(records, config?.scoreMap ?? { "1": 1, "0": -1, "-": 0 }), [records, config]);

  const weeks = useMemo(() => {
    const set = new Set(cells.map((c) => c.weekOfYear));
    const arr = [...set].sort((a, b) => a - b);
    return arr;
  }, [cells]);

  const grid = useMemo(() => {
    const map = new Map<string, (typeof cells)[number]>();
    for (const c of cells) map.set(`${c.weekOfYear}-${c.dayOfWeek}`, c);
    return map;
  }, [cells]);

  return (
    <Card>
      <SectionTitle caption="Annual density view.">Annual Connectivity (Heatmap)</SectionTitle>
      <ScoringWidget totalHabitsRef={totalHabits} onChange={setConfig} />

      <div className="mt-5 overflow-x-auto">
        <div className="inline-flex gap-1">
          <div className="flex flex-col gap-1 pr-1 pt-[18px]">
            {DAY_LABELS.map((d) => (
              <div key={d} className="flex h-4 items-center text-[10px] text-[var(--color-ink-muted)]">{d}</div>
            ))}
          </div>
          <div>
            <div className="mb-1 flex gap-1">
              {weeks.map((w) => (
                <div key={w} className="w-4 text-center text-[9px] text-[var(--color-ink-muted)]">
                  {w % 4 === 0 ? w : ""}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {weeks.map((w) => (
                <div key={w} className="flex flex-col gap-1">
                  {DAY_LABELS.map((_, dayIdx) => {
                    const cell = grid.get(`${w}-${dayIdx}`);
                    const bg = cell && config ? scoreToColor(cell.netPoints, config.range, config.scale) : "var(--color-surface-3)";
                    return (
                      <div
                        key={dayIdx}
                        title={cell ? `${cell.dateKey} · ${cell.netPoints.toFixed(1)} pts` : "No data"}
                        className="h-4 w-4 rounded-[3px] transition-transform hover:scale-125"
                        style={{ background: bg, color: cell ? contrastText(bg) : undefined }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InfoNote>
        Detect consistency over the weeks. A darker/stronger fill means a higher activity score that day.
      </InfoNote>
    </Card>
  );
}

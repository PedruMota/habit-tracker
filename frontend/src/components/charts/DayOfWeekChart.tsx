import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionTitle, InfoNote } from "../ui";
import { ChartTooltip } from "./ChartTooltip";
import { getDayOfWeekData } from "../../lib/aggregations";
import type { HabitRecord } from "../../types";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function DayOfWeekChart({ records }: { records: HabitRecord[] }) {
  const { data, average } = useMemo(() => getDayOfWeekData(records), [records]);

  return (
    <div>
      <SectionTitle caption="Average success rate by day of the week.">Weekly Rhythm</SectionTitle>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-gridline)" />
            <XAxis dataKey="shortName" tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={pct} domain={[0, 1]} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ fill: "var(--color-surface-2)" }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label as string}
                  items={(payload ?? []).map((p) => ({ name: "Success rate", value: pct(p.value as number), color: "var(--color-brand)" }))}
                />
              )}
            />
            <ReferenceLine y={average} stroke="var(--color-ink-muted)" strokeDasharray="4 4" label={{ value: "Avg", position: "insideTopRight", fill: "var(--color-ink-muted)", fontSize: 11 }} />
            <Bar dataKey="rate" fill="var(--color-brand)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="rate" position="top" formatter={(v: unknown) => pct(Number(v))} style={{ fill: "var(--color-ink-secondary)", fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <InfoNote>
        Discover your strongest and weakest days of the week. The dashed line marks the overall average.
      </InfoNote>
    </div>
  );
}

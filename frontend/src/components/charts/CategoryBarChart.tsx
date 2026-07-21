import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionTitle, InfoNote } from "../ui";
import { ChartTooltip } from "./ChartTooltip";
import { getCategoryBarData } from "../../lib/aggregations";
import type { HabitRecord } from "../../types";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function CategoryBarChart({ records }: { records: HabitRecord[] }) {
  const { data, average } = useMemo(() => getCategoryBarData(records), [records]);

  return (
    <div>
      <SectionTitle>Performance by Category</SectionTitle>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-gridline)" />
            <XAxis type="number" tickFormatter={pct} domain={[0, 1]} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="type" width={110} tick={{ fill: "var(--color-ink-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--color-surface-2)" }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label as string}
                  items={(payload ?? []).map((p) => ({
                    name: "Success rate",
                    value: `${pct(p.payload.mean)} (N=${p.payload.count})`,
                    color: "var(--color-brand)",
                  }))}
                />
              )}
            />
            <ReferenceLine x={average} stroke="var(--color-ink-muted)" strokeDasharray="4 4" label={{ value: `Avg: ${pct(average)}`, position: "top", fill: "var(--color-ink-muted)", fontSize: 11 }} />
            <Bar dataKey="mean" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.type} fill="var(--color-brand)" />
              ))}
              <LabelList dataKey="label" position="right" style={{ fill: "var(--color-ink-secondary)", fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <InfoNote>
        Ranking of your life areas. The dashed line marks your overall average success rate.
      </InfoNote>
    </div>
  );
}

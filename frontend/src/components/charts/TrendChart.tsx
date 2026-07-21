import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SegmentedControl, SectionTitle, InfoNote } from "../ui";
import { ChartTooltip } from "./ChartTooltip";
import { getTrendSeries, getMultilineTrendSeries } from "../../lib/aggregations";
import { categoricalColor } from "../../lib/colors";
import type { HabitRecord } from "../../types";

const dateLabel = (dateKey: string) =>
  new Date(dateKey).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function TrendChart({ records }: { records: HabitRecord[] }) {
  const [view, setView] = useState<"Global" | "Category">("Global");

  const global = useMemo(() => getTrendSeries(records), [records]);
  const multi = useMemo(() => getMultilineTrendSeries(records, "type"), [records]);

  return (
    <div>
      <SectionTitle>Consistency Trend</SectionTitle>
      <SegmentedControl options={["Global", "Category"]} value={view} onChange={(v) => setView(v as "Global" | "Category")} />

      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === "Global" ? (
            <LineChart data={global.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-gridline)" />
              <XAxis dataKey="dateKey" tickFormatter={dateLabel} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-gridline)" }} tickLine={false} minTickGap={40} />
              <YAxis tickFormatter={pct} domain={[0, 1]} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                content={({ active, label, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={label ? dateLabel(label as string) : undefined}
                    items={(payload ?? [])
                      .filter((p) => p.value !== null && p.value !== undefined)
                      .map((p) => ({ name: "Success rate", value: pct(p.value as number), color: "var(--color-brand)" }))}
                  />
                )}
              />
              <ReferenceLine y={global.average} stroke="var(--color-ink-muted)" strokeDasharray="4 4" label={{ value: `Avg: ${pct(global.average)}`, position: "insideTopRight", fill: "var(--color-ink-muted)", fontSize: 11 }} />
              <Line type="monotone" dataKey="ma7" stroke="var(--color-brand)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          ) : (
            <LineChart data={multi.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-gridline)" />
              <XAxis dataKey="dateKey" tickFormatter={dateLabel} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-gridline)" }} tickLine={false} minTickGap={40} />
              <YAxis tickFormatter={pct} domain={[0, 1]} tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                content={({ active, label, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={label ? dateLabel(label as string) : undefined}
                    items={(payload ?? [])
                      .filter((p) => p.value !== null && p.value !== undefined)
                      .map((p) => ({ name: p.name as string, value: pct(p.value as number), color: p.color as string }))}
                  />
                )}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-ink-muted)" }} />
              {multi.series.map((s, i) => (
                <Line key={s} type="monotone" dataKey={s} name={s} stroke={categoricalColor(i)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <InfoNote>
        Shows the evolution of your discipline (7-day moving average). An upward line indicates progress over time.
      </InfoNote>
    </div>
  );
}

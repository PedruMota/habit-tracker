import type { HabitRecord, Status } from "../types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function globalAverage(records: HabitRecord[]): number {
  const scores = records.filter((r) => r.score !== null).map((r) => r.score as number);
  return scores.length > 0 ? mean(scores) : 0;
}

/** Rolling mean with a min-periods-1 style window: skips nulls, needs >=1 non-null in window. */
function rollingMeanSkipNull(values: (number | null)[], window = 7): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v !== null);
    out.push(slice.length > 0 ? mean(slice) : null);
  }
  return out;
}

function groupMeanByDate(records: HabitRecord[]): Map<string, number | null> {
  const byDate = new Map<string, number[]>();
  for (const r of records) {
    if (!byDate.has(r.dateKey)) byDate.set(r.dateKey, []);
    if (r.score !== null) byDate.get(r.dateKey)!.push(r.score);
  }
  const out = new Map<string, number | null>();
  for (const [dateKey, scores] of byDate) out.set(dateKey, scores.length > 0 ? mean(scores) : null);
  return out;
}

export interface TrendPoint {
  dateKey: string;
  date: Date;
  ma7: number | null;
}

/** Global 7-day moving average of daily success rate. Ported from charts.py::get_trend_chart. */
export function getTrendSeries(records: HabitRecord[]): { data: TrendPoint[]; average: number } {
  const byDate = groupMeanByDate(records);
  const dateKeys = [...byDate.keys()].sort();
  const dailyValues = dateKeys.map((k) => byDate.get(k)!);
  const ma7 = rollingMeanSkipNull(dailyValues);

  return {
    data: dateKeys.map((dateKey, i) => ({ dateKey, date: new Date(dateKey), ma7: ma7[i] })),
    average: globalAverage(records),
  };
}

/** Per-category 7-day moving average lines. Ported from charts.py::get_multiline_trend_chart. */
export function getMultilineTrendSeries(
  records: HabitRecord[],
  dimension: "type" = "type"
): { data: Array<Record<string, string | number | null>>; series: string[] } {
  const groups = new Map<string, HabitRecord[]>();
  for (const r of records) {
    const key = r[dimension];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const series = [...groups.keys()].sort();
  const perSeries = new Map<string, Map<string, number | null>>();
  for (const key of series) {
    const byDate = groupMeanByDate(groups.get(key)!);
    const dateKeys = [...byDate.keys()].sort();
    const values = rollingMeanSkipNull(dateKeys.map((k) => byDate.get(k)!));
    perSeries.set(key, new Map(dateKeys.map((k, i) => [k, values[i]])));
  }

  const allDates = new Set<string>();
  for (const map of perSeries.values()) for (const k of map.keys()) allDates.add(k);
  const sortedDates = [...allDates].sort();

  const data = sortedDates.map((dateKey) => {
    const row: Record<string, string | number | null> = { dateKey };
    for (const key of series) row[key] = perSeries.get(key)?.get(dateKey) ?? null;
    return row;
  });

  return { data, series };
}

export interface CategoryBarPoint {
  type: string;
  mean: number;
  count: number;
  label: string;
}

/** Ported from charts.py::get_category_bar_chart. */
export function getCategoryBarData(records: HabitRecord[]): { data: CategoryBarPoint[]; average: number } {
  const byType = new Map<string, number[]>();
  for (const r of records) {
    if (r.score === null) continue;
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r.score);
  }

  const data = [...byType.entries()]
    .map(([type, scores]) => {
      const m = mean(scores);
      return { type, mean: m, count: scores.length, label: `${(m * 100).toFixed(1)}% (N=${scores.length})` };
    })
    .sort((a, b) => a.mean - b.mean);

  return { data, average: globalAverage(records) };
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface DayOfWeekPoint {
  dayName: string;
  shortName: string;
  rate: number;
}

/** Ported from charts.py::get_day_of_week_chart. */
export function getDayOfWeekData(records: HabitRecord[]): { data: DayOfWeekPoint[]; average: number } {
  const byDay = new Map<string, number[]>();
  for (const r of records) {
    if (r.score === null) continue;
    if (!byDay.has(r.dayOfWeek)) byDay.set(r.dayOfWeek, []);
    byDay.get(r.dayOfWeek)!.push(r.score);
  }

  const data = DAY_ORDER.filter((d) => byDay.has(d)).map((dayName) => ({
    dayName,
    shortName: dayName.slice(0, 3),
    rate: mean(byDay.get(dayName)!),
  }));

  return { data, average: globalAverage(records) };
}

/** Mon=0..Sun=6, matching Python's date.weekday(). */
function mondayIndexed(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Ported from charts.py::get_wall_calendar_view::get_week_of_month. */
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dom = date.getDate();
  const adjustedDom = dom + mondayIndexed(firstDay);
  return Math.floor((adjustedDom - 1) / 7) + 1;
}

export interface CalendarDay {
  dateKey: string;
  dayNum: number;
  dayOfWeek: number; // Mon=0..Sun=6
  weekOfMonth: number;
  netPoints: number;
}
export interface CalendarMonth {
  key: string; // yyyy-mm
  label: string;
  days: CalendarDay[];
}

/** Groups filtered records into month grids for the wall-calendar view. */
export function getCalendarMonths(records: HabitRecord[], scoreMap: Record<Status, number>): CalendarMonth[] {
  const byDate = new Map<string, { date: Date; net: number }>();
  for (const r of records) {
    const points = scoreMap[r.status] ?? 0;
    const entry = byDate.get(r.dateKey);
    if (entry) entry.net += points;
    else byDate.set(r.dateKey, { date: r.date, net: points });
  }

  const byMonth = new Map<string, CalendarMonth>();
  for (const [dateKey, { date, net }] of byDate) {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(monthKey)) {
      const label = date.toLocaleString("en-US", { month: "long", year: "numeric" });
      byMonth.set(monthKey, { key: monthKey, label, days: [] });
    }
    byMonth.get(monthKey)!.days.push({
      dateKey,
      dayNum: date.getDate(),
      dayOfWeek: mondayIndexed(date),
      weekOfMonth: getWeekOfMonth(date),
      netPoints: net,
    });
  }

  return [...byMonth.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

export interface HeatmapCell {
  weekOfYear: number;
  dayOfWeek: number; // Mon=0..Sun=6
  netPoints: number;
  dateKey: string;
}

/** Ported from charts.py::get_productivity_heatmap. */
export function getHeatmapData(records: HabitRecord[], scoreMap: Record<Status, number>): HeatmapCell[] {
  const byDate = new Map<string, { date: Date; net: number }>();
  for (const r of records) {
    const points = scoreMap[r.status] ?? 0;
    const entry = byDate.get(r.dateKey);
    if (entry) entry.net += points;
    else byDate.set(r.dateKey, { date: r.date, net: points });
  }

  return [...byDate.entries()]
    .map(([dateKey, { date, net }]) => ({
      dateKey,
      weekOfYear: isoWeek(date),
      dayOfWeek: mondayIndexed(date),
      netPoints: net,
    }))
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}

/**
 * Pairwise Pearson correlation between habits, using only dates where BOTH
 * habits have a non-rest status (pairwise deletion, matching pandas .corr()
 * semantics). Ported from charts.py::get_correlation_heatmap.
 */
export function getCorrelationMatrix(
  records: HabitRecord[],
  habits: string[]
): { habits: string[]; matrix: (number | null)[][] } {
  const byHabitDate = new Map<string, Map<string, number>>();
  for (const habit of habits) byHabitDate.set(habit, new Map());
  for (const r of records) {
    if (r.score === null) continue;
    byHabitDate.get(r.habit)?.set(r.dateKey, r.score);
  }

  const matrix = habits.map((rowHabit) =>
    habits.map((colHabit) => {
      if (rowHabit === colHabit) return 1;
      const rowMap = byHabitDate.get(rowHabit)!;
      const colMap = byHabitDate.get(colHabit)!;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [dateKey, v] of rowMap) {
        const other = colMap.get(dateKey);
        if (other !== undefined) {
          xs.push(v);
          ys.push(other);
        }
      }
      return pearson(xs, ys);
    })
  );

  return { habits, matrix };
}

import type { HabitRecord } from "../types";

export interface GlobalMetrics {
  successRate: number;
  successCount: number;
  failureCount: number;
  perfectDays: number;
  bestMonth: string;
  bestMonthRate: number;
  worstMonth: string;
  worstMonthRate: number;
  currentStreak: number;
  longestStreak: number;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function scoresByDate(records: HabitRecord[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const r of records) {
    if (r.score === null) continue;
    const arr = map.get(r.dateKey);
    if (arr) arr.push(r.score);
    else map.set(r.dateKey, [r.score]);
  }
  return map;
}

/**
 * Longest and current run of "perfect days" (every active habit that day
 * scored a hit). Absent calendar days between the first and last tracked
 * date count as a break, so a gap in the logs doesn't silently extend a streak.
 * This metric doesn't exist in the original Streamlit app — added because
 * a dashboard about consistency should surface consistency directly.
 */
function computeStreaks(dailyMeans: Map<string, number>): { current: number; longest: number } {
  const dateKeys = [...dailyMeans.keys()].sort();
  if (dateKeys.length === 0) return { current: 0, longest: 0 };

  const first = new Date(dateKeys[0]);
  const last = new Date(dateKeys[dateKeys.length - 1]);

  let longest = 0;
  let running = 0;
  let current = 0;

  const cursor = new Date(first);
  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const isPerfect = dailyMeans.get(key) === 1;

    if (isPerfect) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
    current = running;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { current, longest };
}

export function calculateGlobalMetrics(records: HabitRecord[]): GlobalMetrics {
  if (records.length === 0) {
    return {
      successRate: 0,
      successCount: 0,
      failureCount: 0,
      perfectDays: 0,
      bestMonth: "N/A",
      bestMonthRate: 0,
      worstMonth: "N/A",
      worstMonthRate: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const successCount = records.filter((r) => r.score === 1).length;
  const failureCount = records.filter((r) => r.score === 0).length;
  const attempted = records.filter((r) => r.score !== null).map((r) => r.score as number);
  const successRate = attempted.length > 0 ? mean(attempted) : 0;

  const byDate = scoresByDate(records);
  const dailyMeans = new Map<string, number>();
  for (const [dateKey, scores] of byDate) dailyMeans.set(dateKey, mean(scores));
  const perfectDays = [...dailyMeans.values()].filter((v) => v === 1).length;

  // Grouped by year+month (not just month name) so multi-year data doesn't
  // conflate e.g. January 2025 with January 2026.
  const byMonth = new Map<string, { label: string; scores: number[] }>();
  for (const r of records) {
    if (r.score === null) continue;
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    const label = `${r.monthName} ${r.date.getFullYear()}`;
    const bucket = byMonth.get(key);
    if (bucket) bucket.scores.push(r.score);
    else byMonth.set(key, { label, scores: [r.score] });
  }

  let bestMonth = "N/A";
  let bestMonthRate = 0;
  let worstMonth = "N/A";
  let worstMonthRate = 0;
  let bestVal = -Infinity;
  let worstVal = Infinity;
  for (const { label, scores } of byMonth.values()) {
    const rate = mean(scores);
    if (rate > bestVal) {
      bestVal = rate;
      bestMonth = label;
      bestMonthRate = rate;
    }
    if (rate < worstVal) {
      worstVal = rate;
      worstMonth = label;
      worstMonthRate = rate;
    }
  }

  const { current, longest } = computeStreaks(dailyMeans);

  return {
    successRate,
    successCount,
    failureCount,
    perfectDays,
    bestMonth,
    bestMonthRate,
    worstMonth,
    worstMonthRate,
    currentStreak: current,
    longestStreak: longest,
  };
}

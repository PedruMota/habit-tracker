import type { HabitRecord, RawSheet, Status } from "../types";

/**
 * Habit names changed over time in the source spreadsheets (renamed
 * categories, merged habits). Old names are folded into their current
 * name so history isn't fragmented across a rename.
 * Ported from etl/processor.py::mapeamento_habitos.
 */
const HABIT_REMAP: Record<string, string> = {
  Academia: "Workout",
  Gym: "Workout",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const RESERVED_KEYS = new Set(["type", "habit", "_year", "_origin_sheet"]);

function scoreFor(status: Status): number | null {
  if (status === "1") return 1;
  if (status === "0") return 0;
  return null;
}

/**
 * Melts wide per-day sheets into long completion records and normalizes
 * them, mirroring etl/processor.py::process_data. Unlike the Python
 * version — which parses "dd/mm" with pandas' dayfirst inference and
 * leaves year disambiguation as a fallback comment — this builds the
 * date explicitly from the row's tagged `_year`, so multi-year sheets
 * never collide.
 */
export function processRawSheets(sheets: RawSheet[]): HabitRecord[] {
  const seen = new Set<string>(); // dedup key: `${dateKey}|${habit}`
  const records: HabitRecord[] = [];

  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      const habit = HABIT_REMAP[row.habit] ?? row.habit;
      const year = Number(row._year);

      for (const [key, rawValue] of Object.entries(row)) {
        if (RESERVED_KEYS.has(key)) continue;
        const status = String(rawValue).trim();
        if (status === "" || (status !== "1" && status !== "0" && status !== "-")) continue;

        const [dayStr, monthStr] = key.split("/");
        const day = Number(dayStr);
        const month = Number(monthStr);
        if (!day || !month) continue;

        const date = new Date(year, month - 1, day);
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dedupKey = `${dateKey}|${habit}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        records.push({
          date,
          dateKey,
          type: row.type,
          habit,
          status: status as Status,
          score: scoreFor(status as Status),
          monthName: MONTH_NAMES[date.getMonth()],
          dayOfWeek: DAY_NAMES[date.getDay()],
        });
      }
    }
  }

  records.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return a.habit < b.habit ? -1 : a.habit > b.habit ? 1 : 0;
  });

  return records;
}

export type Status = "1" | "0" | "-";

export interface RawSheetRow {
  type: string;
  habit: string;
  _year: string;
  _origin_sheet: string;
  [dateCell: string]: string;
}

export interface RawSheet {
  _year: string;
  _origin_sheet: string;
  rows: RawSheetRow[];
}

/** Canonical long-format completion record — mirrors etl/processor.py's output schema. */
export interface HabitRecord {
  date: Date;
  dateKey: string; // yyyy-mm-dd, stable sort/group key
  type: string;
  habit: string;
  status: Status;
  score: number | null; // 1 (hit), 0 (miss), null (rest day)
  monthName: string;
  dayOfWeek: string; // "Monday".."Sunday"
}

export interface ScorePreset {
  label: string;
  wHit: number;
  wMiss: number;
  description: string;
}

export interface ScoringConfig {
  scoreMap: Record<Status, number>;
  range: [number, number];
  scale: "sequential" | "diverging";
}

export interface Filters {
  year: number;
  dateStart: string; // yyyy-mm-dd
  dateEnd: string;
  types: string[];
  habits: string[];
}

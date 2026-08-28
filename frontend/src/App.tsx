import { useEffect, useMemo, useState } from "react";
import { processRawSheets } from "./lib/etl";
import { calculateGlobalMetrics } from "./lib/stats";
import type { HabitRecord, RawSheet } from "./types";

// Prefers your own git-ignored export (frontend/src/data/local-data.json,
// produced by `python etl/export_for_frontend.py`) over the bundled sample
// dataset, so a real Google Sheets export is used automatically when present.
const dataModules = import.meta.glob<{ default: RawSheet[] }>("./data/{local-data,sample-raw}.json", { eager: true });
const rawSheets: RawSheet[] = (dataModules["./data/local-data.json"] ?? dataModules["./data/sample-raw.json"]).default;
import { FilterBar } from "./components/FilterBar";
import { KpiRow } from "./components/KpiRow";
import { Tabs, Card } from "./components/ui";
import { TrendChart } from "./components/charts/TrendChart";
import { CategoryBarChart } from "./components/charts/CategoryBarChart";
import { WallCalendar } from "./components/charts/WallCalendar";
import { AnnualHeatmap } from "./components/charts/AnnualHeatmap";
import { DayOfWeekChart } from "./components/charts/DayOfWeekChart";
import { CorrelationMatrix } from "./components/charts/CorrelationMatrix";
import { DataTable } from "./components/DataTable";

const TABS = ["Overview", "Calendar", "Patterns", "Data"];

export default function App() {
  const allRecords: HabitRecord[] = useMemo(() => processRawSheets(rawSheets as RawSheet[]), []);

  const years = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.date.getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [allRecords]);

  const [year, setYear] = useState<number>(years[0] ?? new Date().getFullYear());
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [habits, setHabits] = useState<string[]>([]);
  const [tab, setTab] = useState("Overview");

  const dfYear = useMemo(() => allRecords.filter((r) => r.date.getFullYear() === year), [allRecords, year]);

  const yearBounds = useMemo(() => {
    if (dfYear.length === 0) return { min: "", max: "" };
    const keys = dfYear.map((r) => r.dateKey).sort();
    return { min: keys[0], max: keys[keys.length - 1] };
  }, [dfYear]);

  const allTypes = useMemo(() => [...new Set(dfYear.map((r) => r.type))].sort(), [dfYear]);

  const availableHabits = useMemo(
    () => [...new Set(dfYear.filter((r) => types.includes(r.type)).map((r) => r.habit))].sort(),
    [dfYear, types]
  );

  // Reset dependent filters whenever the selected year changes.
  useEffect(() => {
    setDateStart(yearBounds.min);
    setDateEnd(yearBounds.max);
    setTypes(allTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, yearBounds.min, yearBounds.max]);

  // Keep habit selection valid whenever available habits change (category toggles).
  useEffect(() => {
    setHabits((prev) => {
      const stillValid = prev.filter((h) => availableHabits.includes(h));
      if (stillValid.length === prev.length && prev.length > 0) return prev;
      return stillValid.length > 0 ? stillValid : availableHabits;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableHabits]);

  const filtered = useMemo(() => {
    if (!dateStart || !dateEnd) return [];
    return dfYear.filter(
      (r) => r.dateKey >= dateStart && r.dateKey <= dateEnd && types.includes(r.type) && habits.includes(r.habit)
    );
  }, [dfYear, dateStart, dateEnd, types, habits]);

  const totalFilteredHabits = useMemo(() => new Set(filtered.map((r) => r.habit)).size, [filtered]);
  const metrics = useMemo(() => calculateGlobalMetrics(filtered), [filtered]);

  const handleReset = () => {
    setDateStart(yearBounds.min);
    setDateEnd(yearBounds.max);
    setTypes(allTypes);
    setHabits(availableHabits);
  };

  return (
    <div className="min-h-screen bg-[var(--color-page)]">
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="font-[var(--font-display)] text-[26px] font-medium tracking-tight text-[var(--color-ink)]">
            Habit Tracker
          </h1>
          <p className="text-[13.5px] text-[var(--color-ink-muted)]">A quiet log of the small things, day after day.</p>
        </header>

        <div className="mb-6">
          <FilterBar
            years={years}
            allTypes={allTypes}
            availableHabits={availableHabits}
            minDate={yearBounds.min}
            maxDate={yearBounds.max}
            filters={{ year, dateStart, dateEnd, types, habits }}
            onFiltersChange={(next) => {
              setDateStart(next.dateStart);
              setDateEnd(next.dateEnd);
              setTypes(next.types);
              setHabits(next.habits);
              if (next.year !== year) setYear(next.year);
            }}
            onReset={handleReset}
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              No data visible for the current filters. Try widening the date range or selecting more categories/habits.
            </p>
          </Card>
        ) : (
          <div className="animate-fade-in space-y-6">
            <KpiRow metrics={metrics} />

            <div>
              <Tabs tabs={TABS} value={tab} onChange={setTab} />

              <div className="pt-5">
                {tab === "Overview" && (
                  <div className="space-y-5">
                    <Card>
                      <TrendChart records={filtered} />
                    </Card>
                    <Card>
                      <CategoryBarChart records={filtered} />
                    </Card>
                  </div>
                )}

                {tab === "Calendar" && <WallCalendar records={filtered} totalHabits={totalFilteredHabits} />}

                {tab === "Patterns" && (
                  <div className="space-y-5">
                    <AnnualHeatmap records={filtered} totalHabits={totalFilteredHabits} />
                    <Card>
                      <DayOfWeekChart records={filtered} />
                    </Card>
                    <CorrelationMatrix records={filtered} habits={habits} />
                  </div>
                )}

                {tab === "Data" && <DataTable records={filtered} />}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-10 py-6 text-center text-[12px] text-[var(--color-ink-muted)]">
          Sample data shown — anonymized &amp; synthetic. Not the author's real habit history.
        </footer>
      </main>
    </div>
  );
}

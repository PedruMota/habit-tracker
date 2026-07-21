import { Card, Pills, MultiSelectList } from "./ui";
import type { Filters } from "../types";

interface FilterBarProps {
  years: number[];
  allTypes: string[];
  availableHabits: string[];
  minDate: string;
  maxDate: string;
  filters: Filters;
  onFiltersChange: (next: Filters) => void;
  onReset: () => void;
}

export function FilterBar({
  years,
  allTypes,
  availableHabits,
  minDate,
  maxDate,
  filters,
  onFiltersChange,
  onReset,
}: FilterBarProps) {
  const patch = (partial: Partial<Filters>) => onFiltersChange({ ...filters, ...partial });
  const habitLabel = `Habits (${filters.habits.length}/${availableHabits.length})`;

  return (
    <Card className="p-5!">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Year</label>
          <select
            value={filters.year}
            onChange={(e) => patch({ year: Number(e.target.value) })}
            className="rounded-2xl bg-[var(--color-surface-2)] px-3.5 py-2 text-[13.5px] text-[var(--color-ink)] outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Period</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.dateStart}
              min={minDate}
              max={filters.dateEnd}
              onChange={(e) => patch({ dateStart: e.target.value })}
              className="rounded-2xl bg-[var(--color-surface-2)] px-3 py-2 text-[12.5px] text-[var(--color-ink)] outline-none"
            />
            <span className="text-[var(--color-ink-muted)]">–</span>
            <input
              type="date"
              value={filters.dateEnd}
              min={filters.dateStart}
              max={maxDate}
              onChange={(e) => patch({ dateEnd: e.target.value })}
              className="rounded-2xl bg-[var(--color-surface-2)] px-3 py-2 text-[12.5px] text-[var(--color-ink)] outline-none"
            />
          </div>
        </div>

        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Categories</label>
          <Pills options={allTypes} selected={filters.types} onChange={(types) => patch({ types })} />
        </div>

        <div className="relative">
          <details className="group">
            <summary className="cursor-pointer list-none rounded-2xl bg-[var(--color-surface-2)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-ink-secondary)] marker:content-none hover:bg-[var(--color-surface-3)]">
              {habitLabel} <span className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div
              className="absolute right-0 z-20 mt-2 w-72 rounded-[24px] bg-[var(--color-surface)] p-4"
              style={{ boxShadow: "0 1px 2px rgba(43,36,32,0.04), 0 10px 28px -14px rgba(43,36,32,0.22)" }}
            >
              <button
                onClick={() => patch({ habits: availableHabits })}
                className="mb-2 w-full rounded-xl bg-[var(--color-surface-2)] py-1.5 text-[12px] font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-3)]"
              >
                Select All Habits
              </button>
              <MultiSelectList options={availableHabits} selected={filters.habits} onChange={(habits) => patch({ habits })} />
            </div>
          </details>
        </div>

        <button
          onClick={onReset}
          className="rounded-2xl px-3.5 py-2 text-[13px] font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
        >
          Reset Filters
        </button>
      </div>
    </Card>
  );
}

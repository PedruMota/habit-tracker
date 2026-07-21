import { type ReactNode, useState } from "react";
import clsx from "clsx";

const CARD_SHADOW = "0 1px 2px rgba(43,36,32,0.04), 0 10px 28px -14px rgba(43,36,32,0.22)";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx("rounded-[28px] bg-[var(--color-surface)] p-6", className)}
      style={{ boxShadow: CARD_SHADOW }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">{children}</h3>
      {caption && <p className="mt-0.5 text-[13px] text-[var(--color-ink-muted)]">{caption}</p>}
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-brand-strong)] transition-colors"
      >
        <span className={clsx("inline-block transition-transform", open && "rotate-90")}>›</span>
        About this chart
      </button>
      {open && (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--color-ink-secondary)] animate-fade-in">
          {children}
        </p>
      )}
    </div>
  );
}

export function Pills({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              active
                ? "bg-[var(--color-brand)] text-[#fffaf3]"
                : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-3)]"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-[var(--color-surface-2)] p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            value === opt ? "bg-[var(--color-brand)] text-[#fffaf3]" : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={clsx(
            "rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors",
            value === tab
              ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
              : "bg-[var(--color-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]"
          )}
          style={value !== tab ? { boxShadow: CARD_SHADOW } : undefined}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function MultiSelectList({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="h-3.5 w-3.5 accent-[var(--color-brand)]"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function StatTile({
  label,
  value,
  secondary,
  secondaryTone = "muted",
  help,
}: {
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
  secondaryTone?: "muted" | "success" | "danger";
  help?: string;
}) {
  return (
    <Card className="min-w-0 p-5!">
      <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-ink-muted)]" title={help}>
        {label}
        {help && <span className="cursor-help text-[11px] opacity-70">ⓘ</span>}
      </div>
      <div className="mt-1 font-[var(--font-display)] text-[30px] font-medium tracking-tight tabular-nums text-[var(--color-ink)]">
        {value}
      </div>
      {secondary && (
        <div
          className={clsx(
            "mt-1 text-[12.5px] font-medium",
            secondaryTone === "success" && "text-[var(--color-success)]",
            secondaryTone === "danger" && "text-[var(--color-danger)]",
            secondaryTone === "muted" && "text-[var(--color-ink-muted)]"
          )}
        >
          {secondary}
        </div>
      )}
    </Card>
  );
}

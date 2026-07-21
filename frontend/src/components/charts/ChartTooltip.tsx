export function ChartTooltip({
  active,
  label,
  items,
}: {
  active?: boolean;
  label?: string;
  items?: { name: string; value: string; color: string }[];
}) {
  if (!active || !items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[12.5px] shadow-lg">
      {label && <div className="mb-1 font-medium text-[var(--color-ink)]">{label}</div>}
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
          <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          <span className="text-[var(--color-ink-muted)]">{it.name}:</span>
          <span className="font-medium tabular-nums text-[var(--color-ink)]">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

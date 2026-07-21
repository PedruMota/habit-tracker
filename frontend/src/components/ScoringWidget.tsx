import { useEffect, useState } from "react";
import { SegmentedControl } from "./ui";
import { SCORE_PRESETS, buildScoringConfig, scoreDescription, type ScoreMode } from "../lib/scoring";
import type { ScoringConfig } from "../types";

const MODES: ScoreMode[] = [...(Object.keys(SCORE_PRESETS) as (keyof typeof SCORE_PRESETS)[]), "Custom"];

export function ScoringWidget({
  totalHabitsRef,
  onChange,
}: {
  totalHabitsRef: number;
  onChange: (config: ScoringConfig) => void;
}) {
  const [mode, setMode] = useState<ScoreMode>("Symmetric");
  const [wHit, setWHit] = useState(1.0);
  const [wMiss, setWMiss] = useState(-0.5);

  const custom = { wHit, wMiss };
  const config = buildScoringConfig(mode, totalHabitsRef, custom);
  const desc = scoreDescription(mode);
  const activeHit = mode === "Custom" ? wHit : SCORE_PRESETS[mode as keyof typeof SCORE_PRESETS].wHit;
  const activeMiss = mode === "Custom" ? wMiss : SCORE_PRESETS[mode as keyof typeof SCORE_PRESETS].wMiss;

  useEffect(() => {
    onChange(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, wHit, wMiss, totalHabitsRef]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div>
        <div className="mb-1.5 text-[12px] font-medium text-[var(--color-ink-muted)]">Scoring Rule</div>
        <SegmentedControl options={MODES} value={mode} onChange={(v) => setMode(v as ScoreMode)} />
      </div>

      {mode === "Custom" && (
        <div className="flex items-end gap-3">
          <label className="text-[12px] text-[var(--color-ink-secondary)]">
            Hit Weight (+)
            <input
              type="number"
              step={0.1}
              value={wHit}
              onChange={(e) => setWHit(Number(e.target.value))}
              className="mt-1 block w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>
          <label className="text-[12px] text-[var(--color-ink-secondary)]">
            Miss Weight (-)
            <input
              type="number"
              step={0.1}
              value={wMiss}
              onChange={(e) => setWMiss(Number(e.target.value))}
              className="mt-1 block w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]"
            />
          </label>
        </div>
      )}

      <p className="text-[12.5px] text-[var(--color-ink-muted)]">
        ⚙️ <span className="font-medium text-[var(--color-ink-secondary)]">{desc}</span> · Formula: (Hits × {activeHit}) + (Misses × {activeMiss})
      </p>
    </div>
  );
}

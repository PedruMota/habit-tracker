import type { ScoringConfig, Status } from "../types";

export const SCORE_PRESETS = {
  Symmetric: { wHit: 1.0, wMiss: -1.0, description: "Total Balance (+1 / -1)" },
  Progressive: { wHit: 1.0, wMiss: -0.5, description: "Focus on Hits (+1 / -0.5)" },
} as const;

export type ScoreMode = keyof typeof SCORE_PRESETS | "Custom";

/**
 * Builds the scoring engine config for the Calendar/Heatmap "behavioral
 * economics" widget: which weights map hit/miss/rest to a point value, and
 * the color range those points should span. The range is context-aware —
 * it's recomputed from however many habits are currently selected in the
 * filters, so 100% coloring is relative to the active filter, not global
 * history. Ported from main.py::render_scoring_widget.
 */
export function buildScoringConfig(
  mode: ScoreMode,
  totalHabitsRef: number,
  custom?: { wHit: number; wMiss: number }
): ScoringConfig {
  const { wHit, wMiss } = mode === "Custom" ? custom ?? { wHit: 1, wMiss: -0.5 } : SCORE_PRESETS[mode];

  const scoreMap: Record<Status, number> = { "1": wHit, "0": wMiss, "-": 0 };
  const maxScore = totalHabitsRef * scoreMap["1"];
  const minScore = totalHabitsRef * scoreMap["0"];

  return {
    scoreMap,
    range: [minScore, maxScore],
    scale: minScore < 0 ? "diverging" : "sequential",
  };
}

export function scoreDescription(mode: ScoreMode): string {
  if (mode === "Custom") return "Manually defined weights.";
  return SCORE_PRESETS[mode].description;
}

// Validated data-viz palette (see dataviz skill / references/palette.md).
// Categorical hues are assigned in this fixed order — never cycled/re-sorted
// by rank — so a filter that changes which categories are visible never
// repaints the survivors with a different color.
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];
export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];

const SEQUENTIAL_BLUE_LIGHT = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec",
  "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];
const SEQUENTIAL_BLUE_DARK = SEQUENTIAL_BLUE_LIGHT; // same ramp; dark surface just recedes less

const GRAY_MIDPOINT = { light: "#f0efec", dark: "#383835" };
const DIVERGING_BLUE_LIGHT = "#0d366b";
const DIVERGING_BLUE_DARK = "#3987e5";
const DIVERGING_RED_LIGHT = "#e34948";
const DIVERGING_RED_DARK = "#e66767";

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

/** value in [0,1] -> single-hue sequential blue ramp (magnitude encoding, e.g. heatmap density). */
export function sequentialScale(value: number, dark = true): string {
  const stops = dark ? SEQUENTIAL_BLUE_DARK : SEQUENTIAL_BLUE_LIGHT;
  const t = Math.min(1, Math.max(0, value));
  const idx = t * (stops.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(stops.length - 1, lo + 1);
  return lerpColor(stops[lo], stops[hi], idx - lo);
}

/**
 * value in [-1,1] -> diverging blue<->red through a neutral gray midpoint.
 * Replaces the original app's RdYlGn/RdBu scales (not colorblind-safe) with
 * the validated diverging pair from the dataviz palette.
 */
export function divergingScale(value: number, dark = true): string {
  const t = Math.min(1, Math.max(-1, value));
  const gray = dark ? GRAY_MIDPOINT.dark : GRAY_MIDPOINT.light;
  // Positive (good/hit-heavy) -> blue; negative (bad/miss-heavy) -> red.
  if (t >= 0) return lerpColor(gray, dark ? DIVERGING_BLUE_DARK : DIVERGING_BLUE_LIGHT, t);
  return lerpColor(gray, dark ? DIVERGING_RED_DARK : DIVERGING_RED_LIGHT, -t);
}

export function categoricalColor(index: number, dark = true): string {
  const palette = dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return palette[index % palette.length];
}

/** Normalizes a net score into [0,1] (sequential) or [-1,1] (diverging) given its context-aware range. */
export function normalizeScore(value: number, range: [number, number], scale: "sequential" | "diverging"): number {
  const [min, max] = range;
  if (scale === "sequential") {
    if (max <= min) return 0;
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  }
  const denom = value >= 0 ? max : Math.abs(min);
  if (denom === 0) return 0;
  return Math.min(1, Math.max(-1, value / denom));
}

export function scoreToColor(value: number, range: [number, number], scale: "sequential" | "diverging"): string {
  const t = normalizeScore(value, range, scale);
  return scale === "sequential" ? sequentialScale(t) : divergingScale(t);
}

/** Relative-luminance check so a data-mark's day-number label stays readable. */
export function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.45 ? "#0b0b0b" : "#ffffff";
}

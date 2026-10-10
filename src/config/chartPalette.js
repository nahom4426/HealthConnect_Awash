/**
 * Shared chart palette (chart.js needs literal colours, so these are hex — keep
 * them in sync with the design tokens in assets/wind.css).
 *
 * CATEGORICAL is validated as a set (light mode, white surface):
 *   adjacent-pair CVD separation (worst ΔE2000 8.2, tritan) and normal-vision
 *   separation (worst ΔE2000 20.3) both pass.
 *   Slots 3–5 and 7 sit below 3:1 contrast on white, so charts using them must keep
 *   a visible legend or direct labels (all charts here show a legend).
 *
 * Rules:
 * - Assign slots in order and never cycle: series beyond the 8th use OTHER.
 * - Colour follows the entity, not its rank.
 * - STATUS colours are reserved for outcomes (paid / rejected, gain / loss)
 *   and are never used as "series N".
 */
import { Chart } from "chart.js";

export const CATEGORICAL = [
  "#8f4a26", // 1 rust (Nyala brand secondary, lifted for chart legibility)
  "#2f6fbd", // 2 blue
  "#1baf7a", // 3 aqua
  "#eda100", // 4 amber
  "#e87ba4", // 5 pink
  "#a64c9e", // 6 plum
  "#0aa3c2", // 7 cyan
  "#e34948", // 8 red
];

/** Fold colour for series beyond the palette ("Other"). */
export const OTHER = "#a3a9b5";

export const STATUS = {
  good: "#15803d", // --success
  warning: "#d97706",
  critical: "#dc2626", // --error
  neutral: "#94a3b8",
};

export const INK = "#111827"; // --ink
export const INK_MUTED = "#4b5563"; // --ink-muted
export const GRID = "#eef0f4";
export const SURFACE = "#ffffff";

/** Colours for `count` series in fixed order; never cycles. */
export function seriesColors(count) {
  return Array.from({ length: count }, (_, i) => CATEGORICAL[i] ?? OTHER);
}

/** `#rrggbb` + alpha (0–1) → rgba() string, e.g. for area fills. */
export function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

let defaultsApplied = false;

/** App-wide chart.js defaults. Idempotent — call from each chart component. */
export function applyChartDefaults() {
  if (defaultsApplied) return;
  defaultsApplied = true;

  const d = Chart.defaults;
  d.font.family = '"Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  d.font.size = 12;
  d.color = INK_MUTED;
  d.borderColor = GRID;

  d.plugins.legend.labels.usePointStyle = true;
  d.plugins.legend.labels.pointStyle = "rectRounded";
  d.plugins.legend.labels.boxWidth = 8;
  d.plugins.legend.labels.boxHeight = 8;
  d.plugins.legend.labels.padding = 16;

  d.plugins.tooltip.backgroundColor = INK;
  d.plugins.tooltip.titleColor = "#ffffff";
  d.plugins.tooltip.bodyColor = "#e5e7eb";
  d.plugins.tooltip.padding = 10;
  d.plugins.tooltip.cornerRadius = 8;
  d.plugins.tooltip.boxPadding = 4;
  d.plugins.tooltip.usePointStyle = true;

  // Thin marks with rounded data ends and a 2px surface gap between fills
  d.elements.bar.borderRadius = 4;
  d.elements.bar.borderSkipped = "start";
  d.elements.arc.borderColor = SURFACE;
  d.elements.arc.borderWidth = 2;
  d.elements.line.borderWidth = 2;
  d.elements.line.tension = 0.3;
  d.elements.point.radius = 0;
  d.elements.point.hoverRadius = 5;
  d.elements.point.hitRadius = 12;
}

/** Hover behaviour for cartesian charts: one tooltip per x position. */
export const CARTESIAN_INTERACTION = { mode: "index", intersect: false };

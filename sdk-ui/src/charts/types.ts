/**
 * Shared chart types.
 * Defines the theme interface and common props used across all chart wrappers.
 */

import type { CSSProperties } from "react";

/**
 * Color palette for multi-series charts.
 * Each series gets the next color in the palette.
 * Uses CSS variables from the MCP Apps spec where possible,
 * with opacity variations for additional series.
 */
export const DEFAULT_PALETTE = [
  "var(--color-accent, #6366f1)",
  "var(--color-text-secondary, #6b7280)",
  "var(--color-ring-primary, #a78bfa)",
  "var(--color-text-tertiary, #9ca3af)",
  "var(--color-border-primary, #d1d5db)",
  "color-mix(in srgb, var(--color-accent, #6366f1) 60%, transparent)",
  "color-mix(in srgb, var(--color-accent, #6366f1) 35%, transparent)",
];

/**
 * Base props shared by all chart container wrappers.
 */
export interface ChartContainerProps {
  /** Chart height in pixels. Width is always 100% of parent. */
  height?: number;
  /** Custom color palette for series data. Overrides the default palette. */
  colorPalette?: string[];
  /** Additional CSS class on the outermost wrapper. */
  className?: string;
  /** Inline styles on the outermost wrapper. */
  style?: CSSProperties;
}

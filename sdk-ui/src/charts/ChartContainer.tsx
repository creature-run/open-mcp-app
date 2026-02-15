/**
 * ChartContainer — Responsive wrapper for all chart types.
 *
 * Wraps Recharts' ResponsiveContainer with the theme palette context.
 * All chart wrappers use this internally. Not exported directly — each
 * chart type (LineChart, BarChart, etc.) composes it.
 *
 * Applies either `.omu-chart` (default/primary border) or
 * `.omu-chart-secondary` CSS class to the container. The corresponding
 * CSS rules in charts.css override Recharts' SVG presentation attributes
 * for axis lines, tick marks, tick labels, and grid lines using
 * CSS variables. This is the most reliable theming approach because
 * CSS rules always override SVG presentation attributes.
 */

import { type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { DEFAULT_PALETTE, type ChartContainerProps } from "./types.js";
import type { ChartBorderVariant } from "./theme.js";

/**
 * Provides a responsive, themed container for a Recharts chart.
 * Fills 100% width of its parent and uses the specified height.
 */
export const ChartContainer = ({
  height = 300,
  className = "",
  style,
  borderVariant = "default",
  children,
}: ChartContainerProps & { children: ReactNode; borderVariant?: ChartBorderVariant }) => {
  const baseClass = borderVariant === "secondary" ? "omu-chart-secondary" : "omu-chart";

  return (
    <div
      className={`${baseClass} w-full ${className}`}
      style={{ height: `${height}px`, ...style }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Get the color for a given series index from the palette.
 * Wraps around if there are more series than palette entries.
 */
export const getSeriesColor = ({
  index,
  palette,
}: {
  index: number;
  palette?: string[];
}): string => {
  const colors = palette ?? DEFAULT_PALETTE;
  return colors[index % colors.length];
};

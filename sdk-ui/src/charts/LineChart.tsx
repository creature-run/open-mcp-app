/**
 * LineChart — Themed line/trend chart wrapper.
 *
 * Thin wrapper around Recharts' LineChart that auto-applies
 * MCP Apps spec CSS variable theming to all visual elements.
 *
 * @example
 * ```tsx
 * import { LineChart, Line, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";
 *
 * <LineChart data={data} height={300}>
 *   <XAxis dataKey="month" />
 *   <YAxis />
 *   <Tooltip />
 *   <Line dataKey="revenue" />
 * </LineChart>
 * ```
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { getGridColor } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedLineChartProps extends ChartContainerProps {
  /** Chart data array. Each entry is one data point. */
  data: Record<string, unknown>[];
  /** Child elements (Line, XAxis, YAxis, Tooltip, Legend, etc.) */
  children: ReactNode;
  /** Show background grid lines. */
  grid?: boolean;
}

/**
 * Themed LineChart.
 * Automatically assigns palette colors to Line children that
 * don't have an explicit stroke prop.
 */
export const LineChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  grid = true,
  children,
}: ThemedLineChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if ((child.type as any) === RechartsLine || (child.type as any)?.displayName === "Line") {
      const idx = seriesIndex++;
      const existing = (child.props as any).stroke;
      return cloneElement(child as React.ReactElement<any>, {
        stroke: existing || getSeriesColor({ index: idx, palette: colorPalette }),
        strokeWidth: (child.props as any).strokeWidth ?? 2,
        dot: (child.props as any).dot ?? false,
        activeDot: (child.props as any).activeDot ?? { r: 4 },
      });
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} opacity={0.5} />}
        {themedChildren}
      </RechartsLineChart>
    </ChartContainer>
  );
};

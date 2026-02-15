/**
 * BarChart — Themed bar/column chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { themeAxisChild, type ChartBorderVariant } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedBarChartProps extends ChartContainerProps {
  /** Chart data array. */
  data: Record<string, unknown>[];
  children: ReactNode;
  grid?: boolean;
  /**
   * Border variant for axis lines and tick marks.
   * - "default" — uses --color-border-primary (stronger)
   * - "secondary" — uses --color-border-secondary (subtler)
   */
  borderVariant?: ChartBorderVariant;
}

/**
 * Themed BarChart.
 * Automatically assigns palette colors to Bar children and
 * applies themed axis styles to XAxis/YAxis children.
 */
export const BarChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  grid = true,
  borderVariant = "default",
  children,
}: ThemedBarChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const themedAxis = themeAxisChild({ child: child as React.ReactElement<any>, variant: borderVariant, XAxis: RechartsXAxis, YAxis: RechartsYAxis, CartesianGrid });
    if (themedAxis) return themedAxis;

    if ((child.type as any) === RechartsBar || (child.type as any)?.displayName === "Bar") {
      const idx = seriesIndex++;
      const existing = (child.props as any).fill;
      return cloneElement(child as React.ReactElement<any>, {
        fill: existing || getSeriesColor({ index: idx, palette: colorPalette }),
        radius: (child.props as any).radius ?? [4, 4, 0, 0],
      });
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style} borderVariant={borderVariant}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        {themedChildren}
      </RechartsBarChart>
    </ChartContainer>
  );
};

/**
 * ScatterChart — Themed scatter/correlation chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  ScatterChart as RechartsScatterChart,
  Scatter as RechartsScatter,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { themeAxisChild, type ChartBorderVariant } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedScatterChartProps extends ChartContainerProps {
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
 * Themed ScatterChart.
 * Auto-assigns palette fill colors to Scatter children and
 * applies themed axis styles to XAxis/YAxis children.
 */
export const ScatterChart = ({
  height,
  colorPalette,
  className,
  style,
  grid = true,
  borderVariant = "default",
  children,
}: ThemedScatterChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const themedAxis = themeAxisChild({ child: child as React.ReactElement<any>, variant: borderVariant, XAxis: RechartsXAxis, YAxis: RechartsYAxis, CartesianGrid });
    if (themedAxis) return themedAxis;

    if ((child.type as any) === RechartsScatter || (child.type as any)?.displayName === "Scatter") {
      const idx = seriesIndex++;
      const existing = (child.props as any).fill;
      return cloneElement(child as React.ReactElement<any>, {
        fill: existing || getSeriesColor({ index: idx, palette: colorPalette }),
      });
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style} borderVariant={borderVariant}>
      <RechartsScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        {themedChildren}
      </RechartsScatterChart>
    </ChartContainer>
  );
};

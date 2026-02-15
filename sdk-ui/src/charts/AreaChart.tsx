/**
 * AreaChart — Themed area/volume chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { themeAxisChild, type ChartBorderVariant } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedAreaChartProps extends ChartContainerProps {
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
 * Themed AreaChart.
 * Auto-assigns palette colors with gradient fill to Area children and
 * applies themed axis styles to XAxis/YAxis children.
 */
export const AreaChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  grid = true,
  borderVariant = "default",
  children,
}: ThemedAreaChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const themedAxis = themeAxisChild({ child: child as React.ReactElement<any>, variant: borderVariant, XAxis: RechartsXAxis, YAxis: RechartsYAxis, CartesianGrid });
    if (themedAxis) return themedAxis;

    if ((child.type as any) === RechartsArea || (child.type as any)?.displayName === "Area") {
      const idx = seriesIndex++;
      const color = (child.props as any).stroke || getSeriesColor({ index: idx, palette: colorPalette });
      return cloneElement(child as React.ReactElement<any>, {
        stroke: color,
        fill: (child.props as any).fill || color,
        fillOpacity: (child.props as any).fillOpacity ?? 0.15,
        strokeWidth: (child.props as any).strokeWidth ?? 2,
      });
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style} borderVariant={borderVariant}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        {themedChildren}
      </RechartsAreaChart>
    </ChartContainer>
  );
};

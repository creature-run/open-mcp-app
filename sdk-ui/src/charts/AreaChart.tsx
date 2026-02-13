/**
 * AreaChart — Themed area/volume chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { getGridColor } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedAreaChartProps extends ChartContainerProps {
  data: Record<string, unknown>[];
  children: ReactNode;
  grid?: boolean;
}

/**
 * Themed AreaChart.
 * Auto-assigns palette colors with gradient fill to Area children.
 */
export const AreaChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  grid = true,
  children,
}: ThemedAreaChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
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
    <ChartContainer height={height} className={className} style={style}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} opacity={0.5} />}
        {themedChildren}
      </RechartsAreaChart>
    </ChartContainer>
  );
};

/**
 * ScatterChart — Themed scatter/correlation chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  ScatterChart as RechartsScatterChart,
  Scatter as RechartsScatter,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { getGridColor } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedScatterChartProps extends ChartContainerProps {
  children: ReactNode;
  grid?: boolean;
}

/**
 * Themed ScatterChart.
 * Auto-assigns palette fill colors to Scatter children.
 */
export const ScatterChart = ({
  height,
  colorPalette,
  className,
  style,
  grid = true,
  children,
}: ThemedScatterChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
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
    <ChartContainer height={height} className={className} style={style}>
      <RechartsScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" stroke={getGridColor()} opacity={0.5} />}
        {themedChildren}
      </RechartsScatterChart>
    </ChartContainer>
  );
};

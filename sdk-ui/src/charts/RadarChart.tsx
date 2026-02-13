/**
 * RadarChart — Themed radar/spider chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  RadarChart as RechartsRadarChart,
  Radar as RechartsRadar,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedRadarChartProps extends ChartContainerProps {
  data: Record<string, unknown>[];
  children: ReactNode;
}

/**
 * Themed RadarChart.
 * Auto-assigns palette colors to Radar children.
 */
export const RadarChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  children,
}: ThemedRadarChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if ((child.type as any) === RechartsRadar || (child.type as any)?.displayName === "Radar") {
      const idx = seriesIndex++;
      const color = (child.props as any).stroke || getSeriesColor({ index: idx, palette: colorPalette });
      return cloneElement(child as React.ReactElement<any>, {
        stroke: color,
        fill: (child.props as any).fill || color,
        fillOpacity: (child.props as any).fillOpacity ?? 0.2,
      });
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        {themedChildren}
      </RechartsRadarChart>
    </ChartContainer>
  );
};

/**
 * PieChart — Themed pie/donut chart wrapper.
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedPieChartProps extends Omit<ChartContainerProps, "height"> {
  /** Chart height (also used for approximate width in responsive container). */
  height?: number;
  children: ReactNode;
}

/**
 * Themed PieChart.
 * Auto-assigns palette colors to Pie data via Cell children when no
 * explicit fill is provided on individual data entries.
 */
export const PieChart = ({
  height,
  colorPalette,
  className,
  style,
  children,
}: ThemedPieChartProps) => {
  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if ((child.type as any) === RechartsPie || (child.type as any)?.displayName === "Pie") {
      const props = child.props as any;
      const data: any[] = props.data ?? [];
      /**
       * If the Pie has no Cell children, inject them automatically
       * so each slice gets a palette color.
       */
      const hasExplicitCells = Children.toArray(props.children).some(
        (c: any) => isValidElement(c) && ((c.type as any) === Cell || (c.type as any)?.displayName === "Cell")
      );
      if (!hasExplicitCells && data.length > 0) {
        return cloneElement(child as React.ReactElement<any>, {
          children: data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={getSeriesColor({ index: i, palette: colorPalette })} />
          )),
        });
      }
    }
    return child;
  });

  return (
    <ChartContainer height={height} className={className} style={style}>
      <RechartsPieChart>
        {themedChildren}
      </RechartsPieChart>
    </ChartContainer>
  );
};

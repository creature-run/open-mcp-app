/**
 * ComposedChart — Themed mixed chart wrapper (Bar + Line + Area in one).
 */

import React, { type ReactNode, Children, cloneElement, isValidElement } from "react";
import {
  ComposedChart as RechartsComposedChart,
  Line as RechartsLine,
  Bar as RechartsBar,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, getSeriesColor } from "./ChartContainer.js";
import { themeAxisChild, type ChartBorderVariant } from "./theme.js";
import type { ChartContainerProps } from "./types.js";

interface ThemedComposedChartProps extends ChartContainerProps {
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
 * Themed ComposedChart.
 * Auto-assigns palette colors to Line, Bar, and Area children and
 * applies themed axis styles to XAxis/YAxis children.
 */
export const ComposedChart = ({
  data,
  height,
  colorPalette,
  className,
  style,
  grid = true,
  borderVariant = "default",
  children,
}: ThemedComposedChartProps) => {
  let seriesIndex = 0;

  const themedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const themedAxis = themeAxisChild({ child: child as React.ReactElement<any>, variant: borderVariant, XAxis: RechartsXAxis, YAxis: RechartsYAxis, CartesianGrid });
    if (themedAxis) return themedAxis;

    const t = child.type as any;
    const dn = t?.displayName;

    if (t === RechartsLine || dn === "Line") {
      const idx = seriesIndex++;
      return cloneElement(child as React.ReactElement<any>, {
        stroke: (child.props as any).stroke || getSeriesColor({ index: idx, palette: colorPalette }),
        strokeWidth: (child.props as any).strokeWidth ?? 2,
        dot: (child.props as any).dot ?? false,
      });
    }
    if (t === RechartsBar || dn === "Bar") {
      const idx = seriesIndex++;
      return cloneElement(child as React.ReactElement<any>, {
        fill: (child.props as any).fill || getSeriesColor({ index: idx, palette: colorPalette }),
        radius: (child.props as any).radius ?? [4, 4, 0, 0],
      });
    }
    if (t === RechartsArea || dn === "Area") {
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
      <RechartsComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        {themedChildren}
      </RechartsComposedChart>
    </ChartContainer>
  );
};

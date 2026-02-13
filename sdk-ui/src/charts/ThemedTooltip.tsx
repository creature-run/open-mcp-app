/**
 * ThemedTooltip — Pre-themed tooltip using MCP Apps spec CSS variables.
 *
 * Drop-in replacement for Recharts' Tooltip that automatically
 * applies the host's theme colors for background, text, border.
 */

import { useMemo } from "react";
import { Tooltip as RechartsTooltip } from "recharts";
import { getTooltipStyle } from "./theme.js";

/**
 * A themed Tooltip that reads CSS variables at render time.
 * Forwards all standard Recharts Tooltip props.
 */
export const ThemedTooltip = (props: any) => {
  const style = useMemo(() => getTooltipStyle(), []);
  return (
    <RechartsTooltip
      contentStyle={style.contentStyle}
      labelStyle={style.labelStyle}
      cursor={{ stroke: "var(--color-border-secondary, #e5e7eb)", strokeWidth: 1 }}
      {...props}
    />
  );
};

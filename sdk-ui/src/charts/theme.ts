/**
 * Chart Theme — CSS variable mapping for Recharts.
 *
 * Reads MCP Apps spec CSS variables at render time and provides
 * them as style objects for Recharts sub-components (tooltip, grid,
 * axis labels, legend). This is how charts automatically adapt to
 * the host's theme without configuration.
 */

/**
 * Resolve a CSS variable value at runtime.
 * Falls back to the provided default if the variable is not set.
 */
export const getCSSVar = ({ name, fallback }: { name: string; fallback: string }): string => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

/**
 * Themed tooltip style object for Recharts <Tooltip>.
 * Applied via contentStyle, labelStyle, and wrapperStyle props.
 */
export const getTooltipStyle = () => ({
  contentStyle: {
    backgroundColor: getCSSVar({ name: "--color-background-secondary", fallback: "#f9fafb" }),
    border: `1px solid ${getCSSVar({ name: "--color-border-secondary", fallback: "#e5e7eb" })}`,
    borderRadius: getCSSVar({ name: "--border-radius-md", fallback: "8px" }),
    color: getCSSVar({ name: "--color-text-primary", fallback: "#111827" }),
    fontSize: getCSSVar({ name: "--font-text-sm-size", fallback: "13px" }),
    fontFamily: getCSSVar({ name: "--font-sans", fallback: "ui-sans-serif, system-ui, sans-serif" }),
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  labelStyle: {
    color: getCSSVar({ name: "--color-text-primary", fallback: "#111827" }),
    fontWeight: 500,
    marginBottom: "4px",
  },
});

/**
 * Themed grid line color for <CartesianGrid>.
 */
export const getGridColor = (): string =>
  getCSSVar({ name: "--color-border-secondary", fallback: "#e5e7eb" });

/**
 * Themed axis tick/label style for <XAxis> and <YAxis>.
 */
export const getAxisStyle = () => ({
  tick: {
    fill: getCSSVar({ name: "--color-text-secondary", fallback: "#6b7280" }),
    fontSize: getCSSVar({ name: "--font-text-xs-size", fallback: "11px" }),
    fontFamily: getCSSVar({ name: "--font-sans", fallback: "ui-sans-serif, system-ui, sans-serif" }),
  },
  axisLine: {
    stroke: getCSSVar({ name: "--color-border-secondary", fallback: "#e5e7eb" }),
  },
  tickLine: {
    stroke: getCSSVar({ name: "--color-border-secondary", fallback: "#e5e7eb" }),
  },
});

/**
 * Themed legend style for <Legend>.
 */
export const getLegendStyle = () => ({
  color: getCSSVar({ name: "--color-text-secondary", fallback: "#6b7280" }),
  fontSize: getCSSVar({ name: "--font-text-sm-size", fallback: "13px" }),
  fontFamily: getCSSVar({ name: "--font-sans", fallback: "ui-sans-serif, system-ui, sans-serif" }),
});

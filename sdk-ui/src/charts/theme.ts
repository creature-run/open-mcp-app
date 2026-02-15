import React from "react";

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
 *
 * Recharts requires resolved color values for SVG attributes (stroke, fill)
 * because SVG doesn't support var() in most attributes. We check both
 * document.documentElement (inline styles set by the host SDK) and
 * document.body as a fallback, since hosts may inject CSS variables
 * on either element.
 */
export const getCSSVar = ({ name, fallback }: { name: string; fallback: string }): string => {
  if (typeof window === "undefined") return fallback;

  /* Try inline style first (faster, no reflow) — hosts set vars via setProperty */
  const root = document.documentElement;
  let value = root.style.getPropertyValue(name).trim();

  /* Fall back to computed style (catches vars set via stylesheets / :root) */
  if (!value) {
    value = getComputedStyle(root).getPropertyValue(name).trim();
  }

  /* Some hosts inject on <body> instead */
  if (!value && document.body) {
    value = document.body.style.getPropertyValue(name).trim();
    if (!value) {
      value = getComputedStyle(document.body).getPropertyValue(name).trim();
    }
  }

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
 * Border variant type shared across chart sub-components.
 * - "default" uses --color-border-primary (stronger)
 * - "secondary" uses --color-border-secondary (subtler)
 */
export type ChartBorderVariant = "default" | "secondary";

/**
 * Resolve the border CSS variable for the given variant.
 */
const getBorderColor = ({ variant = "default" }: { variant?: ChartBorderVariant } = {}): string =>
  variant === "secondary"
    ? getCSSVar({ name: "--color-border-secondary", fallback: "#e5e7eb" })
    : getCSSVar({ name: "--color-border-primary", fallback: "#d1d5db" });

/**
 * Themed grid line color for <CartesianGrid>.
 * Grids default to secondary (subtle background lines).
 */
export const getGridColor = ({ variant = "secondary" }: { variant?: ChartBorderVariant } = {}): string =>
  getBorderColor({ variant });

/**
 * Themed axis tick/label style for <XAxis> and <YAxis>.
 * Axis lines default to primary (visible structural lines).
 */
export const getAxisStyle = ({ variant = "default" }: { variant?: ChartBorderVariant } = {}) => ({
  tick: {
    fill: getCSSVar({ name: "--color-text-secondary", fallback: "#6b7280" }),
    fontSize: getCSSVar({ name: "--font-text-xs-size", fallback: "11px" }),
    fontFamily: getCSSVar({ name: "--font-sans", fallback: "ui-sans-serif, system-ui, sans-serif" }),
  },
  axisLine: {
    stroke: getBorderColor({ variant }),
  },
  tickLine: {
    stroke: getBorderColor({ variant }),
  },
});

/**
 * Apply themed styles to axis and grid children via cloneElement.
 *
 * Recharts identifies axis/grid components by child.type, so wrapping them
 * in custom components breaks chart rendering. Instead, chart wrappers
 * call this in their Children.map loop to inject theme props while
 * preserving the original Recharts component type.
 *
 * Handles XAxis, YAxis (tick/axisLine/tickLine) and CartesianGrid
 * (stroke + 50% opacity). Returns a cloned element with themed props,
 * or null if the child is not a recognized chart structural component.
 */
export const themeAxisChild = ({
  child,
  variant = "default",
  XAxis,
  YAxis,
  CartesianGrid,
}: {
  child: React.ReactElement<any>;
  variant?: ChartBorderVariant;
  XAxis: any;
  YAxis: any;
  CartesianGrid?: any;
}): React.ReactElement<any> | null => {
  const t = child.type as any;
  const dn = t?.displayName;

  if (t === XAxis || t === YAxis || dn === "XAxis" || dn === "YAxis") {
    const style = getAxisStyle({ variant });
    const props = child.props as any;
    return React.cloneElement(child, {
      tick: props.tick === false ? false : { ...style.tick, ...(typeof props.tick === "object" && props.tick ? props.tick : {}) },
      axisLine: props.axisLine === false ? false : { ...style.axisLine, ...(typeof props.axisLine === "object" && props.axisLine ? props.axisLine : {}) },
      tickLine: props.tickLine === false ? false : { ...style.tickLine, ...(typeof props.tickLine === "object" && props.tickLine ? props.tickLine : {}) },
    });
  }

  if (CartesianGrid && (t === CartesianGrid || dn === "CartesianGrid")) {
    const props = child.props as any;
    return React.cloneElement(child, {
      stroke: props.stroke ?? getGridColor({ variant }),
      opacity: props.opacity ?? 0.5,
    });
  }

  return null;
};

/**
 * Themed legend style for <Legend>.
 */
export const getLegendStyle = () => ({
  color: getCSSVar({ name: "--color-text-secondary", fallback: "#6b7280" }),
  fontSize: getCSSVar({ name: "--font-text-sm-size", fallback: "13px" }),
  fontFamily: getCSSVar({ name: "--font-sans", fallback: "ui-sans-serif, system-ui, sans-serif" }),
});

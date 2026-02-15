/**
 * open-mcp-app-ui/charts
 *
 * Themed chart components built on Recharts v3.
 * Auto-styled via MCP Apps spec CSS variables.
 *
 * Usage:
 *   import { LineChart, Line, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";
 *
 *   <LineChart data={data} height={300}>
 *     <XAxis dataKey="month" />
 *     <YAxis />
 *     <Tooltip />
 *     <Line dataKey="revenue" />
 *   </LineChart>
 */

// Themed chart wrappers
export { LineChart } from "./LineChart.js";
export { BarChart } from "./BarChart.js";
export { AreaChart } from "./AreaChart.js";
export { PieChart } from "./PieChart.js";
export { ScatterChart } from "./ScatterChart.js";
export { RadarChart } from "./RadarChart.js";
export { ComposedChart } from "./ComposedChart.js";
export { ThemedTooltip as Tooltip } from "./ThemedTooltip.js";

// Re-export Recharts primitives for composition
export {
  Line,
  Bar,
  Area,
  Pie,
  Scatter,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

// Theme utilities for raw Recharts usage and advanced customization
export {
  type ChartBorderVariant,
  getCSSVar,
  getGridColor,
  getAxisStyle,
  getTooltipStyle,
  getLegendStyle,
} from "./theme.js";

// Types
export type { ChartContainerProps } from "./types.js";
export { DEFAULT_PALETTE } from "./types.js";

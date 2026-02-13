# Charts

Themed chart components built on Recharts. Auto-styled via MCP Apps spec CSS variables — charts adapt to the host's theme without configuration.

**Separate import:**

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";
```

All chart types and sub-components come from `open-mcp-app-ui/charts`.

---

## Chart Types

### LineChart

Time series, trends. Curved or straight lines.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Record<string, unknown>[]` | required | Data array |
| height | `number` | `300` | Chart height in pixels |
| grid | `boolean` | `true` | Show CartesianGrid |
| colorPalette | `string[]` | theme palette | Custom series colors |
| className | `string` | `""` | Wrapper class |

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "open-mcp-app-ui/charts";

<LineChart data={monthlyData} height={300}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line dataKey="revenue" name="Revenue" />
  <Line dataKey="costs" name="Costs" />
</LineChart>
```

### BarChart

Comparisons, categories. Vertical columns by default.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Record<string, unknown>[]` | required | Data array |
| height | `number` | `300` | Chart height |
| grid | `boolean` | `true` | Show CartesianGrid |
| colorPalette | `string[]` | theme palette | Custom series colors |

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<BarChart data={salesData} height={300}>
  <XAxis dataKey="category" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="sales" name="Sales" />
  <Bar dataKey="returns" name="Returns" />
</BarChart>
```

### AreaChart

Volume, cumulative trends. Gradient fill with opacity.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Record<string, unknown>[]` | required | Data array |
| height | `number` | `300` | Chart height |
| grid | `boolean` | `true` | Show CartesianGrid |
| colorPalette | `string[]` | theme palette | Custom series colors |

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<AreaChart data={trafficData} height={300}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Area dataKey="visitors" name="Visitors" />
</AreaChart>
```

### PieChart

Proportions. Use `innerRadius` on `<Pie>` for donut variant.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| height | `number` | `300` | Chart height |
| colorPalette | `string[]` | theme palette | Slice colors |

```tsx
import { PieChart, Pie, Tooltip, Legend } from "open-mcp-app-ui/charts";

{/* Pie */}
<PieChart height={300}>
  <Tooltip />
  <Legend />
  <Pie data={distribution} dataKey="value" nameKey="label" />
</PieChart>

{/* Donut */}
<PieChart height={300}>
  <Tooltip />
  <Pie data={distribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} />
</PieChart>
```

### ScatterChart

Correlations, distributions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| height | `number` | `300` | Chart height |
| grid | `boolean` | `true` | Show CartesianGrid |
| colorPalette | `string[]` | theme palette | Series colors |

```tsx
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<ScatterChart height={300}>
  <XAxis dataKey="x" name="Weight" />
  <YAxis dataKey="y" name="Height" />
  <Tooltip />
  <Scatter data={measurements} name="Subjects" />
</ScatterChart>
```

### RadarChart

Multi-dimensional comparison (skills, ratings).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Record<string, unknown>[]` | required | Data array |
| height | `number` | `300` | Chart height |
| colorPalette | `string[]` | theme palette | Series colors |

```tsx
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip } from "open-mcp-app-ui/charts";

<RadarChart data={skills} height={300}>
  <PolarGrid />
  <PolarAngleAxis dataKey="skill" />
  <Tooltip />
  <Radar dataKey="score" name="Score" />
</RadarChart>
```

### ComposedChart

Mix Bar + Line + Area in one chart.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Record<string, unknown>[]` | required | Data array |
| height | `number` | `300` | Chart height |
| grid | `boolean` | `true` | Show CartesianGrid |
| colorPalette | `string[]` | theme palette | Series colors |

```tsx
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<ComposedChart data={overview} height={300}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="volume" name="Volume" />
  <Line dataKey="average" name="Average" />
  <Area dataKey="trend" name="Trend" />
</ComposedChart>
```

---

## Sub-components (re-exported from Recharts)

| Component | Purpose |
|-----------|---------|
| `<XAxis>` | Horizontal axis. `dataKey` maps to data field. |
| `<YAxis>` | Vertical axis. |
| `<Tooltip>` | Hover tooltip (auto-themed by default). |
| `<Legend>` | Chart legend. |
| `<CartesianGrid>` | Background grid lines. |
| `<PolarGrid>` | Radar/polar grid. |
| `<PolarAngleAxis>` | Radar angle labels. `dataKey` for label field. |
| `<Line>` | Line series. `dataKey` required. |
| `<Bar>` | Bar series. `dataKey` required. |
| `<Area>` | Area series. `dataKey` required. |
| `<Pie>` | Pie series. `data` + `dataKey` required. `nameKey` for labels. |
| `<Scatter>` | Scatter series. `data` required. |
| `<Radar>` | Radar series. `dataKey` required. |
| `<Cell>` | Per-item styling in Pie/Bar. |
| `<ReferenceLine>` | Annotation line (`y={value}` or `x={value}`). |
| `<ReferenceArea>` | Annotation region. |

---

## Theming

Charts auto-theme via CSS variables:

- **Series colors**: From `--color-accent`, `--color-text-secondary`, `--color-ring-primary`, etc.
- **Grid lines**: `--color-border-secondary` at low opacity
- **Axis labels**: `--color-text-secondary`, `--font-sans`
- **Tooltip**: `--color-background-secondary` bg, `--color-text-primary` text, `--color-border-secondary` border

Override palette per chart:

```tsx
<BarChart data={data} height={300} colorPalette={["#e74c3c", "#2ecc71", "#3498db"]}>
  <Bar dataKey="a" />
  <Bar dataKey="b" />
  <Bar dataKey="c" />
</BarChart>
```

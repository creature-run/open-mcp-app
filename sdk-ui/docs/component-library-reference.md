# open-mcp-app-ui — Component Library Reference

UI components for MCP Apps. All components are styled via MCP Apps spec CSS variables and work on any host (Creature, ChatGPT, Claude Desktop).

## Setup

**app.tsx:**

```tsx
import { HostProvider, useHost } from "open-mcp-app/react";
import { AppLayout } from "open-mcp-app-ui";
import "open-mcp-app-ui/styles.css";
import "./styles.css";

// Import components as needed
import { Button, Input, Card, Heading, Text } from "open-mcp-app-ui";

// Optional heavy components (separate imports)
import { DataTable } from "open-mcp-app-ui/table";
import { Editor } from "open-mcp-app-ui/editor";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

// Icons (bundled dependency — no extra install)
import { Plus, Trash2, Settings } from "lucide-react";
```

**styles.css:**

```css
@import "open-mcp-app/styles/tailwind.css";

html, body, #root {
  height: 100%;
  margin: 0;
}
```

The Tailwind import in `styles.css` generates utility classes for your app's source files. The `open-mcp-app-ui/styles.css` import provides pre-compiled CSS for the library's own components. Both are required.

---

## Fonts

The host injects two font families via CSS variables. Use the corresponding Tailwind classes:

| CSS Variable | Tailwind Class | Description |
|---|---|---|
| `--font-sans` | `font-sans` | Primary UI font. Applied to body text, headings, buttons, inputs — everything by default. |
| `--font-mono` | `font-mono` | Monospace font. Use for code, terminal output, technical data, IDs, hashes, timestamps, JSON, file paths, and anything where character alignment matters. |

### When to use `font-mono`

- **Code snippets and inline code** — variable names, function calls, shell commands
- **Technical identifiers** — UUIDs, API keys, commit hashes, order IDs
- **Tabular numeric data** — prices, counts, metrics where digits should align vertically
- **Log output and terminal-style displays** — structured text where spacing is meaningful
- **File paths and URLs** — `/src/components/App.tsx`, `https://api.example.com`
- **JSON/YAML previews** — structured data formats

```tsx
{/* Inline code reference */}
<Text>Run <span className="font-mono text-sm bg-bg-secondary px-1 py-0.5 rounded">npm install</span> to get started.</Text>

{/* Technical ID */}
<Text variant="secondary" size="sm" className="font-mono">order-4f8a2b91</Text>

{/* Log-style output */}
<div className="font-mono text-sm bg-bg-secondary p-3 rounded">
  [2026-02-10 14:32:01] Connected to database
  [2026-02-10 14:32:02] Server listening on :8080
</div>
```

The `CodeBlock` and `Editor` components already apply the monospace font automatically for code content — you don't need to add `font-mono` to those.

---

## Layout & Display Mode

MCP Apps run in three display modes: `"inline"` (60–300px tall, inside conversation), `"pip"` (sidebar tab), and `"fullscreen"`. Use `<AppLayout>` and `<Show>` to adapt.

### AppLayout

Display-mode-aware root layout. Uses two nested divs internally: an outer scroll container (no padding, so overflow never clips full-bleed children) and an inner wrapper with adaptive padding/gap.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| displayMode | `"inline" \| "pip" \| "fullscreen"` | `"pip"` | Current display mode. Pass `hostContext?.displayMode`. |
| availableDisplayModes | `DisplayMode[]` | `[displayMode]` | Modes the host supports. |
| noPadding | `boolean` | `false` | Remove inner padding/gap. Children get full edge-to-edge control. |
| className | `string` | `""` | Additional CSS classes on the outer scroll container. |
| children | `ReactNode` | — | Content. |

```tsx
<AppLayout displayMode={hostContext?.displayMode} availableDisplayModes={hostContext?.availableDisplayModes}>
  <MainView />
</AppLayout>

{/* Full-bleed: no padding, manual spacing */}
<AppLayout displayMode={hostContext?.displayMode} noPadding>
  <StickyHeader />
  <div className="p-3 flex flex-col gap-3">
    <Content />
  </div>
</AppLayout>
```

### Show

Conditional render by display mode.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| on | `DisplayMode \| DisplayMode[]` | — | Mode(s) to render in. |
| fallback | `ReactNode` | — | Content when mode doesn't match. |
| children | `ReactNode` | — | Content to conditionally render. |

```tsx
<Show on="inline"><Text>Compact summary</Text></Show>
<Show on={["pip", "fullscreen"]}><DetailedList /></Show>
```

### useDisplayMode

Hook for programmatic display mode access.

```tsx
const { displayMode, isInline, isPip, isFullscreen, availableDisplayModes } = useDisplayMode();
```

### Tailwind Display Mode Variants

Built into the SDK's Tailwind CSS — no extra import needed. CSS-level adaptation using `data-display-mode` attribute selectors:

```tsx
<div className="text-sm inline:text-xs fullscreen:text-base">Adaptive text</div>
<div className="hidden pip:block fullscreen:block">Hidden in inline</div>
```

---

## Typography

### Heading

Semantic heading (h1–h6) with independent visual size control.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| level | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | HTML heading level. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl"` | `"md"` | Visual size. |
| children | `ReactNode` | — | Content. |

```tsx
<Heading size="lg">Page Title</Heading>
<Heading level={3} size="sm">Subsection</Heading>
```

### Text

Body text wrapper with semantic variants.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "tertiary"` | `"primary"` | Text color variant. |
| size | `"xs" \| "sm" \| "base" \| "lg"` | `"base"` | Font size. |
| as | `ElementType` | `"p"` | HTML element. |
| children | `ReactNode` | — | Content. |

```tsx
<Text>Primary body text</Text>
<Text variant="secondary" size="sm">Description text</Text>
<Text variant="tertiary" as="span" size="xs">Timestamp</Text>
```

---

## Form Controls

### Button

Action button with semantic variants and loading state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Visual style. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Button size. |
| loading | `boolean` | `false` | Show loading spinner and disable. |
| loadingIcon | `ReactNode` | — | Custom spinner element. |
| disabled | `boolean` | `false` | Disables the button. |
| children | `ReactNode` | — | Button label. |

```tsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
<Button variant="ghost" loading>Processing...</Button>
```

### Input

Text input with label, error, and helper text.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the input. |
| error | `string` | — | Error message. Shows error styling. |
| helperText | `string` | — | Helper text below. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Input size. |
| block | `boolean` | `true` | Full width. |

```tsx
<Input label="Name" placeholder="Enter name..." value={name} onChange={(e) => setName(e.target.value)} />
<Input label="Email" error="Invalid email" value={email} onChange={(e) => setEmail(e.target.value)} />
```

### Textarea

Multi-line text input with label and error handling.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| error | `string` | — | Error message. |
| helperText | `string` | — | Helper text below. |
| rows | `number` | `3` | Visible rows. |
| resize | `"none" \| "vertical" \| "both"` | `"vertical"` | Resize behavior. |

```tsx
<Textarea label="Description" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
```

### Select

Custom dropdown select with keyboard navigation and check marks.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| options | `SelectOption[] \| SelectOptionGroup[]` | — | Options (flat or grouped). |
| value | `string` | `""` | Controlled value. |
| onChange | `(value: string) => void` | — | Selection change handler. |
| placeholder | `string` | `"Select..."` | Placeholder text. |
| error | `string` | — | Error message. |
| helperText | `string` | — | Helper text. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size. |
| disabled | `boolean` | `false` | Disabled state. |

```tsx
<Select
  label="Status"
  options={[{ value: "active", label: "Active" }, { value: "archived", label: "Archived" }]}
  value={status}
  onChange={setStatus}
/>
```

### Checkbox

Animated checkbox with optional label.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label text. |
| checked | `boolean` | `false` | Controlled checked state. |
| onChange | `ChangeEventHandler` | — | Change handler. |
| disabled | `boolean` | `false` | Disabled state. |

```tsx
<Checkbox label="Accept terms" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
```

### Switch

Toggle switch for on/off states.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label text. |
| checked | `boolean` | `false` | Controlled state. |
| onChange | `ChangeEventHandler` | — | Change handler. |
| disabled | `boolean` | `false` | Disabled state. |

```tsx
<Switch label="Dark mode" checked={dark} onChange={(e) => setDark(e.target.checked)} />
```

### RadioGroup

Radio option group with animated selection indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Selected value. |
| onChange | `(value: string) => void` | — | Selection change handler. |
| aria-label | `string` | — | Accessible label. |
| direction | `"row" \| "col"` | `"col"` | Layout direction. |
| disabled | `boolean` | `false` | Disables the group. |

```tsx
<RadioGroup value={size} onChange={setSize} aria-label="Size">
  <RadioGroup.Item value="sm">Small</RadioGroup.Item>
  <RadioGroup.Item value="md">Medium</RadioGroup.Item>
  <RadioGroup.Item value="lg">Large</RadioGroup.Item>
</RadioGroup>
```

### Slider

Range slider with optional value display and formatting.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| value | `number` | — | Current value. |
| min | `number` | `0` | Minimum. |
| max | `number` | `100` | Maximum. |
| step | `number` | `1` | Step increment. |
| showValue | `boolean` | `false` | Show current value. |
| formatValue | `(v: number) => string` | — | Value format function. |
| onChange | `ChangeEventHandler` | — | Change handler. |

```tsx
<Slider label="Volume" value={vol} onChange={(e) => setVol(+e.target.value)} showValue />
```

### TagInput

Multi-tag input with validation and keyboard support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| value | `Tag[]` | — | Controlled tag list. `Tag = { value: string; valid: boolean }` |
| onChange | `(tags: Tag[]) => void` | — | Change handler. |
| validator | `(value: string) => boolean` | — | Validation function. |
| maxTags | `number` | — | Maximum tags. |
| placeholder | `string` | `"Add a tag..."` | Placeholder. |

```tsx
<TagInput label="Tags" value={tags} onChange={setTags} placeholder="Type and press Enter..." />
```

### DatePicker

Custom date picker with calendar dropdown.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| value | `string` | `""` | Date value (YYYY-MM-DD). |
| onChange | `(value: string) => void` | — | Selection handler. |
| min | `string` | — | Min date (YYYY-MM-DD). |
| max | `string` | — | Max date (YYYY-MM-DD). |
| placeholder | `string` | `"Select date"` | Placeholder. |
| error | `string` | — | Error message. |

```tsx
<DatePicker label="Start Date" value={date} onChange={setDate} />
```

### DateRangePicker

Two coordinated date pickers for start/end range.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above. |
| startDate | `string` | `""` | Start date (YYYY-MM-DD). |
| endDate | `string` | `""` | End date (YYYY-MM-DD). |
| onChange | `(range: { startDate: string; endDate: string }) => void` | — | Change handler. |

```tsx
<DateRangePicker label="Date Range" startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
```

### ToggleGroup

Segmented control with animated sliding indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Selected value. |
| onChange | `(value: string) => void` | — | Selection handler. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |
| block | `boolean` | `false` | Full width. |
| pill | `boolean` | `false` | Pill shape. |

```tsx
<ToggleGroup value={view} onChange={setView} aria-label="View">
  <ToggleGroup.Option value="grid">Grid</ToggleGroup.Option>
  <ToggleGroup.Option value="list">List</ToggleGroup.Option>
</ToggleGroup>
```

---

## Feedback & Overlays

### Alert

Status banner with color and style variants.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| color | `"info" \| "danger" \| "success" \| "warning"` | `"info"` | Color variant. |
| variant | `"outline" \| "soft" \| "solid"` | `"outline"` | Visual style. |
| children | `ReactNode` | — | Alert content. |

```tsx
<Alert color="success">Item saved successfully.</Alert>
<Alert color="danger" variant="soft">Something went wrong.</Alert>
```

### Badge

Compact status indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"info" \| "danger" \| "success" \| "warning" \| "secondary"` | `"secondary"` | Color variant. |
| children | `ReactNode` | — | Badge content. |

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Error</Badge>
```

### Menu

Dropdown menu with items, checkbox items, separators, and labels.

Sub-components: `Menu.Trigger`, `Menu.Content`, `Menu.Item`, `Menu.CheckboxItem`, `Menu.Separator`, `Menu.Label`.

```tsx
<Menu>
  <Menu.Trigger>
    <Button variant="secondary">Actions</Button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item onSelect={() => handleEdit()}>Edit</Menu.Item>
    <Menu.Item onSelect={() => handleDuplicate()}>Duplicate</Menu.Item>
    <Menu.Separator />
    <Menu.Item onSelect={() => handleDelete()} danger>Delete</Menu.Item>
  </Menu.Content>
</Menu>
```

---

## Navigation

### Tabs

Underline-style tab bar.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Active tab value. |
| onChange | `(value: string) => void` | — | Tab click handler. |
| children | `ReactNode` | — | `Tabs.Tab` elements. |

```tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.Tab value="overview">Overview</Tabs.Tab>
  <Tabs.Tab value="settings">Settings</Tabs.Tab>
</Tabs>
{activeTab === "overview" && <OverviewPanel />}
{activeTab === "settings" && <SettingsPanel />}
```

---

## Data Display

### Card

Content container with border and shadow.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "ghost"` | `"default"` | Ghost removes border/shadow. |
| padding | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Internal padding. |
| children | `ReactNode` | — | Content. |

```tsx
<Card><Text>Default card</Text></Card>
<Card variant="ghost" padding="lg"><Text>Ghost card, large padding</Text></Card>
```

### CodeBlock

Syntax-highlighted code block with copy button. Always dark background.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `string` | — | Code content. |
| language | `string` | — | Language for syntax highlighting. |
| copyable | `boolean` | `true` | Show copy button. |
| showLineNumbers | `boolean` | `false` | Show line numbers. |

```tsx
<CodeBlock language="tsx">{`const App = () => <div>Hello</div>;`}</CodeBlock>
```

### Divider

Horizontal separator line.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| spacing | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Vertical margin. |

```tsx
<Divider />
<Divider spacing="sm" />
```

---

## High-Performance Components

These are separate imports to keep the core bundle lean. Apps that don't use them pay zero bundle cost.

### DataTable

High-performance virtualized data table built on TanStack Table + TanStack Virtual.

**Import:** `import { DataTable, type ColumnDef } from "open-mcp-app-ui/table";`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `ColumnDef<T, unknown>[]` | — | Column definitions. |
| data | `T[]` | — | Row data. |
| sortable | `boolean` | `false` | Enable column sorting. |
| filterable | `boolean` | `false` | Show global filter input. |
| pageSize | `number` | — | Enable pagination. |
| virtualized | `boolean` | `false` | Enable row virtualization (recommended >100 rows). |
| stickyHeader | `boolean` | `true` | Sticky header on scroll. |
| emptyMessage | `ReactNode` | `"No data"` | Empty state content. |
| onRowClick | `(row: { original: T; index: number }) => void` | — | Row click handler. |
| loading | `boolean` | `false` | Show skeleton rows. |
| compact | `boolean` | `false` | Reduce row height. |
| filterPlaceholder | `string` | `"Filter..."` | Filter input placeholder. |

```tsx
const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
];

<DataTable columns={columns} data={users} sortable filterable />
<DataTable columns={columns} data={largeDataset} sortable virtualized />
<DataTable columns={columns} data={items} sortable pageSize={20} />
```

### Editor

Markdown + rich text editor built on Milkdown (ProseMirror + Remark). Supports WYSIWYG, raw markdown, and split modes. No border by default — use `bordered` to add one.

**Import:** `import { Editor } from "open-mcp-app-ui/editor";`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Markdown string (source of truth). |
| onChange | `(markdown: string) => void` | — | Content change handler. |
| mode | `"wysiwyg" \| "markdown" \| "split"` | `"wysiwyg"` | Editing mode. Omit for a mode toggle in toolbar. |
| placeholder | `string` | — | Placeholder text. |
| toolbar | `ToolbarItem[] \| false` | Default set | Toolbar buttons, or `false` to hide. |
| readOnly | `boolean` | `false` | View-only mode. |
| bordered | `boolean` | `false` | Add border and rounded corners. |
| minHeight | `number` | `120` | Minimum height in pixels. |
| maxHeight | `number` | — | Maximum height before scroll. |
| autoFocus | `boolean` | `false` | Focus on mount. |

**Toolbar items:** `"bold"`, `"italic"`, `"strikethrough"`, `"heading"`, `"bulletList"`, `"orderedList"`, `"taskList"`, `"code"`, `"codeBlock"`, `"blockquote"`, `"link"`, `"divider"`, `"undo"`, `"redo"`

```tsx
<Editor value={markdown} onChange={setMarkdown} placeholder="Start writing..." />
<Editor value={markdown} onChange={setMarkdown} bordered />
<Editor value={markdown} onChange={setMarkdown} mode="split" />
<Editor value={content} readOnly />
<Editor value="" toolbar={false} minHeight={200} placeholder="Clean writing surface..." />
```

**EditorRef** (imperative access):

```tsx
const editorRef = useRef<EditorRef>(null);
<Editor ref={editorRef} value={markdown} onChange={setMarkdown} />

editorRef.current?.setMarkdown("# New content");
const md = editorRef.current?.getMarkdown();
editorRef.current?.focus();
```

---

## Charts

Themed chart components. **Separate import:** `import { ... } from "open-mcp-app-ui/charts"`.

All charts auto-theme via CSS variables (axis labels, grid lines, tooltips, series colors).

### LineChart

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

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<BarChart data={salesData} height={300}>
  <XAxis dataKey="category" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="sales" />
</BarChart>
```

### AreaChart

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";

<AreaChart data={trafficData} height={300}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Area dataKey="visitors" />
</AreaChart>
```

### PieChart

```tsx
import { PieChart, Pie, Tooltip, Legend } from "open-mcp-app-ui/charts";

<PieChart height={300}>
  <Tooltip />
  <Legend />
  <Pie data={distribution} dataKey="value" nameKey="label" />
</PieChart>
```

### ScatterChart, RadarChart, ComposedChart

```tsx
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "open-mcp-app-ui/charts";
import { ComposedChart, Bar, Line, Area } from "open-mcp-app-ui/charts";
```

All chart types share props: `height` (default 300), `grid` (default true), `colorPalette` (custom series colors).

---

## Icons

`lucide-react` is bundled as a dependency — no separate install. Import directly:

```tsx
import { Plus, Trash2, Settings, Search } from "lucide-react";

<Button><Plus size={16} /> Add</Button>
```

Every icon accepts `size`, `color`, `strokeWidth`, `className`. Icons use `currentColor` by default — they inherit theme text color automatically.

Full list: [lucide.dev/icons](https://lucide.dev/icons)

---

## Common Patterns

### Form with Validation

```tsx
import { Card, Heading, Input, Select, Button, Alert } from "open-mcp-app-ui";

<Card>
  <Heading size="md">Create Item</Heading>
  {error && <Alert color="danger">{error}</Alert>}
  <Input label="Title" placeholder="Enter title..." value={title} onChange={(e) => setTitle(e.target.value)} />
  <Select label="Category" placeholder="Choose..." options={categories} value={cat} onChange={setCat} />
  <Button variant="primary" onClick={handleCreate} loading={saving}>Create</Button>
</Card>
```

### Adaptive Layout for Inline and PIP

```tsx
import { AppLayout, Show, Heading, Text, Button, Card } from "open-mcp-app-ui";

<AppLayout displayMode={hostContext?.displayMode}>
  <Heading size="md">Notes</Heading>

  <Show on="inline">
    <Text variant="secondary" size="sm">3 notes</Text>
    <Button variant="ghost" size="sm">Open Editor →</Button>
  </Show>

  <Show on={["pip", "fullscreen"]}>
    {notes.map((n) => (
      <Card key={n.id}>
        <Heading size="sm">{n.title}</Heading>
        <Text variant="secondary" size="sm">{n.body}</Text>
      </Card>
    ))}
  </Show>
</AppLayout>
```

### Data Table with Actions

```tsx
import { DataTable } from "open-mcp-app-ui/table";
import { Badge, Button } from "open-mcp-app-ui";

const columns = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <Badge variant={getValue() === "active" ? "success" : "secondary"}>{getValue()}</Badge>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <Button variant="ghost" size="sm" onClick={() => openItem(row.original.id)}>Open</Button>,
  },
];

<DataTable columns={columns} data={items} sortable filterable onRowClick={({ original }) => openItem(original.id)} />
```

---

## Anti-Patterns

**Do NOT build custom tables — use DataTable:**

```tsx
{/* Bad — raw HTML table, no theming, no sorting, no pagination */}
<table>
  <thead><tr><th>Name</th><th>Status</th></tr></thead>
  <tbody>{items.map(i => <tr key={i.id}><td>{i.name}</td><td>{i.status}</td></tr>)}</tbody>
</table>

{/* Bad — div grid pretending to be a table */}
<div className="grid grid-cols-2 gap-2">
  {items.map(i => <div key={i.id}>{i.name}</div>)}
</div>

{/* Good — DataTable handles theming, sorting, filtering, virtualization */}
import { DataTable } from "open-mcp-app-ui/table";

<DataTable
  columns={[
    { accessorKey: "name", header: "Name" },
    { accessorKey: "status", header: "Status" },
  ]}
  data={items}
  sortable
/>
```

Any time data is displayed in rows and columns, a grid, or a structured list, **always reach for `<DataTable>` first**. It works for everything from simple 2-column key-value pairs to large sortable/filterable datasets.

**Do NOT use AppLayout without displayMode:**

```tsx
{/* Bad — defaults to "pip", won't adapt */}
<AppLayout>
  <Show on="inline">Won't show in inline</Show>
</AppLayout>

{/* Good */}
<AppLayout displayMode={hostContext?.displayMode}>
  <Show on="inline">Shows in inline</Show>
</AppLayout>
```

**Do NOT hardcode colors:**

```tsx
{/* Bad */}
<div style={{ color: "#333" }}>Hardcoded</div>

{/* Good */}
<Text variant="primary">Uses theme</Text>
<div className="text-txt-primary">Uses theme class</div>
```

**Do NOT forget to pass displayMode to AppLayout:**

```tsx
{/* Bad */}
<AppLayout><Show on="inline">Won't work</Show></AppLayout>

{/* Good */}
<AppLayout displayMode={hostContext?.displayMode}><Show on="inline">Works</Show></AppLayout>
```

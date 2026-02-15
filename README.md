![open-mcp-app-github-v1](https://github.com/user-attachments/assets/3dc92f79-8277-4e7f-94c2-2e4cea043941)


**Build your MCP App once, run it anywhere.**

Build interactive UI apps for AI agents that work across ChatGPT, Claude, Creature, and any host that supports the [MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps). No platform lock-in. Write once, deploy everywhere.

> **Alpha Release**: These SDKs are a work in progress. APIs may change. We welcome feedback and contributions.

Maintained by the team behind [Creature](https://creature.run).

---

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [`open-mcp-app`](./sdk) | Core SDK — server tools, React hooks, theming, storage | [sdk/docs/](./sdk/docs/) |
| [`open-mcp-app-ui`](./sdk-ui) | UI component library — pre-themed components, data table, editor, charts | [sdk-ui/docs/](./sdk-ui/docs/) |

---

## Quick Start

### 1. Install

```bash
npm install open-mcp-app open-mcp-app-ui
```

### 2. Server — Define tools and a UI resource

```typescript
import { createApp } from "open-mcp-app/server";
import { z } from "zod";

const app = createApp({ name: "my-app", version: "1.0.0" });

app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  displayModes: ["inline", "pip"],
  html: "dist/ui/main.html",
});

app.tool("get_items", {
  description: "Fetch and display items",
  input: z.object({ query: z.string() }),
  ui: "ui://my-app/dashboard",
}, async (input) => {
  const items = await fetchItems(input.query);
  return { data: { items }, text: `Found ${items.length} items` };
});

app.start();
```

### 3. UI — Connect to the host and render

```tsx
import { useHost } from "open-mcp-app/react";
import { AppLayout, Card, Heading, Text, Button } from "open-mcp-app-ui";
import { DataTable } from "open-mcp-app-ui/table";
import "open-mcp-app-ui/styles.css";

function App() {
  const { isReady, callTool, hostContext } = useHost();
  const [fetchItems, itemsState] = callTool<{ items: Item[] }>("get_items");

  return (
    <AppLayout>
      <Heading size="lg">Dashboard</Heading>
      {itemsState.data && (
        <DataTable columns={columns} data={itemsState.data.items} sortable />
      )}
    </AppLayout>
  );
}
```

---

## Core SDK (`open-mcp-app`)

The core SDK provides everything you need to build an MCP App server and connect a React UI to the host.

**Server** (`open-mcp-app/server`) — Define tools, resources, storage, and real-time communication.

**React** (`open-mcp-app/react`) — `useHost()` hook for tool calls, host context, theming, display modes, and widget state.

**Styling** (`open-mcp-app/styles/tailwind.css`) — Tailwind 4 pre-configured with MCP Apps spec CSS variables. One import gives your app native look and feel on any host.

```tsx
import "open-mcp-app/styles/tailwind.css";

<div className="bg-bg-primary text-txt-primary border-bdr-secondary rounded-md p-4">
  Themed automatically
</div>
```

**Full documentation:** [`sdk/docs/`](./sdk/docs/)

---

## UI Component Library (`open-mcp-app-ui`)

A collection of pre-themed React components purpose-built for MCP Apps. All components use MCP Apps spec CSS variables so they adapt to any host's theme automatically.

**Components** — AppLayout, Show, Button, Input, Select, Checkbox, Switch, Card, Alert, Tabs, Menu, Badge, Heading, Text, Divider, and more.

**Data Table** (`open-mcp-app-ui/table`) — High-performance virtualized table with sorting, filtering, and pagination built on TanStack Table.

**Editor** (`open-mcp-app-ui/editor`) — Rich text / Markdown editor built on Milkdown (ProseMirror + Remark) with toolbar and read-only mode.

**Charts** (`open-mcp-app-ui/charts`) — Themed chart wrappers (Line, Bar, Area, Pie, Scatter, Radar, Composed) built on Recharts with automatic axis/grid theming.

**Icons** — `lucide-react` is bundled as a dependency. Import any of ~1,000 tree-shakeable icons directly.

```tsx
import { AppLayout, Card, Button, Alert } from "open-mcp-app-ui";
import { DataTable } from "open-mcp-app-ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "open-mcp-app-ui/charts";
import { Plus } from "lucide-react";
import "open-mcp-app-ui/styles.css";

<AppLayout>
  <Card variant="secondary">
    <Button variant="primary"><Plus size={14} /> Add Item</Button>
  </Card>
  <DataTable columns={columns} data={items} sortable borderVariant="secondary" />
  <LineChart data={monthlyData} height={300} borderVariant="secondary">
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line dataKey="revenue" />
  </LineChart>
</AppLayout>
```

**Full documentation:** [`sdk-ui/docs/`](./sdk-ui/docs/)

- [Component Library Reference](./sdk-ui/docs/component-library-reference.md) — All components at a glance
- [Individual Component Docs](./sdk-ui/docs/components/) — Detailed props, variants, and examples for each component

---

## Why We Built This

We're the team behind [Creature](https://creature.run), and we needed a place to experiment with and push forward the MCP Apps specification while holding ourselves accountable to cross-platform compatibility.

We believe MCP Apps built for Creature should run anywhere. No lock-in. This SDK enforces that discipline: standard APIs work everywhere, experimental APIs are clearly marked, and we test against multiple hosts.

We hope this becomes a space where the community can advance MCP Apps together, safely, across platforms, with a clear path from experimental features to standardization.

Contributions, feedback, and ideas are welcome.

## License

MIT

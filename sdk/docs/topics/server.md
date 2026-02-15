# Server — createApp, Resources, and App Lifecycle

The server half of an MCP App. Runs in Node.js, handles tools and data.

```typescript
import { createApp } from "open-mcp-app/server";
```

## createApp

Creates and configures an MCP App instance.

```typescript
const app = createApp({
  name: "my-app",
  version: "0.1.0",
  port: parseInt(process.env.MCP_PORT || "3000"),
  instructions: "Describe what the app does and guidance for the AI.",
});
```

| Option | Type | Description |
|--------|------|-------------|
| name | `string` | App identifier. Must match `HostProvider` name in UI. |
| version | `string` | Semver version string. |
| port | `number` | HTTP port for the MCP server. Use `process.env.MCP_PORT`. |
| instructions | `string` | Guidance text sent to the AI. Describe tools and response style. |

## Resources (UI Declaration)

Declare the UI as a `ui://` resource. The Host fetches and renders it in an iframe.

```typescript
app.resource({
  name: "My App",
  uri: "ui://my-app/main",
  html: "ui/index.html",
  description: "Main interface",
  displayModes: ["pip"],
  instanceMode: "single",
  icon: { svg: "<svg>...</svg>", alt: "My App" },
  views: {
    "/": ["tool_list"],
    "/detail/:id": ["tool_open", "tool_update", "tool_delete"],
  },
});
```

| Option | Type | Description |
|--------|------|-------------|
| name | `string` | Human-readable name shown in the UI tab. |
| uri | `string` | Unique `ui://` URI for this resource. |
| html | `string` | Path to the built HTML file (relative to dist). |
| description | `string` | Description for the Host. |
| displayModes | `DisplayMode[]` | Where this UI can render: `"inline"`, `"pip"`, `"fullscreen"`. |
| instanceMode | `"single" \| "multiple"` | `"single"` for dashboards (one tab). `"multiple"` for multi-tab apps (rare). |
| icon | `{ svg: string; alt: string }` | Phosphor icon SVG with `currentColor` fill. |
| views | `Record<string, string[]>` | Maps URL patterns to tool names. When a tool result arrives, the Host routes to the matching view. |

## Starting the Server

```typescript
await app.start();
```

The server is auto-started by `tsx watch` during development. Do NOT manually run `npm run dev`.

## Key Principles

- **Two audiences for every tool result.** Each tool returns `text` (for the AI) and `data`/`structuredContent` (for the UI). Keep `text` concise.
- **UI Resources are predeclared.** The server declares its UI at startup. The UI is a template — it receives data via tool results.
- **Build incrementally.** Add one tool at a time. Verify before adding the next.

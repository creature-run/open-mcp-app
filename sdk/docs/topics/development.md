# Development — Debugging, Hot Reload, and Best Practices

Rules and tools for developing MCP Apps in Creature.

## Auto-Reload

The MCP App is already running and auto-connected when the project opens. Do NOT run `npm run dev` manually.

| Watcher | Handles |
|---------|---------|
| `tsx watch` | Server changes — restarts the Node.js process. |
| `vite build --watch` | UI changes — rebuilds and reloads the pip tab. |

## Critical Rules

- **NEVER run `npm run dev`** — the server is already started automatically.
- **NEVER manually rebuild** — watchers handle everything.
- **NEVER use browser tools** to view the MCP App — it has its own pip tab, not a localhost URL.
- **NEVER assume the UI rendered correctly** just because a tool call succeeded. Tool results confirm the server processed the data — they say nothing about whether the UI rendered it. Always use widgetState.

## Debugging Tools

### devkit_typecheck

Run TypeScript type checking on an MCP App. `tsx watch` only transpiles — it does NOT check types. Use this when tools return unexpected errors (often a parameter name mismatch).

```
devkit_typecheck { mcpName: "my-app" }
```

### devkit_get_logs

Fetch recent logs from Creature's aggregated log system.

```
devkit_get_logs { filter: "current_mcp_app", mcpName: "my-app" }
devkit_get_logs { filter: "errors" }
```

### devkit_reload_mcp_app

Restart an MCP App server and reload all its pip instances. Use after code changes.

```
devkit_reload_mcp_app { mcpName: "my-app" }
```

### Dev Console

`View -> Dev Console` shows: server logs, system prompt, tool calls, and communication issues.

### UI Logging

Use `useHost().log` for structured logs from the UI:

```tsx
const { log } = useHost();
log.info("loaded");
log.error("failed", { detail });
log.debug("state", { data });
```

## Defensive Data Handling

Data arrives asynchronously — the UI renders before data exists. Always use optional chaining:

```tsx
// Good
data?.items ?? []
data?.item?.title ?? "Untitled"

// Bad — throws TypeError on first render
data.items
data.item.title
```

## Opening the UI

The UI only displays in a pip tab after you open it via a tool call. Check if a pip tab already exists before opening a new one.

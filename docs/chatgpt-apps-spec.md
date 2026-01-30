# ChatGPT Apps SDK Compliance

Creature aims to be compatible with **OpenAI's ChatGPT Apps SDK**, allowing developers to build MCP Apps that work in both Creature and ChatGPT. This document tracks compliance with ChatGPT's protocol and features.

**Last updated:** January 2026

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported |
| ⚠️ | Partially supported (see notes) |
| ❌ | Not yet supported |
| ➕ | Creature extension (not in ChatGPT) |

---

## Overview

The ChatGPT Apps SDK is built on MCP (Model Context Protocol) and uses a JavaScript bridge (`window.openai`) for host communication. Our SDK (`open-mcp-app`) provides a unified API that works in both environments.

**ChatGPT Apps SDK requirements:**
- MCP server implementing tools and resources
- UI resources served as `text/html+skybridge` MIME type
- Widget runtime via `window.openai.*` API
- Metadata using `_meta["openai/*"]` fields

---

## Transport & Bridge

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| `window.openai` bridge | ✅ | ✅ | SDK auto-detects environment |
| `window.openai.toolOutput` | ✅ | ✅ | Initial tool data |
| `window.openai.toolResponseMetadata` | ✅ | ✅ | Tool response metadata |
| `window.openai.widgetState` | ✅ | ✅ | Persisted widget state |
| `window.openai.callTool()` | ✅ | ✅ | Call tools from UI |
| `window.openai.setWidgetState()` | ✅ | ✅ | Update widget state |
| `openai:set_globals` event | ✅ | ✅ | Dynamic data updates |

---

## Tool Metadata

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| `_meta["openai/outputTemplate"]` | ✅ | ✅ | Links tool to UI resource |
| `_meta["openai/toolInvocation/invoking"]` | ✅ | ✅ | Loading message during tool call |
| `_meta["openai/toolInvocation/invoked"]` | ✅ | ✅ | Completion message after tool call |
| `_meta["openai/widgetPrefersBorder"]` | ✅ | ✅ | Border preference hint |
| `_meta["openai/widgetSessionId"]` | ✅ | ✅ | Instance/session identifier |
| `_meta["openai/locale"]` | ⚠️ | ✅ | Creature doesn't send locale |

---

## Resource Format

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| `text/html;profile=mcp-app` MIME | ✅ | ❌ | MCP Apps standard |
| `text/html+skybridge` MIME | ✅ | ✅ | ChatGPT-specific |
| `ui://` URI scheme | ✅ | ✅ | Both use this |
| Dual MIME type support | ✅ | N/A | SDK outputs both formats |

---

## Tool Results

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| `content[]` array | ✅ | ✅ | Text content for model |
| `structuredContent` | ✅ | ✅ | Data for UI rendering |
| `isError` flag | ✅ | ✅ | Error indication |
| `instanceId` in structuredContent | ✅ | ✅ | SDK maps to `widgetSessionId` |
| `title` in structuredContent | ✅ | ⚠️ | Used for pip titles in Creature |
| `websocketUrl` in structuredContent | ✅ | ❌ | Creature-only |

---

## Widget State

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| Simple key-value state | ✅ | ✅ | Basic persistence |
| `modelContent` field | ✅ | ✅ | AI-visible state |
| `privateContent` field | ✅ | ✅ | UI-only state |
| `imageIds` field | ✅ | ✅ | File references |
| State restoration | ✅ | ✅ | On page reload |

---

## Display & Rendering

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| Inline widgets | ✅ | ✅ | In conversation thread |
| Floating widgets (pip) | ✅ | ⚠️ | ChatGPT has limited pip support |
| Fullscreen mode | ❌ | ⚠️ | Neither fully supports |
| Widget resizing | ✅ | ✅ | Dynamic size changes |
| `inlineHeight` hint | ✅ | ⚠️ | Creature clamps to 60-300px |

---

## Theming

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| Light/dark theme | ✅ | ✅ | Via host context |
| CSS variables | ✅ | ⚠️ | Different variable names |
| Auto theme switching | ✅ | ✅ | Responds to system changes |
| Theme change notifications | ✅ | ❌ | Creature-only |

---

## Events & Lifecycle

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| Tool input event | ✅ | ✅ | Before tool execution |
| Tool result event | ✅ | ✅ | After tool completion |
| Widget state change | ✅ | ✅ | State restored/updated |
| Theme change | ✅ | ❌ | Creature-only |
| Teardown/cleanup | ✅ | ❌ | Creature-only |

---

## Features Not in ChatGPT

These Creature features are **not available** in ChatGPT:

| Feature | Description |
|---------|-------------|
| `ui/resource-teardown` | Graceful cleanup before close |
| `notifications/message` | Logging to DevConsole |
| WebSocket communication | Real-time bidirectional streams |
| Pip tabs | Multiple persistent pips |
| Pip popout | Separate windows |
| Pip refresh | Reload UI without restart |
| `instanceId` routing | Target specific pip instances |
| Multi-instance resources | Multiple instances of same resource |
| Theme change notifications | Dynamic theme updates |
| Host context notifications | `host-context-changed` |
| Creature-managed auth | Automatic user identity |

---

## ChatGPT Features Not in Creature

These ChatGPT features are **not yet available** in Creature:

| Feature | Description | Status |
|---------|-------------|--------|
| OAuth integration | User authentication flow | Different approach (Creature-managed) |
| Deep links | Direct app/tool links | Planned |
| App Store submission | Publishing workflow | N/A |
| Enterprise/Team scopes | Organization features | N/A |
| Locale hints | `_meta["openai/locale"]` | Not implemented |

---

## SDK Cross-Platform API

The `open-mcp-app` provides a unified API for both platforms:

### Server Side

```typescript
import { createApp } from "open-mcp-app/server";

const app = createApp({ name: "my-app", version: "1.0.0" });

// Resource automatically outputs both MIME types
app.resource({
  uri: "ui://my-app/widget",
  name: "My Widget",
  displayModes: ["inline", "pip"],
  html: "dist/ui/main.html",
});

// Tool metadata includes both MCP Apps and ChatGPT formats
app.tool("my_tool", {
  description: "Does something",
  ui: "ui://my-app/widget",
  loadingMessage: "Working...",      // ChatGPT toolInvocation/invoking
  completedMessage: "Done!",         // ChatGPT toolInvocation/invoked
}, async (input, context) => {
  // instanceId is auto-generated and included in result
  return { data: { result: "..." } };
});
```

### Client Side (React)

```tsx
import { useHost, useToolResult } from "open-mcp-app/react";

function App() {
  const { data, instanceId, onToolResult } = useToolResult();

  const { isReady, environment, callTool, setWidgetState, log } = useHost({
    name: "my-app",
    version: "1.0.0",
    onToolResult,
  });

  // environment is "mcp-apps" | "chatgpt" | "standalone"
  
  // setWidgetState works on both platforms
  setWidgetState({
    modelContent: { selectedItem: "abc" },
    privateContent: { viewMode: "list" },
  });

  return <div>Running in: {environment}</div>;
}
```

### Client Side (Vanilla JS)

```typescript
import { createHost } from "open-mcp-app/core";

// Auto-detects ChatGPT vs MCP Apps environment
const host = createHost({ name: "my-app", version: "1.0.0" });

host.on("tool-result", (result) => {
  // Works in both environments
  console.log(result.structuredContent);
});

host.connect();

// Call tool - works on both
const result = await host.callTool("get_data", { query: "test" });

// Widget state - works on both
host.setWidgetState({ modelContent: { selected: "item" } });
```

---

## Compatibility Matrix

| Feature | MCP Apps (Creature) | ChatGPT | SDK Abstraction |
|---------|---------------------|---------|-----------------|
| Tool calls | `tools/call` via postMessage | `window.openai.callTool()` | `host.callTool()` |
| Tool data | `ui/notifications/tool-result` | `window.openai.toolOutput` | `onToolResult` callback |
| Widget state | `ui/notifications/widget-state-changed` | `window.openai.setWidgetState()` | `host.setWidgetState()` |
| Instance ID | `instanceId` in structuredContent | `widgetSessionId` in `_meta` | `instanceId` from `useToolResult()` |
| Logging | `notifications/message` | Console only | `host.log()` / `log()` |
| Theme | `hostContext.theme` | System preference | `onThemeChange` callback |
| Cleanup | `ui/resource-teardown` | N/A | `onTeardown` callback |
| WebSocket | `websocket: true` on resource | N/A | `useWebSocket()` (no-op on ChatGPT) |

---

## Recommendations

### For Maximum Compatibility

1. **Use the SDK** - The `open-mcp-app` handles platform differences automatically
2. **Support both display modes** - Always include `["inline", "pip"]` in `displayModes`
3. **Use structured widget state** - `modelContent`/`privateContent` format works best
4. **Provide fallbacks** - Check `environment` and degrade gracefully for Creature-only features
5. **Add ChatGPT metadata** - Include `loadingMessage` and `completedMessage` for better UX

### For Creature-Only Apps

If you only target Creature, take advantage of:
- WebSocket for real-time data (`websocket: true` on resources)
- Multi-instance support (`multiInstance: true`)
- Pip tabs and popout windows  
- DevConsole logging (`log()`)
- Teardown handlers for cleanup (`onTeardown`)
- Theme change notifications (`onThemeChange`)
- Creature-managed authentication

---

## Version Compatibility

| ChatGPT Apps SDK | MCP Apps (SEP-1865) | Creature SDK |
|------------------|---------------------|--------------|
| 1.x (2025-2026) | 2025-11-21 | 0.1.x |

The SDK versions track the underlying protocol versions. Creature aims to stay current with both specs.

# MCP Apps Specification Support

Creature implements the **MCP Apps** extension (SEP-1865), which enables MCP servers to deliver interactive user interfaces. This document tracks which features are supported, what's coming soon, and where Creature extends the specification.

**Last updated:** January 2026

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported |
| ⚠️ | Partially supported (see notes) |
| ❌ | Not yet supported |
| ➕ | Creature extension (beyond spec) |

---

## UI Resources

| Feature | Status | Notes |
|---------|--------|-------|
| `ui://` URI scheme | ✅ | Standard MCP Apps resource identifier |
| `text/html;profile=mcp-app` MIME type | ✅ | Required for UI resources |
| `_meta.ui` metadata object | ✅ | |
| `displayModes` | ⚠️ | `inline` and `pip` supported; `fullscreen` not yet |
| `prefersBorder` | ❌ | Border preference not implemented |
| `domain` (dedicated origin) | N/A | Not applicable - Electron uses `srcdoc` |
| `csp.connectDomains` | ✅ | CSP enforcement for network requests |
| `csp.resourceDomains` | ✅ | CSP enforcement for static resources |

---

## Tool Metadata

| Feature | Status | Notes |
|---------|--------|-------|
| `_meta.ui.resourceUri` | ✅ | Links tools to UI resources |
| `_meta.ui.visibility` | ✅ | `["model"]`, `["app"]`, `["model", "app"]` all work |
| Default visibility | ✅ | Defaults to `["model", "app"]` when omitted |
| `_meta.ui.displayModes` | ✅ | Supported display modes for this tool |
| `_meta.ui.defaultDisplayMode` | ➕ | Creature extension: preferred display mode |
| `_meta["openai/outputTemplate"]` | ✅ | ChatGPT compatibility: links tool to resource |
| `_meta["openai/toolInvocation/invoking"]` | ✅ | ChatGPT compatibility: loading message |
| `_meta["openai/toolInvocation/invoked"]` | ✅ | ChatGPT compatibility: completion message |

---

## Display Modes

| Mode | Status | Notes |
|------|--------|-------|
| `inline` | ✅ | Renders in conversation thread |
| `pip` | ✅ | Renders in sidebar with tabs (can also be popped out) |
| `fullscreen` | ❌ | Not yet supported |

---

## Communication Protocol

| Feature | Status | Notes |
|---------|--------|-------|
| JSON-RPC 2.0 over postMessage | ✅ | Standard transport |
| `ui/initialize` request | ✅ | Guest UI initiates handshake |
| Initialize response | ✅ | Host returns capabilities and context |
| `ui/notifications/initialized` | ✅ | Guest UI signals ready state |

---

## Notifications: Host to Guest UI

| Notification | Status | Notes |
|--------------|--------|-------|
| `ui/notifications/tool-input` | ✅ | Sends complete tool arguments after initialization |
| `ui/notifications/tool-input-partial` | ❌ | Streaming partial args not implemented |
| `ui/notifications/tool-result` | ✅ | Sends result after tool execution |
| `ui/notifications/tool-cancelled` | ❌ | Cancellation notification not implemented |
| `ui/notifications/host-context-changed` | ✅ | Theme/style changes trigger this |
| `ui/notifications/size-changed` | ✅ | Host notifies guest of container resize |
| `ui/notifications/widget-state-changed` | ✅ | Widget state updates |

---

## Requests: Guest UI to Host

| Request | Status | Notes |
|---------|--------|-------|
| `tools/call` | ✅ | Apps can call tools on their MCP server |
| `resources/read` | ❌ | Apps cannot read other resources yet |
| `notifications/message` | ✅ | Logging to host DevConsole |
| `ui/open-link` | ❌ | External link opening not implemented |
| `ui/message` | ❌ | Apps cannot send chat messages |
| `ui/request-display-mode` | ✅ | Display mode switching |
| `ui/resource-teardown` | ✅ | Host sends before closing; awaits graceful cleanup |

---

## Host Context

The `hostContext` object is sent during initialization and via `host-context-changed` notifications.

| Field | Status | Notes |
|-------|--------|-------|
| `theme` | ✅ | `"light"` or `"dark"` |
| `styles.variables` | ✅ | Full set of MCP Apps CSS variables |
| `styles.css.fonts` | ❌ | Custom font injection not implemented |
| `displayMode` | ✅ | Included as `"pip"` or `"inline"` |
| `containerDimensions` | ⚠️ | Sent on init only, not on resize |
| `locale` | ❌ | Not included |
| `timeZone` | ❌ | Not included |
| `userAgent` | ✅ | Host identifier in format `"<host>/<version>"` (e.g. `"creature/1.0.0"`) |
| `platform` | ✅ | Always `"desktop"` |
| `availableDisplayModes` | ✅ | Currently `["pip"]` for pips, `["inline"]` for inline widgets |
| `deviceCapabilities` | ❌ | Not included |
| `safeAreaInsets` | ❌ | Not included |
| `toolInfo` | ❌ | Tool metadata not included in host context |
| `widgetState` | ✅ | Restored widget state from previous instance |

---

## Theming (CSS Variables)

Creature sends CSS variables following the MCP Apps spec standard. Apps should provide fallback values for graceful degradation.

### Supported Variables

| Category | Variables | Status |
|----------|-----------|--------|
| Background | `--color-background-primary`, `--color-background-secondary` | ✅ |
| Text | `--color-text-primary`, `--color-text-secondary` | ✅ |
| Border | `--color-border-primary`, `--color-border-secondary` | ✅ |
| Typography | `--font-sans`, `--font-mono` | ✅ |

### Not Yet Supported

| Category | Status |
|----------|--------|
| Tertiary/inverse/ghost colors | ❌ |
| Semantic colors (info, danger, success, warning) | ❌ |
| Ring colors | ❌ |
| Typography sizes and weights | ❌ |
| Border radius | ❌ |
| Border width | ❌ |
| Shadows | ❌ |

---

## Security

| Feature | Status | Notes |
|---------|--------|-------|
| CSP enforcement | ✅ | Injected via meta tag |
| `csp.connectDomains` | ✅ | Controls fetch/XHR/WebSocket |
| `csp.resourceDomains` | ✅ | Controls images, fonts, media |
| Iframe sandbox | ✅ | `allow-scripts allow-same-origin` |
| Sandbox proxy (double iframe) | N/A | Not needed in Electron (native app) |

---

## Capability Negotiation

| Feature | Status | Notes |
|---------|--------|-------|
| `extensions["io.modelcontextprotocol/ui"]` | ✅ | Advertised in initialize |
| `mimeTypes` capability | ✅ | Reports supported content types |
| Graceful degradation | ✅ | Tools work without UI if host doesn't support |

---

## Creature Extensions

These features are **Creature-specific** and not part of SEP-1865:

| Feature | Description |
|---------|-------------|
| `displayModes` on resources | Spec puts this in tool metadata; Creature also reads from resource |
| `defaultDisplayMode` on tools | Preferred display mode when Agent does not specify |
| `multiInstance` on resources | Allow multiple pip instances for same resource |
| `websocket` on resources | Enable WebSocket communication for real-time updates |
| `inlineHeight` in structuredContent | Request specific inline widget height (clamped to 60-300px) |
| `instanceId` in structuredContent | SDK auto-includes instance identifier |
| `websocketUrl` in structuredContent | SDK auto-includes WebSocket URL when enabled |
| Inline widget auto-sizing | Host measures content height and adjusts iframe (60-300px range) |
| Pip refresh button | Reload pip UI without restarting MCP server |
| Pip popout | Pop pips out into separate windows |
| Pip tabs | Multiple pips organized in a tabbed interface |
| Pip routing via `instanceId` | Tool calls can route to existing pip instances |
| Pip broadcasting | When inline actions occur, pips from the same MCP receive updates |
| Widget state persistence | `ui/notifications/widget-state-changed` for persisting UI state |
| Creature-managed auth | Automatic user identity via `creatureToken` |

---

## Spec Version

Creature targets **SEP-1865** (MCP Apps: Interactive User Interfaces for MCP).

- Extension identifier: `io.modelcontextprotocol/ui`
- Protocol version: `2025-11-21`

---

## SDK Support

The Creature SDK provides abstractions for building cross-platform MCP Apps:

### Server API

| Feature | Status | Notes |
|---------|--------|-------|
| `createApp()` | ✅ | Factory for MCP server with UI support |
| `app.resource()` | ✅ | Register UI resources |
| `app.tool()` | ✅ | Register tools with optional UI |
| `websocket: true` on resources | ✅ | WebSocket communication |
| `multiInstance: true` on resources | ✅ | Multiple instance support |
| `context.getState()` / `setState()` | ✅ | Server-side instance state |
| `context.send()` / `onMessage()` | ✅ | WebSocket messaging |
| `context.instanceId` | ✅ | Auto-generated instance identifier |
| Zod schema validation | ✅ | Type-safe tool input validation |
| HMR support | ✅ | Hot reload during development |
| Streamable HTTP transport | ✅ | Modern MCP transport |
| Vercel/Lambda adapters | ✅ | Serverless deployment |
| Creature-managed auth | ✅ | `getIdentity()` |

### Client API

| Feature | Status | Notes |
|---------|--------|-------|
| `createHost()` | ✅ | Auto-detecting host client factory |
| `createHostAsync()` | ✅ | Async host factory (waits for `hostContext` on MCP Apps) |
| `McpAppsAdapter` | ✅ | MCP Apps protocol implementation (explicit adapter) |
| `UpgradingMcpAppsClient` | ✅ | Default MCP Apps client (detects Creature via `hostContext.userAgent`) |
| `ChatGptAdapter` | ✅ | ChatGPT Apps SDK bridge (explicit adapter) |
| `CreatureAdapter` | ✅ | Creature-specific extensions (for MCP Apps hosts that are Creature) |
| `detectEnvironment()` | ✅ | Runtime environment detection |
| `createWebSocket()` | ✅ | WebSocket client |
| `host.callTool()` | ✅ | Call tools from UI |
| `host.setWidgetState()` | ✅ | Persist widget state |
| `host.requestDisplayMode()` | ✅ | Request display mode change |
| `host.log()` | ✅ | Log to DevConsole |
| Theme utilities | ✅ | `applyDocumentTheme()`, etc. |

### React API

| Feature | Status | Notes |
|---------|--------|-------|
| `useHost()` | ✅ | Hook for host connection |
| `useToolResult()` | ✅ | Hook for tool result state |
| `useWebSocket()` | ✅ | Hook for WebSocket connection |
| `log` from `useHost()` | ✅ | Convenience logger |

### Vite Plugin

| Feature | Status | Notes |
|---------|--------|-------|
| `creature()` plugin | ✅ | Build plugin for UI |
| Page discovery | ✅ | Auto-finds `page.tsx` files |
| HMR support | ✅ | Live reload during dev |
| `generateBundle` option | ✅ | Bundled HTML for serverless |

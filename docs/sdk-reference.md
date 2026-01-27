# @creature-ai/sdk

Build cross-platform AI apps with rich, interactive UIs. Write once, run on both **Creature** and **ChatGPT**.

```bash
npx @creature-ai/create-app my-app
cd my-app
npm run dev
```

---

## Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `@creature-ai/sdk/server` | MCP server: define tools, resources, WebSockets |
| `@creature-ai/sdk/react` | React hooks: `useHost`, `useToolResult`, `useWebSocket` |
| `@creature-ai/sdk/core` | Vanilla JS: host clients, environment detection, theming |
| `@creature-ai/sdk/vite` | Build plugin: page discovery, HMR, serverless bundles |

---

## Server (`@creature-ai/sdk/server`)

### `createApp(config)`

Creates and starts an MCP server.

```typescript
import { createApp } from "@creature-ai/sdk/server";

const app = createApp({
  name: "my-app",
  version: "1.0.0",
  port: 3000,
  auth: { creatureManaged: true },
  instructions: "This app does...",
});

app.resource({ ... });
app.tool("do_thing", { ... }, handler);
app.start();
```

**AppConfig**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | App identifier (required) |
| `version` | `string` | Semantic version (required) |
| `port` | `number` | Server port. Default: `MCP_PORT` env or `3000` |
| `dev` | `boolean` | Enable HMR. Default: auto-detect from `NODE_ENV` |
| `hmrPort` | `number` | HMR WebSocket port override |
| `auth` | `{ creatureManaged?: boolean }` | Enable Creature-managed identity |
| `instructions` | `string` | System prompt guidance for AI on using your tools |
| `onTransportSessionCreated` | `(info) => void` | MCP client connected |
| `onTransportSessionClosed` | `(info) => void` | MCP client disconnected |
| `onTransportSessionError` | `(info, error) => void` | Transport error handler |
| `onToolError` | `(name, error, args) => void` | Tool handler error callback |
| `onShutdown` | `() => Promise<void>` | Cleanup before shutdown |
| `gracefulShutdownTimeout` | `number` | Shutdown timeout ms. Default: `5000` |
| `keepAliveTimeout` | `number` | HTTP keep-alive timeout ms. Default: `5000` |

---

### `app.resource(config)`

Registers a UI widget the host can display.

```typescript
app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  description: "Real-time metrics dashboard",
  displayModes: ["pip", "inline"],
  html: "dist/ui/main.html",
  icon: { svg: ICON_SVG, alt: "Dashboard" },
  multiInstance: false,
  websocket: true,
  csp: { connectDomains: ["ws://localhost:3000"] },
});
```

**ResourceConfig**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Display name in tabs/lists (required) |
| `uri` | `string` | Unique URI like `ui://app-name/path` (required) |
| `displayModes` | `DisplayMode[]` | `"pip"`, `"inline"`, `"fullscreen"` (required) |
| `html` | `string \| () => string` | HTML path, raw HTML, or function (required) |
| `description` | `string` | Shown in resource browsers |
| `icon` | `{ svg: string, alt: string }` | Tab icon (SVG with `currentColor`) |
| `multiInstance` | `boolean` | Allow multiple instances. Default: `false` (singleton) |
| `websocket` | `boolean` | Enable WebSocket for this resource. Default: `false` |
| `csp` | `object` | `{ connectDomains?: string[], resourceDomains?: string[] }` |

**HTML formats:**
- **File path**: `"dist/ui/main.html"` — loaded from disk (local dev)
- **Raw HTML**: `"<!DOCTYPE html>..."` — embedded (serverless)
- **Function**: `() => html` — lazy-loaded

---

### `app.tool(name, config, handler)`

Defines a function the AI can call.

```typescript
import { z } from "zod";

app.tool(
  "add_item",
  {
    description: "Add an item to the list",
    input: z.object({
      text: z.string().describe("Item text"),
    }),
    ui: "ui://my-app/dashboard",
    visibility: ["model", "app"],
    displayModes: ["pip"],
    defaultDisplayMode: "pip",
    loadingMessage: "Adding item...",
    completedMessage: "Item added",
  },
  async ({ text }, context) => {
    const items = context.getState<string[]>() || [];
    items.push(text);
    context.setState(items);

    return {
      data: { items },
      text: `Added: ${text}`,
      title: `Items (${items.length})`,
    };
  }
);
```

**ToolConfig**

| Property | Type | Description |
|----------|------|-------------|
| `description` | `string` | Tells AI when to use this tool (required) |
| `input` | `ZodSchema` | Validates arguments. Use `.describe()` on fields |
| `ui` | `string` | Resource URI to display on invocation |
| `visibility` | `Array<"model" \| "app">` | Who can call. Default: `["model", "app"]` |
| `displayModes` | `DisplayMode[]` | Override resource's display modes |
| `defaultDisplayMode` | `DisplayMode` | Preferred display mode |
| `loadingMessage` | `string` | Shown while executing (ChatGPT) |
| `completedMessage` | `string` | Shown after completion (ChatGPT) |

**ToolResult** (return value)

| Property | Type | Description |
|----------|------|-------------|
| `data` | `object` | Structured content sent to UI via `structuredContent` |
| `text` | `string` | Plain text context for the AI |
| `title` | `string` | Widget tab/header title |
| `inlineHeight` | `number` | Height for inline mode (60-300px) |
| `isError` | `boolean` | Mark as error result |
| `noWidget` | `boolean` | Skip UI creation (for read-only operations) |

**ToolContext** (second argument)

| Property | Type | Description |
|----------|------|-------------|
| `instanceId` | `string` | Unique widget instance ID |
| `creatureToken` | `string \| undefined` | Identity token (if `auth.creatureManaged: true`) |
| `getState<T>()` | `function` | Get server-side state for this instance |
| `setState<T>(state)` | `function` | Set server-side state |
| `send<T>(message)` | `function` | Send WebSocket message to UI (requires `websocket: true`) |
| `onMessage<T>(handler)` | `function` | Handle UI messages (requires `websocket: true`) |
| `onConnect(handler)` | `function` | Called when UI connects (requires `websocket: true`) |
| `websocketUrl` | `string \| undefined` | URL for UI to connect (auto-included in result) |

---

### Instance Management

The SDK manages instances automatically:

- **Singleton** (default): All tool calls share one instance per resource URI
- **Multi-instance** (`multiInstance: true`): Each tool call creates a new instance

```typescript
// Check if instance exists
app.hasInstance(instanceId);

// Get/set instance state directly
const state = app.getInstanceState<MyState>(instanceId);
app.setInstanceState(instanceId, newState);

// Destroy an instance
app.destroyInstance(instanceId);

// React to instance destruction
app.onInstanceDestroy(({ instanceId, state }) => {
  console.log(`Instance ${instanceId} destroyed`);
});
```

---

### WebSocket Communication

Enable real-time bidirectional messaging with `websocket: true` on the resource:

```typescript
app.resource({
  uri: "ui://my-app/terminal",
  html: "dist/ui/terminal.html",
  displayModes: ["pip"],
  websocket: true,
  csp: { connectDomains: ["ws://localhost:3000"] },
});

app.tool(
  "start_terminal",
  { description: "Start terminal", ui: "ui://my-app/terminal" },
  async (_, context) => {
    // Listen for UI messages
    context.onMessage<{ type: "input"; data: string }>((msg) => {
      console.log("Received:", msg.data);
    });

    // Send on connect
    context.onConnect(() => {
      context.send({ type: "output", data: "Welcome!\r\n" });
    });

    // websocketUrl is auto-included in result
    return { data: { ready: true } };
  }
);
```

---

### Transport Session Management

Monitor protocol-level connections:

```typescript
// List active MCP connections
const sessions = app.getTransportSessions();
// [{ id: "uuid", transport: "streamable-http" }]

// Count active connections
const count = app.getTransportSessionCount();

// Force-close a connection
app.closeTransportSession(sessionId);
```

---

### Server Lifecycle

```typescript
await app.start();  // Begin accepting connections
await app.stop();   // Graceful shutdown
```

---

### Serverless Deployment

Deploy to Vercel or AWS Lambda:

```typescript
// Vercel (api/mcp.ts)
import { app } from "../src/app";
export default app.toVercelFunctionHandler();

// AWS Lambda
import { app } from "./app";
export const handler = app.toAwsLambda();
```

For stateful features in serverless, provide adapters:

```typescript
export default app.toVercelFunctionHandler({
  stateAdapter: {
    get: (id) => redis.get(`state:${id}`),
    set: (id, state) => redis.set(`state:${id}`, state),
    delete: (id) => redis.del(`state:${id}`),
  },
  realtimeAdapter: {
    send: (id, msg) => pusher.trigger(id, "message", msg),
    subscribe: (id, handler) => pusher.subscribe(id, handler),
    getWebSocketUrl: (id) => `wss://pusher.com/${id}`,
  },
});
```

---

### Auth & Identity

When `auth: { creatureManaged: true }`, Creature provides verified user identity via tokens injected into tool contexts.

```typescript
import { getIdentity, CreatureIdentityError } from "@creature-ai/sdk/server";

app.tool("save_note", { ... }, async ({ content }, context) => {
  if (!context.creatureToken) {
    return { text: "Authentication required", isError: true };
  }

  try {
    const identity = await getIdentity(context.creatureToken);
    // identity.user.id, identity.user.email, identity.organization?.id
    await db.notes.insert({ userId: identity.user.id, content });
  } catch (err) {
    if (err instanceof CreatureIdentityError) {
      return { text: err.message, isError: true };
    }
    throw err;
  }

  return { text: "Note saved" };
});
```

**CreatureIdentity**

| Property | Type | Description |
|----------|------|-------------|
| `user` | `{ id, email, name? }` | User identity (always present) |
| `organization` | `{ id, name, slug }` | Org context (Creature only, may be absent on ChatGPT) |
| `project` | `{ id, name }` | Project context (Creature only, may be absent on ChatGPT) |
| `session` | `{ id }` | Session identifier |
| `expiresAt` | `string` | Token expiration (ISO 8601) |

---

### Creature OAuth

To make your MCP App work with ChatGPT and other OAuth-compatible hosts, enable **Creature OAuth** for your published package. This allows users to authenticate via Creature's OAuth 2.0 provider.

**How it works:**

1. **In Creature**: Tokens are injected automatically—no user action required
2. **In ChatGPT**: Users are redirected to `creature.run` to sign in, then tokens are issued via standard OAuth flow

The SDK's `getIdentity()` works identically on both platforms—your code doesn't need to change.

**Setup:**

1. Publish your MCP App to the Creature Registry
2. In the Creature desktop app's **Publish** view, enable **Creature OAuth**
3. Copy the Client ID and Client Secret for ChatGPT configuration
4. Add the OAuth discovery endpoint to your app (see below)

**OAuth Discovery Endpoint:**

ChatGPT requires a `/.well-known/oauth-authorization-server` endpoint on your MCP server. Add this to your Vercel deployment:

```typescript
// api/.well-known/oauth-authorization-server.ts
import { NextResponse } from 'next/server'

export const GET = () => {
  return NextResponse.json({
    issuer: 'https://creature.run',
    authorization_endpoint: 'https://creature.run/oauth/authorize',
    token_endpoint: 'https://api.creature.run/apps/v1/oauth/token',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  })
}
```

And add this rewrite to `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/.well-known/oauth-authorization-server",
      "destination": "/api/.well-known/oauth-authorization-server"
    }
  ]
}
```

**Data Scoping:**

When users authenticate via ChatGPT (OAuth), they won't have organization or project context—only user identity. Design your app to handle this:

```typescript
const identity = await getIdentity(context.creatureToken);

// User is always present
const userId = identity.user.id;

// Organization/project may be absent (especially from ChatGPT)
const orgId = identity.organization?.id || 'default';
const projectId = identity.project?.id || 'default';
```

---

### Utilities

```typescript
import { svgToDataUri } from "@creature-ai/sdk/server";

// Convert SVG to data URI for icons
const iconUri = svgToDataUri("<svg>...</svg>");
```

---

## React (`@creature-ai/sdk/react`)

### `useHost(config)`

Connect your widget to the host.

```tsx
import { useHost, useToolResult } from "@creature-ai/sdk/react";

function App() {
  const { data, title, instanceId, onToolResult } = useToolResult<MyData>();

  const { isReady, environment, callTool, log } = useHost({
    name: "my-app",
    version: "1.0.0",
    onToolResult,
    onThemeChange: (theme) => console.log("Theme:", theme),
    onTeardown: () => console.log("Widget closing"),
  });

  log("Widget loaded");
  log.error("Something failed", { details: "..." });

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => callTool("refresh", {})}>Refresh</button>
    </div>
  );
}
```

**UseHostConfig**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Must match server's app name (required) |
| `version` | `string` | Must match server's version (required) |
| `onToolInput` | `(args) => void` | Before tool execution |
| `onToolResult` | `(result) => void` | After tool completion |
| `onThemeChange` | `(theme) => void` | Theme changed (MCP Apps only) |
| `onTeardown` | `() => Promise<void>` | Widget closing (MCP Apps only) |
| `onWidgetStateChange` | `(state) => void` | State restored/updated |

**UseHostReturn**

| Property | Type | Description |
|----------|------|-------------|
| `isReady` | `boolean` | Host connection established |
| `environment` | `Environment` | `"mcp-apps"`, `"chatgpt"`, or `"standalone"` |
| `widgetState` | `WidgetState` | Persisted widget state |
| `adapterKind` | `"mcp-apps" \| "creature" \| "chatgpt" \| "standalone"` | Adapter currently in use. For MCP Apps, this is determined after connection via `hostContext.userAgent`. |
| `isCreature` | `boolean` | Whether the host is Creature (Creature-specific extensions available). Determined after connection via `hostContext.userAgent`. |
| `hostContext` | `HostContext \| null` | Host context (theme, styles, `userAgent`, etc). `null` before connection. |
| `callTool` | `(name, args) => Promise` | Invoke a tool |
| `setWidgetState` | `(state) => void` | Persist state |
| `requestDisplayMode` | `({ mode }) => Promise` | Request display change |
| `sendNotification` | `(method, params) => void` | Low-level MCP notification |
| `log` | `Logger` | DevConsole logging |

**Logger**

```typescript
log("message");              // info level
log.debug("verbose");        // debug level (gray)
log.info("normal");          // info level
log.notice("notable");       // notice level (blue)
log.warn("warning");         // warning level (yellow)
log.error("failure", data);  // error level (red)
```

---

### `useToolResult<T>()`

Store and access tool results.

```tsx
const { data, instanceId, title, isError, text, onToolResult, reset } = useToolResult<MyData>();
```

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| null` | Structured content from last result |
| `instanceId` | `string \| null` | Widget instance ID |
| `title` | `string \| null` | Widget title |
| `isError` | `boolean` | Whether result was an error |
| `text` | `string \| null` | Plain text content |
| `onToolResult` | `(result) => void` | Pass to `useHost({ onToolResult })` |
| `reset` | `() => void` | Clear all state |

---

### `useWebSocket<TSend, TReceive>(url, config)`

Connect to a server WebSocket.

```tsx
function Terminal({ websocketUrl }: { websocketUrl: string }) {
  const { status, error, send } = useWebSocket<ClientMsg, ServerMsg>(
    websocketUrl,
    {
      onMessage: (msg) => {
        if (msg.type === "output") {
          terminal.write(msg.data);
        }
      },
      enabled: true,
    }
  );

  return (
    <div>
      {status === "connecting" && <Spinner />}
      {status === "error" && <Error message={error} />}
      <TerminalView onInput={(data) => send({ type: "input", data })} />
    </div>
  );
}
```

**UseWebSocketConfig**

| Property | Type | Description |
|----------|------|-------------|
| `onMessage` | `(msg: TReceive) => void` | Handle incoming messages |
| `enabled` | `boolean` | Connect when true. Default: `true` |

**UseWebSocketReturn**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `WebSocketStatus` | `"disconnected"`, `"connecting"`, `"connected"`, `"error"` |
| `error` | `string \| undefined` | Error message if status is `"error"` |
| `send` | `(msg: TSend) => void` | Send message to server |

---

### Widget State

Persist state across reloads:

```tsx
const { widgetState, setWidgetState } = useHost({ ... });

// Simple state
setWidgetState({ selectedId: "123", viewMode: "list" });

// Structured state (ChatGPT-compatible)
setWidgetState({
  modelContent: { selectedItems: ["a", "b"] },  // AI can see this
  privateContent: { viewMode: "grid" },          // UI-only
});
```

---

### Display Mode Requests

```tsx
const { requestDisplayMode } = useHost({ ... });

async function goFullscreen() {
  const result = await requestDisplayMode({ mode: "fullscreen" });
  // Host may coerce: check result.mode
  if (result.mode !== "fullscreen") {
    console.log("Host granted:", result.mode);
  }
}
```

---

### `<CreatureIcon />`

Creature logo component:

```tsx
import { CreatureIcon } from "@creature-ai/sdk/react";

<CreatureIcon
  isDarkMode={true}
  showEyes={true}
  enableBlink={true}
  width={48}
  height={48}
/>
```

---

## Core (`@creature-ai/sdk/core`)

Low-level APIs for vanilla JS or non-React frameworks.

### `createHost(config)`

`createHost()` auto-detects the current environment. In MCP Apps iframes, it uses a client that determines **Creature vs generic MCP Apps** after the `ui/initialize` handshake (via `hostContext.userAgent`). If you need `adapterKind/isCreature` to be correct immediately, use `createHostAsync()`.

```typescript
import { createHost } from "@creature-ai/sdk/core";

const host = createHost({ name: "my-app", version: "1.0.0" });

host.on("tool-result", (result) => {
  document.getElementById("output").textContent = JSON.stringify(result.structuredContent);
});

host.on("theme-change", (theme) => {
  document.body.dataset.theme = theme;
});

host.connect();

// Call a tool
const result = await host.callTool("show_data", { query: "recent" });

// Persist state
host.setWidgetState({ selectedId: "123" });

// Request display mode
const { mode } = await host.requestDisplayMode({ mode: "pip" });

// Log to DevConsole
host.log("info", "User action", { action: "click" });

// Cleanup
host.disconnect();
```

**Methods**

| Method | Description |
|--------|-------------|
| `connect()` | Start listening for host messages |
| `disconnect()` | Stop listening, cleanup |
| `getState()` | Get current `{ isReady, environment, widgetState }` |
| `subscribe(listener)` | Listen to state changes. Returns unsubscribe |
| `on(event, handler)` | Register event handler. Returns unsubscribe |
| `callTool(name, args)` | Invoke tool, returns `Promise<ToolResult>` |
| `setWidgetState(state)` | Persist widget state |
| `getHostContext()` | Get host context (`HostContext`) or `null` before ready |
| `setTitle(title)` | Set pip/widget title (Creature extension). No-op on ChatGPT and generic MCP Apps hosts |
| `requestDisplayMode({ mode })` | Request display change |
| `sendNotification(method, params)` | Send MCP notification |
| `log(level, message, data?)` | Log to DevConsole |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `tool-input` | `args: Record<string, unknown>` | Before tool execution |
| `tool-result` | `ToolResult` | After tool completion |
| `theme-change` | `"light" \| "dark"` | Theme changed (MCP Apps) |
| `teardown` | — | Widget closing (MCP Apps) |
| `widget-state-change` | `WidgetState` | State restored/updated |

---

### `createHostAsync(config)`

If you need `adapterKind`, `isCreature`, or `hostContext` to be accurate immediately, use the async factory. It waits for the MCP Apps `ui/initialize` handshake before resolving.

```typescript
import { createHostAsync } from "@creature-ai/sdk/core";

const host = await createHostAsync({ name: "my-app", version: "1.0.0" });

if (host.isCreature) {
  // Creature-specific initialization
}
```

---

### `createWebSocket(url, config)`

```typescript
import { createWebSocket } from "@creature-ai/sdk/core";

const ws = createWebSocket<ClientMsg, ServerMsg>(url, {
  onMessage: (msg) => console.log("Received:", msg),
  onStatusChange: (status, error) => console.log("Status:", status),
  reconnect: true,
  reconnectInterval: 1000,
});

ws.connect();
ws.send({ type: "input", data: "hello" });
ws.disconnect();
```

---

### `detectEnvironment()`

```typescript
import { detectEnvironment } from "@creature-ai/sdk/core";

const env = detectEnvironment();
// "mcp-apps" | "chatgpt" | "standalone"
```

---

### Host Identity Utilities

For MCP Apps environments, the spec-compliant way to identify the host is via `hostContext.userAgent` (received after `ui/initialize`).

```typescript
import { createHostAsync, isHost, KNOWN_HOSTS } from "@creature-ai/sdk/core";

const host = await createHostAsync({ name: "my-app", version: "1.0.0" });
const hostContext = host.getHostContext();

if (isHost(hostContext, KNOWN_HOSTS.CREATURE)) {
  // Running in Creature
}
```

---

### Theme Utilities

```typescript
import {
  createHost,
  applyDocumentTheme,
  applyHostStyleVariables,
  getDocumentTheme,
} from "@creature-ai/sdk/core";

const host = createHost({ name: "my-app", version: "1.0.0" });
host.connect();

// In MCP Apps, the host provides theme + style variables via hostContext.
// Note: the SDK already applies these automatically; use these utilities only for advanced/custom setups.
const hostContext = host.getHostContext();

applyDocumentTheme("dark");
// Sets data-theme="dark" on <html>

applyHostStyleVariables(hostContext?.styles?.variables);
// Injects CSS custom properties

const theme = getDocumentTheme();
// "light" | "dark"
```

---

### Direct Client Access

For advanced cases, use platform-specific clients:

```typescript
import { McpAppsAdapter, ChatGptAdapter, detectEnvironment } from "@creature-ai/sdk/core";

const client = detectEnvironment() === "chatgpt"
  ? ChatGptAdapter.create({ name: "my-app", version: "1.0.0" })
  : McpAppsAdapter.create({ name: "my-app", version: "1.0.0" });

client.connect();
```

---

## Vite Plugin (`@creature-ai/sdk/vite`)

### `creature(options)`

Build plugin for MCP App UIs.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { creature } from "@creature-ai/sdk/vite";

export default defineConfig({
  plugins: [react(), creature()],
});
```

**Options**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `uiDir` | `string` | `"src/ui"` | Directory for `page.tsx` entry points |
| `outDir` | `string` | `"dist/ui"` | Build output directory |
| `hmrPort` | `number` | `5899` | HMR WebSocket port |
| `generateBundle` | `boolean` | `false` | Generate `bundle.js` for serverless |

**Convention**

Place `page.tsx` files in your UI directory:

```
src/ui/
├── page.tsx           → dist/ui/main.html
├── settings/page.tsx  → dist/ui/settings.html
└── _components/       → ignored (underscore prefix)
```

**Serverless Bundle**

Enable `generateBundle: true` to create a JS module with embedded HTML:

```typescript
// vite.config.ts
creature({ generateBundle: true })

// server.ts
import { main, settings } from "./dist/ui/bundle.js";

app.resource({ uri: "ui://my-app/main", html: main });
app.resource({ uri: "ui://my-app/settings", html: settings });
```

---

## Platform Compatibility

| Feature | Creature | ChatGPT | Notes |
|---------|----------|---------|-------|
| Tool calls | ✅ | ✅ | `callTool()` works on both |
| Structured content | ✅ | ✅ | Tool results with `data` |
| Widget state | ✅ | ✅ | `setWidgetState()` persists |
| Tool input/result events | ✅ | ✅ | Callbacks fire on both |
| Environment detection | ✅ | ✅ | `detectEnvironment()` |
| Display mode requests | ✅ | ✅ | Host may coerce |
| Creature OAuth | ✅ | ✅ | `getIdentity()` works on both |
| WebSocket channels | ✅ | ❌ | Creature only |
| Theme change events | ✅ | ❌ | Creature only |
| Teardown events | ✅ | ❌ | Creature only |
| DevConsole logging | ✅ | ❌ | Falls back to `console` |
| Multi-instance | ✅ | ❌ | ChatGPT always singleton |
| Pip icons | ✅ | ❌ | Creature only |
| Org/Project context | ✅ | ❌ | ChatGPT has user only |

---

## Types

### Core Types

```typescript
type Environment = "mcp-apps" | "chatgpt" | "standalone";

type DisplayMode = "pip" | "inline" | "fullscreen";

type LogLevel = "debug" | "info" | "notice" | "warning" | "error";

type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface StructuredWidgetState {
  modelContent?: string | Record<string, unknown> | null;  // AI-visible
  privateContent?: Record<string, unknown> | null;         // UI-only
  imageIds?: string[];
}

type WidgetState = StructuredWidgetState | Record<string, unknown>;
```

### Server Types

```typescript
type TransportType = "streamable-http" | "stdio";

interface TransportSessionInfo {
  id: string;
  transport: TransportType;
}

type ToolVisibility = "model" | "app";
```

### Import Paths

```typescript
// Server
import type {
  AppConfig,
  ResourceConfig,
  ToolConfig,
  ToolResult,
  ToolContext,
  ToolHandler,
  DisplayMode,
  ToolVisibility,
  TransportType,
  TransportSessionInfo,
  WebSocketConnection,
  StateAdapter,
  RealtimeAdapter,
} from "@creature-ai/sdk/server";

// React
import type {
  UseHostConfig,
  UseHostReturn,
  UseToolResultReturn,
  UseWebSocketConfig,
  UseWebSocketReturn,
  Logger,
  AdapterKind,
  HostContext,
} from "@creature-ai/sdk/react";

// Core
import type {
  Environment,
  DisplayMode,
  LogLevel,
  WidgetState,
  StructuredWidgetState,
  ToolResult,
  HostClientConfig,
  HostClientState,
  HostContext,
  AdapterKind,
  HostIdentity,
  UnifiedHostClient,
  UnifiedHostClientEvents,
  WebSocketStatus,
  WebSocketClient,
  WebSocketClientConfig,
} from "@creature-ai/sdk/core";
```

---

## License

MIT

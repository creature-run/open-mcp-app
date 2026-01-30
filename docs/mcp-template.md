# SDK Reference

Complete API documentation for `open-mcp-app`. This reference covers all server and client APIs with detailed options.

→ New to MCP Apps? Start with the [Quick Start](./building-mcp-apps.md).

---

## Server API

Import from `open-mcp-app/server`.

### createApp()

Create an MCP server:

```typescript
import { createApp } from "open-mcp-app/server";

const app = createApp({
  name: "my-app",
  version: "1.0.0",
});
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | App identifier |
| `version` | string | Semantic version |

---

### app.resource()

Register a UI resource:

```typescript
app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  description: "Interactive dashboard",
  displayModes: ["pip"],
  html: "ui/main.html",
  icon: { svg: ICON_SVG, alt: "Dashboard" },
  csp: {
    connectDomains: ["https://api.example.com"],
    resourceDomains: ["https://cdn.example.com"],
  },
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | ✅ | Display name in UI |
| `uri` | string | ✅ | Must start with `ui://` |
| `description` | string | | Shown in resource listing |
| `displayModes` | array | ✅ | `["pip"]`, `["inline"]`, or both |
| `html` | string \| () => string | ✅ | Path or function returning HTML |
| `icon` | object | | SVG icon for pip tab |
| `csp` | object | | External domain allowlist |

#### Icon Requirements

- SVG format
- Uses `currentColor` for theme support
- Under 10KB

```typescript
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path 
    fill="none" 
    stroke="currentColor" 
    stroke-linecap="round" 
    stroke-width="16" 
    d="M40 128h176M40 64h176M40 192h104"
  />
</svg>`;

export const ICON_ALT = "Todo List";
```

Icon libraries: [Phosphor Icons](https://phosphoricons.com/), [Heroicons](https://heroicons.com/), [Lucide](https://lucide.dev/)

---

### app.tool()

Register a tool the AI can call:

```typescript
import { z } from "zod";

app.tool(
  "todo_add",
  {
    description: "Add a new todo item",
    input: z.object({
      text: z.string().describe("The todo text"),
    }),
    ui: "ui://my-app/todos",
    visibility: ["model", "app"],
    displayModes: ["pip"],
    defaultDisplayMode: "pip",
  },
  async ({ text }) => {
    return {
      data: { success: true },
      text: `Added: ${text}`,
      title: "Todos",
    };
  }
);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `description` | string | | Shown to the AI |
| `input` | ZodSchema | | Input validation |
| `ui` | string | | Links to a UI resource |
| `visibility` | array | `["model", "app"]` | Who can call the tool |
| `displayModes` | array | | Supported display modes |
| `defaultDisplayMode` | string | | Preferred mode when unspecified |
| `multiSession` | boolean | `false` | Create new pip instance each call |

#### Tool Visibility

Control who can call each tool:

| Visibility | Agent | UI | Use Case |
|------------|-------|-----|----------|
| `["model", "app"]` | ✅ | ✅ | Default—full access |
| `["model"]` | ✅ | ❌ | Sensitive operations |
| `["app"]` | ❌ | ✅ | UI-only actions |

Example: Hidden refresh button

```typescript
app.tool("refresh_data", {
  description: "Refresh dashboard data",
  visibility: ["app"],  // AI can't see or call this
  ui: "ui://my-app/dashboard",
}, async () => {
  const data = await fetchLatest();
  return { data };
});
```

---

### Tool Result

Return structured data from tool handlers:

```typescript
return {
  data: { items: [...], count: 42 },  // Structured data for UI
  text: "Found 42 items",              // Text for AI context
  title: "Results (42)",               // Dynamic widget title
  isError: false,                      // Error indicator
};
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | object | Structured data sent to UI |
| `text` | string | Text summary for AI context (keep concise) |
| `title` | string | Updates widget title |
| `isError` | boolean | Indicates failure |

---

### app.start()

Start the HTTP server:

```typescript
app.start();
```

The server listens on `MCP_PORT` environment variable (default: 3000) and exposes `/mcp` for the MCP protocol.

---

### CSP

Content Security Policy restricts external resources UI can load:

```typescript
app.resource({
  uri: "ui://my-app/dashboard",
  html: "ui/main.html",
  csp: {
    connectDomains: ["https://api.example.com"],
    resourceDomains: ["https://cdn.example.com"],
  },
});
```

| Field | Description |
|-------|-------------|
| `connectDomains` | URLs the UI can fetch from |
| `resourceDomains` | URLs for images, scripts, stylesheets |

If no CSP is declared, the Host blocks all external connections.

---

## React UI API

Import from `open-mcp-app/react`.

### useHost()

Connect to the host (Creature or ChatGPT):

```tsx
import { useHost } from "open-mcp-app/react";

const { isReady, callTool, environment, log, setWidgetState } = useHost({
  name: "my-app",
  version: "1.0.0",
  onToolResult: (result) => {
    console.log("Got result:", result.structuredContent);
  },
  onThemeChange: (theme) => {
    console.log("Theme:", theme);
  },
});
```

#### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | App name (must match server) |
| `version` | string | App version |
| `onToolResult` | function | Called when tool completes |
| `onToolInput` | function | Called when tool starts (with args) |
| `onThemeChange` | function | Called when theme changes |

#### Return Values

| Return | Type | Description |
|--------|------|-------------|
| `isReady` | boolean | Connection established |
| `environment` | string | `"mcp-apps"`, `"chatgpt"`, or `"standalone"` |
| `callTool` | function | Call a tool: `callTool(name, args)` |
| `setWidgetState` | function | Persist UI state |
| `log` | function | Log to DevConsole |

---

### useToolResult()

Manage tool result state with type safety:

```tsx
import { useToolResult } from "open-mcp-app/react";

interface MyData {
  items: Array<{ id: string; name: string }>;
  count: number;
}

const { data, title, isError, onToolResult } = useToolResult<MyData>();

// Pass onToolResult to useHost
const { callTool } = useHost({
  onToolResult,
});

// data is typed as MyData | undefined
return <div>{data?.count} items</div>;
```

| Return | Type | Description |
|--------|------|-------------|
| `data` | T \| undefined | Typed result data |
| `title` | string \| undefined | Dynamic title |
| `isError` | boolean | Error indicator |
| `onToolResult` | function | Pass to useHost |

---

### useWidgetState()

Persist UI state across sessions:

```tsx
import { useWidgetState } from "open-mcp-app/react";

const [state, setState] = useWidgetState({
  filter: "all",
  selectedId: null,
});

// State persists when widget closes and reopens
```

#### ChatGPT Compatibility

For apps that need to work in ChatGPT, use structured state:

```tsx
const [state, setState] = useWidgetState({
  modelContent: { selectedItems: [] },  // AI can see this
  privateContent: { viewMode: "grid" }, // UI-only
});
```

---

### useChannel()

Real-time WebSocket communication:

```tsx
import { useChannel } from "open-mcp-app/react";

type ClientMsg = { type: "input"; data: string };
type ServerMsg = { type: "output"; data: string };

const channel = useChannel<ClientMsg, ServerMsg>(channelUrl, {
  onMessage: (msg) => console.log("Received:", msg),
  onOpen: () => console.log("Connected"),
  onClose: () => console.log("Disconnected"),
});

// Send messages
channel.send({ type: "input", data: "hello" });
```

| Return | Type | Description |
|--------|------|-------------|
| `send` | function | Send message to server |
| `isConnected` | boolean | WebSocket connection status |

---

## Advanced Features

### Multi-Session Tools

Create independent widget instances on each call:

```typescript
app.tool("terminal_create", {
  description: "Create a new terminal session",
  ui: "ui://my-app/terminal",
  multiSession: true,  // Each call creates new widget instance
}, async () => {
  const sessionId = crypto.randomUUID();
  
  return {
    data: { sessionId },  // Widget stores this for routing
  };
});

// Other tools can target specific sessions
app.tool("terminal_send", {
  description: "Send to terminal",
  input: z.object({
    sessionId: z.string(),  // Routes to correct widget
    command: z.string(),
  }),
  ui: "ui://my-app/terminal",
}, async ({ sessionId, command }) => {
  // Process command for specific session
});
```

---

### WebSocket Channels (Advanced)

For real-time streaming (terminals, live logs):

#### Server

```typescript
import { createApp } from "open-mcp-app/server";

type ServerMsg = { type: "output"; data: string };
type ClientMsg = { type: "input"; data: string };

const app = createApp({ name: "terminal", version: "1.0.0" });

const terminalChannel = app.channel<ServerMsg, ClientMsg>("terminal");

app.tool("terminal_create", {
  description: "Create terminal",
  ui: "ui://terminal/main",
  multiSession: true,
}, async () => {
  const sessionId = crypto.randomUUID();
  const channel = terminalChannel.session(sessionId);
  
  channel.onMessage((msg) => {
    if (msg.type === "input") {
      channel.send({ type: "output", data: "$ " + msg.data + "\n" });
    }
  });
  
  return {
    data: { sessionId, channelUrl: channel.url },
  };
});
```

#### React UI

```tsx
import { useChannel } from "open-mcp-app/react";

function Terminal({ channelUrl }: { channelUrl: string }) {
  const [output, setOutput] = useState("");
  
  const channel = useChannel<ClientMsg, ServerMsg>(channelUrl, {
    onMessage: (msg) => {
      if (msg.type === "output") {
        setOutput((prev) => prev + msg.data);
      }
    },
  });
  
  return (
    <div>
      <pre>{output}</pre>
      <input onKeyDown={(e) => {
        if (e.key === "Enter") {
          channel.send({ type: "input", data: e.currentTarget.value });
          e.currentTarget.value = "";
        }
      }} />
    </div>
  );
}
```

---

### ChatGPT Compatibility

The SDK detects the environment automatically:

```tsx
const { environment } = useHost({ ... });

if (environment === "chatgpt") {
  // ChatGPT-specific behavior
}

if (environment === "mcp-apps") {
  // Creature-specific features
}
```

| Feature | Creature | ChatGPT |
|---------|----------|---------|
| Tool calls | ✅ | ✅ |
| Widget state | ✅ | ✅ |
| Theming | ✅ | Partial |
| Channels | ✅ | ❌ |
| Logging | ✅ | Console only |
| Teardown | ✅ | ❌ |

---

## Development

### Vite Configuration

Use the SDK's Vite plugin for HMR:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { creature } from "open-mcp-app/vite";

export default defineConfig({
  plugins: [
    react(),
    creature(),       // SDK HMR support
    viteSingleFile(), // Bundle into single HTML
  ],
});
```

### Package Scripts

```json
{
  "scripts": {
    "build": "npm run build:ui && npm run build:server",
    "build:ui": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "dev": "NODE_ENV=development concurrently -k \"vite build --watch\" \"tsc -p tsconfig.server.json --watch\" \"nodemon --delay 2 dist/server.js\"",
    "start": "node dist/server.js"
  }
}
```

### Debugging

#### Server Logs

Use `console.error` (stdout is reserved for MCP protocol):

```typescript
console.error("[my-app] Processing:", data);
```

#### UI Logs

Use the SDK's logger:

```tsx
const { log } = useHost({ ... });

log("User clicked button");
log.debug("Verbose info");
log.error("Failed", { details: err.message });
```

Logs appear in Creature's DevConsole alongside server logs.

### Refreshing

After changes:

| Change Type | Action |
|-------------|--------|
| UI only | Click **↻** in pip title bar |
| Server code | Click **Restart** in MCP Settings |

---

## Complete Example

See a full working example: [Todo List App](https://github.com/creature-run/sdk/tree/main/examples/todo)

```typescript
// src/server.ts
import { createApp } from "open-mcp-app/server";
import { z } from "zod";
import { ICON_SVG, ICON_ALT } from "./icon.js";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todos: Map<string, Todo> = new Map();

const app = createApp({ name: "todos", version: "1.0.0" });

app.resource({
  name: "Todo List",
  uri: "ui://todos/main",
  displayModes: ["pip"],
  html: "ui/main.html",
  icon: { svg: ICON_SVG, alt: ICON_ALT },
});

app.tool("todo_list", {
  description: "List all todos",
  ui: "ui://todos/main",
}, async () => {
  const allTodos = Array.from(todos.values());
  const openCount = allTodos.filter((t) => !t.completed).length;
  return {
    data: { todos: allTodos },
    title: `Todos (${openCount})`,
  };
});

app.tool("todo_add", {
  description: "Add a todo",
  input: z.object({ text: z.string() }),
  ui: "ui://todos/main",
}, async ({ text }) => {
  const todo = { id: Date.now().toString(), text, completed: false };
  todos.set(todo.id, todo);
  return {
    data: { todo, todos: Array.from(todos.values()) },
    text: `Added: ${text}`,
  };
});

app.tool("todo_toggle", {
  description: "Toggle a todo",
  input: z.object({ id: z.string() }),
  ui: "ui://todos/main",
}, async ({ id }) => {
  const todo = todos.get(id);
  if (!todo) return { data: { success: false }, isError: true };
  todo.completed = !todo.completed;
  return { data: { todo, todos: Array.from(todos.values()) } };
});

app.start();
```

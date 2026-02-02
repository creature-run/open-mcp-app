![open-mcp-app-github-v1](https://github.com/user-attachments/assets/3dc92f79-8277-4e7f-94c2-2e4cea043941)


**Build your MCP App once, run it anywhere.**

Build interactive UI apps for AI agents that work across ChatGPT, Claude, Creature, and any host that supports the MCP Apps specification. No platform lock-in. Write once, deploy everywhere.

> **Alpha Release**: This SDK is a work in progress. APIs may change. We welcome feedback and contributions.

Maintained by the team behind [Creature](https://creature.run).

**Quick Links:**
- [SDK Documentation](#sdk-documentation): API reference and examples
- [MCP Apps Spec](https://github.com/modelcontextprotocol/ext-apps): Official specification

**Examples:**
- [todos](/mcp-apps/todos): Simple todo list with CRUD operations
- [notes](/mcp-apps/notes): Markdown notes with editor and list views
- [crm](/mcp-apps/crm): Customer relationship manager with search

## Features

- **Build once, run anywhere**: Deploy to any host that supports MCP Apps: ChatGPT, Claude, Creature, and more
- **Simpler developer experience**: Cleaner APIs than the default MCP SDKs with less boilerplate
- **Clean separation of APIs**: Standard spec-compliant APIs vs clearly-marked experimental extensions
- **Native look and feel**: Default styles for popular hosts so your app looks native on every platform
- **Experimental capabilities**: APIs for multiple simultaneous apps, persistent state, storage, view routing, and more
- **Robust examples**: Full working apps in `/mcp-apps` to learn from and build on

## SDK Documentation

The `open-mcp-app` SDK enables MCP servers to deliver interactive UIs to AI hosts. It implements the [MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps) with additional conveniences for common patterns.

### Installation

```bash
npm install open-mcp-app
```

### Goals

1. **Cross-platform**: Write once, run on Claude, ChatGPT, Creature, and other MCP hosts
2. **Simple API**: Define tools and UIs with minimal boilerplate
3. **Type-safe**: Full TypeScript support with Zod schema validation
4. **Spec-compliant**: Implements the MCP Apps specification for interoperability

## Server API

The server API (`open-mcp-app/server`) is used to define MCP servers with tools and UI resources.

### Basic Example

```typescript
import { createApp } from "open-mcp-app/server";
import { z } from "zod";

const app = createApp({
  name: "my-app",
  version: "1.0.0",
});

// Define a UI resource
app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  description: "Interactive dashboard",
  displayModes: ["inline", "pip"],
  html: "dist/ui/main.html", // or raw HTML string
});

// Define a tool that uses the UI
app.tool(
  "get_data",
  {
    description: "Fetch and display data",
    input: z.object({
      query: z.string().describe("Search query"),
    }),
    ui: "ui://my-app/dashboard", // Links tool to UI resource
  },
  async (input, context) => {
    const results = await fetchData(input.query);
    return {
      data: { results },
      text: `Found ${results.length} items`,
    };
  }
);

app.start();
```

### Tool Configuration

| Option | Description |
|--------|-------------|
| `description` | Text shown to the AI explaining what the tool does |
| `input` | Zod schema for validating and typing tool arguments |
| `ui` | URI of the UI resource to render results (e.g., `"ui://my-app/dashboard"`) |
| `visibility` | Array of `"model"` and/or `"app"`. Controls who can call the tool |
| `displayModes` | Array of `"inline"`, `"pip"`, `"fullscreen"`. Controls where the UI can appear |
| `loadingMessage` | Text shown while tool runs (ChatGPT only) |
| `completedMessage` | Text shown when tool completes (ChatGPT only) |

```typescript
app.tool("tool_name", {
  description: "Tool description for the AI",
  input: z.object({ query: z.string() }),
  ui: "ui://my-app/resource",
  visibility: ["model", "app"],
  displayModes: ["inline", "pip"],
}, handler);
```

### Resource Configuration

| Option | Description |
|--------|-------------|
| `name` | Display name for the resource |
| `uri` | Unique identifier, must start with `ui://` |
| `description` | What this UI does |
| `displayModes` | Where the UI can be rendered: `"inline"` (in chat), `"pip"` (floating), `"fullscreen"` |
| `html` | UI content: file path, raw HTML string, or `() => string` function |
| `icon` | `{ svg, alt }` for pip/tab icons (SVG should use `currentColor`) |
| `csp.connectDomains` | External APIs the UI can fetch from |
| `csp.resourceDomains` | External CDNs for scripts, styles, images |

```typescript
app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  description: "Interactive data dashboard",
  displayModes: ["inline", "pip", "fullscreen"],
  html: "dist/ui/main.html",
  icon: { svg: "<svg>...</svg>", alt: "Dashboard" },
  csp: {
    connectDomains: ["https://api.example.com"],
    resourceDomains: ["https://cdn.example.com"],
  },
});
```

### Tool Handler Context

Tool handlers receive `(input, context)`. The context provides:

| Property/Method | Description |
|-----------------|-------------|
| `instanceId` | Unique ID for this UI instance, used for routing subsequent calls |
| `getState<T>()` | Get server-side state for this instance (not sent to UI) |
| `setState<T>(state)` | Store server-side state for this instance |
| `send<T>(message)` | Send a message to the UI via WebSocket (experimental) |
| `onMessage<T>(handler)` | Handle messages from the UI via WebSocket (experimental) |
| `onConnect(handler)` | Called when UI connects to WebSocket (experimental) |
| `websocketUrl` | URL for UI to connect to WebSocket (experimental) |

```typescript
app.tool("my_tool", config, async (input, context) => {
  const { instanceId } = context;
  context.setState({ lastQuery: input.query });
  const state = context.getState<{ lastQuery: string }>();

  return {
    data: { results: [...] },  // Sent to UI as structuredContent
    text: "Found 5 items",     // Sent to AI as context
    title: "Search Results",   // Optional title for the UI panel
  };
});
```

## React API

The React API (`open-mcp-app/react`) is used in your UI code to communicate with the host.

### Basic Example

```tsx
import { HostProvider, useHost } from "open-mcp-app/react";

function App() {
  return (
    <HostProvider name="my-app" version="1.0.0">
      <MyWidget />
    </HostProvider>
  );
}

function MyWidget() {
  const { isReady, callTool, log, hostContext } = useHost();

  // callTool returns [runFn, state] tuple
  const [fetchData, fetchState] = callTool<{ results: Item[] }>("get_data");

  useEffect(() => {
    if (isReady) {
      fetchData({ query: "example" });
    }
  }, [isReady]);

  if (fetchState.status === "loading") return <p>Loading...</p>;
  if (fetchState.status === "error") return <p>Error: {fetchState.error}</p>;

  return (
    <ul>
      {fetchState.data?.results.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### useHost Return Values

| Property/Method | Description |
|-----------------|-------------|
| `isReady` | `true` when connected to host and ready to call tools |
| `environment` | Detected host: `"chatgpt"`, `"mcp-apps"`, or `"standalone"` |
| `hostContext` | Host-provided context: theme, styles, locale, display mode, dimensions |
| `callTool<T>(name)` | Returns `[runFn, state]` tuple for calling a server tool |
| `requestDisplayMode(mode)` | Request the host switch to `"inline"`, `"pip"`, or `"fullscreen"` |
| `log` | Logger with `.debug()`, `.info()`, `.warn()`, `.error()` methods |
| `onToolResult(callback)` | Subscribe to tool results from agent calls (returns unsubscribe fn) |
| `exp` | Experimental APIs object (see below) |
| `exp_widgetState<T>()` | Returns `[state, setState]` tuple for persistent widget state |

```typescript
const { isReady, callTool, log, hostContext } = useHost();

// Call a tool - returns [runFunction, stateObject]
const [search, searchState] = callTool<{ results: Item[] }>("search");

// searchState has: status, data, error, isError, text, title, instanceId
if (searchState.status === "loading") { /* ... */ }
if (searchState.status === "success") { /* use searchState.data */ }
if (searchState.status === "error") { /* use searchState.error */ }

// Run the tool
await search({ query: "hello" });

// Log to host
log.info("User clicked button", { buttonId: "submit" });
```

### Theming

The host provides CSS variables for theming (per MCP Apps spec):

```css
.container {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  border-radius: var(--border-radius-md);
}
```

Access theme info programmatically:

```typescript
const { hostContext } = useHost();
const theme = hostContext?.theme; // "light" | "dark"
const styles = hostContext?.styles?.variables;
```

## What's in the MCP Apps Spec vs Experimental

### MCP Apps Spec (Stable)

These features are part of the [official MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps) and work across all compliant hosts:

| Feature | Description |
|---------|-------------|
| `ui://` resources | UI resources registered with the MCP server |
| `text/html;profile=mcp-app` | MIME type for MCP app HTML content |
| Tool `_meta.ui.resourceUri` | Links tools to UI resources |
| Tool visibility | `["model", "app"]` controls who can call tools |
| Display modes | `inline`, `fullscreen`, `pip` |
| Host context | Theme, styles, locale, timezone, container dimensions |
| CSS variables | Standardized theming variables |
| `ui/initialize` | Handshake between UI and host |
| `tools/call` | UI calling server tools |
| `ui/open-link` | Request host to open external URLs |
| `ui/message` | Send messages to chat |
| `ui/request-display-mode` | Request display mode changes |
| CSP configuration | `connectDomains`, `resourceDomains`, `frameDomains` |

### Experimental APIs

These features are extensions not yet part of the MCP Apps spec. Access via the `exp` namespace:

#### Server-side (`open-mcp-app/server`)

```typescript
import { exp } from "open-mcp-app/server";
```

| Method | Description |
|--------|-------------|
| `exp.getProjectId()` | Returns the current project UUID, or `null` |
| `exp.getServerName()` | Returns the MCP server name |
| `exp.getWritableDirectory()` | Returns path to sandboxed storage directory |

**KV Store**: Persistent key-value storage scoped to the project:

| Method | Description |
|--------|-------------|
| `exp.kvGet(key)` | Get a value by key, returns `string \| null` |
| `exp.kvSet(key, value)` | Store a string value, returns `boolean` |
| `exp.kvDelete(key)` | Delete a key, returns `boolean` |
| `exp.kvList(prefix?)` | List keys, optionally filtered by prefix |
| `exp.kvListWithValues(prefix?)` | List keys with their values |
| `exp.kvSearch(query, opts?)` | Full-text search across values |
| `exp.kvIsAvailable()` | Check if KV store is available |

**Blob Store**: Binary data storage:

| Method | Description |
|--------|-------------|
| `exp.blobPut(name, data, mimeType?)` | Store binary data (max 10MB) |
| `exp.blobGet(name)` | Retrieve binary data and mime type |
| `exp.blobDelete(name)` | Delete a blob |
| `exp.blobList(prefix?)` | List blob names |
| `exp.blobIsAvailable()` | Check if blob store is available |

**File I/O**: Sandboxed filesystem access:

| Method | Description |
|--------|-------------|
| `exp.readFile(path)` | Read file contents as string |
| `exp.writeFile(path, data)` | Write string to file (creates dirs) |
| `exp.deleteFile(path)` | Delete a file |
| `exp.exists(path)` | Check if path exists |
| `exp.mkdir(path)` | Create directory recursively |
| `exp.readdir(path?)` | List directory contents |
| `exp.rmdir(path)` | Remove directory recursively |

#### Client-side (`open-mcp-app/react`)

```typescript
const { exp, exp_widgetState } = useHost();
```

| Method | Description |
|--------|-------------|
| `exp_widgetState<T>()` | Returns `[state, setState]` tuple persisted across tool calls |
| `exp.setTitle(title)` | Set the UI panel/pip title |
| `exp.updateModelContext(ctx)` | Update context sent to AI in future turns |
| `exp.sendFollowUpMessage(text)` | Send a user message to the chat |
| `exp.requestModal()` | Request modal display mode |
| `exp.requestClose()` | Request the host close this UI |
| `exp.getInstanceId()` | Get this UI's instance ID |
| `exp.getInitialToolResult()` | Get the tool result that opened this UI |
| `exp.supportsMultiInstance()` | Check if host supports multiple UI instances |
| `exp.sendNotification(opts)` | Send a notification to the user |

#### Resource-level experimental options

| Option | Description |
|--------|-------------|
| `instanceMode` | `"single"` (default) or `"multiple"`. Controls whether to reuse or create new instances |
| `views` | URL-pattern to tool-name mapping for view routing |
| `experimental.websocket` | Enable WebSocket for real-time server→UI communication |

```typescript
app.resource({
  // ... standard config
  instanceMode: "multiple",
  views: {
    "/": ["list_items"],           // Root view, single instance
    "/editor": ["create_item"],    // Creates new instance
    "/editor/:id": ["edit_item"],  // One instance per unique id
  },
  experimental: {
    websocket: true,
  },
});
```

## API Reference

### Server Exports (`open-mcp-app/server`)

| Export | Description |
|--------|-------------|
| `createApp(config)` | Create an MCP app with name, version, and optional settings |
| `App` | The App class (usually use `createApp` instead) |
| `loadHtml(path)` | Load HTML from a file path synchronously |
| `htmlLoader(path, baseDir?)` | Create a lazy HTML loader function |
| `wrapServer(expressApp)` | Add MCP endpoints to an existing Express app |
| `exp` | Namespace for experimental server APIs |
| `MIME_TYPES` | Constants: `MCP_APPS`, `CHATGPT` |

### React Exports (`open-mcp-app/react`)

| Export | Description |
|--------|-------------|
| `useHost(config?)` | Main hook. Returns tools, state, logging, host context |
| `HostProvider` | Context provider for `useHost()` without config |
| `useToolResult(callback)` | Subscribe to tool results from agent |
| `useWebSocket(url)` | Connect to a WebSocket, returns `{ send, lastMessage, status }` |
| `useViews()` | Get current view path and navigation for multi-view apps |
| `detectEnvironment()` | Returns `"chatgpt"`, `"mcp-apps"`, or `"standalone"` |
| `createHost(config)` | Create a host client manually (advanced) |
| `applyDocumentTheme(theme)` | Set `<html>` color-scheme from `"light"` or `"dark"` |
| `applyHostStyleVariables(vars)` | Apply host CSS variables to document |
| `applyHostFonts(css)` | Inject `@font-face` rules from host |

## Why We Built This

We're the team behind [Creature](https://creature.run), and we needed a place to experiment with and push forward the MCP Apps specification while holding ourselves accountable to cross-platform compatibility.

We believe MCP Apps built for Creature should run anywhere. No lock-in. This SDK enforces that discipline: standard APIs work everywhere, experimental APIs are clearly marked, and we test against multiple hosts.

We hope this becomes a space where the community can advance MCP Apps together, safely, across platforms, with a clear path from experimental features to standardization.

Contributions, feedback, and ideas are welcome.

## License

MIT

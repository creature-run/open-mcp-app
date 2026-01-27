# Building MCP Apps

Build interactive AI apps with `@creature-ai/sdk` that work on both **Creature** and **ChatGPT**. This guide covers everything from quick start to designing for cross-platform compatibility.

## Prerequisites

- Node.js 18+
- Basic TypeScript/React knowledge

---

## Quick Start

### Create Your App

Create your MCP App from within Creature:

1. From the **Projects** page (home), click **Create MCP App**
2. Pick a folder location for your new app
3. Creature scaffolds, builds, and auto-connects your app

Your MCP App is now running and connected! Try it immediately by typing **"List todos"** in the chat.

Your app is created with:
- Server with tools and UI resource
- React UI with SDK hooks
- Vite build configuration
- Development scripts

### Project Structure

```
my-app/
  src/
    server/
      app.ts        # App definition with resources
      dev.ts        # Development entry point
      icon.ts       # Widget icon (SVG)
      types.ts      # Shared types
      tools/
        my-tool.ts  # Tool implementations
    ui/
      page.tsx      # React UI
      styles.css
  dist/             # Build output
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.server.json
```

---

## Understanding the Two Platforms

Before building, understand how Creature and ChatGPT differ:

| Aspect | Creature | ChatGPT |
|--------|----------|---------|
| **Widget Display** | Multiple PIPs (tabs) in sidebar + inline | Inline only (embedded in messages) |
| **Widget Lifetime** | PIPs persist across messages | Fresh widget per tool call |
| **User Navigation** | Switch between PIP tabs | Scroll through message history |
| **Real-time Communication** | ✅ WebSocket support | ❌ Not available |
| **Multi-instance** | ✅ Multiple instances of same resource | ❌ Always singleton |
| **Theme Events** | ✅ Dynamic theme updates | ❌ Theme set at load |

### The Key Difference

**Creature** has a multi-PIP workspace where widgets persist as tabs alongside the conversation. Users can have multiple PIPs open and switch between them.

**ChatGPT** embeds widgets directly in messages. Each tool call creates a fresh widget in the response. There are no persistent tabs—users scroll through the conversation to see previous widgets.

---

## Designing for Both Platforms

### Rule 1: Support Both Display Modes

Always declare both `inline` and `pip` display modes:

```typescript
app.resource({
  name: "My Widget",
  uri: "ui://my-app/main",
  displayModes: ["inline", "pip"],  // Required for cross-platform
  html: "dist/ui/main.html",
});
```

| Platform | Behavior |
|----------|----------|
| **Creature** | Uses `defaultDisplayMode` or agent's choice |
| **ChatGPT** | Always renders inline (ignores preference) |

**Design your UI to work in both contexts**—a constrained inline embed AND a larger PIP panel.

### Rule 2: Understand Widget State Scope

Widget state (`setWidgetState()`) has different lifetimes:

| Platform | Scope | Behavior |
|----------|-------|----------|
| **Creature PIP** | Conversation | State persists while PIP tab is open |
| **Creature Inline** | Message | State tied to that specific message |
| **ChatGPT** | Message | State tied to that specific message |

**Implication**: On ChatGPT, each tool call creates a fresh widget. State from a previous message's widget doesn't automatically transfer to a new one.

### Rule 3: Use Structured Widget State

For cross-platform compatibility, use the structured state format:

```tsx
const { setWidgetState } = useHost({ ... });

setWidgetState({
  modelContent: { selectedItems: [], query: "" },  // AI can see this
  privateContent: { viewMode: "list", scrollPos: 0 },  // UI-only
});
```

| Field | Visible to AI | Use For |
|-------|---------------|---------|
| `modelContent` | ✅ Yes | Data the AI needs for context—selections, queries, important state |
| `privateContent` | ❌ No | UI preferences—view modes, collapsed panels, scroll positions |
| `imageIds` | ✅ Yes | File IDs for images the AI should know about |

### Rule 4: Backend State Works Everywhere

The `instanceId` pattern works on both platforms—server state persists, but UI behavior differs:

```typescript
// Server: Tools automatically receive instanceId via context
app.tool("add_item", {
  description: "Add an item",
  input: z.object({ item: z.string() }),
  ui: "ui://my-app/list",
}, async ({ item }, context) => {
  // context.instanceId is auto-generated for singleton resources
  // or provided by input for multi-instance
  const items = context.getState<string[]>() || [];
  items.push(item);
  context.setState(items);

  return {
    data: { items },  // instanceId auto-included
    text: `Added: ${item}`,
  };
});
```

**How it behaves:**

| Platform | Backend State | UI Instance |
|----------|--------------|-------------|
| **Creature** | Persists by `instanceId` | Routes to existing PIP tab (singleton) or creates new (multi-instance) |
| **ChatGPT** | Persists by `instanceId` | Always creates new widget per message |

**Key insight**: Your backend state is preserved on both platforms. The difference is only in how the UI is displayed—Creature can reuse PIP tabs, ChatGPT always creates new widgets.

### Rule 5: Gracefully Handle Platform-Specific Features

Some features only work on Creature. Check `isCreature` (and `environment`) and degrade gracefully:

```tsx
const { environment, isCreature } = useHost({ ... });

// WebSocket - Creature only
const { status, send } = useWebSocket(
  isCreature ? websocketUrl : undefined,
  { onMessage: handleMessage }
);

// Teardown handlers - MCP Apps only (no-op on ChatGPT)
useHost({
  onTeardown: environment === "mcp-apps" 
    ? () => saveState() 
    : undefined,
});
```

**Creature-only extensions:**
- WebSocket communication (`useWebSocket`)
- PIP tabs and multi-instance

**MCP Apps-only features (Creature + any MCP Apps host):**
- Teardown notifications (`onTeardown`)
- Theme change events (`onThemeChange`)

---

## Building the Server

### Create the App

```typescript
// src/server/app.ts
import { createApp } from "@creature-ai/sdk/server";
import { ICON_SVG, ICON_ALT } from "./icon.js";

const app = createApp({
  name: "my-app",
  version: "1.0.0",
  instructions: `This app manages a todo list. Key behaviors:
- Use action:"list" to view all todos and open the UI.
- Use action:"add" to create new items.
- Use action:"toggle" to mark items complete/incomplete.`,
  auth: { creatureManaged: true },  // Enable Creature identity
});
```

The `instructions` field is important. It tells the AI how to use your app effectively.

### Register a UI Resource

```typescript
app.resource({
  name: "Todo List",
  uri: "ui://my-app/todos",
  displayModes: ["inline", "pip"],  // Support both!
  html: "dist/ui/main.html",
  icon: { svg: ICON_SVG, alt: ICON_ALT },
});
```

### Register a Tool

The recommended pattern is a consolidated tool with an `action` parameter:

```typescript
// src/server/tools/todo.ts
import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";

const TodoSchema = z.object({
  action: z.enum(["list", "add", "toggle", "remove"])
    .describe("Action: list, add, toggle, or remove"),
  text: z.string().optional().describe("Todo text (for add)"),
  id: z.string().optional().describe("Todo ID (for toggle/remove)"),
});

export const registerTodoTool = (app: App) => {
  app.tool(
    "todo",
    {
      description: `Manage todos. Actions:
- list: Show all todos and open the UI.
- add: Create a new todo with the given text.
- toggle: Toggle completed status by ID.
- remove: Delete a todo by ID.`,
      input: TodoSchema,
      ui: "ui://my-app/todos",
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input, context) => {
      if (input.action === "add") {
        if (!input.text) {
          return { text: "text is required", isError: true, noWidget: true };
        }
        // Add todo logic...
        return {
          data: { todos: allTodos },
          text: `Added: ${input.text}`,
          title: `Todos (${openCount})`,
        };
      }
      // Handle other actions...
    }
  );
};
```

**Key options:**
- `noWidget: true` — Return error without opening/updating UI
- `title` — Dynamic title shown in the PIP tab
- `isError: true` — Mark result as an error

### Start the Server

Create a development entry point:

```typescript
// src/server/dev.ts
import { app } from "./app.js";

app.start();
```

Run with `npm run dev` which typically uses:

```json
{
  "scripts": {
    "dev": "concurrently \"vite build --watch\" \"nodemon --exec 'tsx src/server/dev.ts'\""
  }
}
```

→ See [SDK Reference](./sdk-reference.md) for all options and advanced features.

---

## Building the UI

### Basic Setup

```tsx
// src/ui/page.tsx
import { useEffect, useState } from "react";
import { useHost, useToolResult } from "@creature-ai/sdk/react";
import "./styles.css";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoData {
  todos: Todo[];
}

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { data, onToolResult } = useToolResult<TodoData>();
  
  const { callTool, isReady, log, widgetState, setWidgetState } = useHost({
    name: "my-app",
    version: "1.0.0",
    onToolResult,
  });

  // Update local state when tool results arrive
  useEffect(() => {
    if (data?.todos) {
      setTodos(data.todos);
    }
  }, [data]);

  // Fetch initial data when ready
  useEffect(() => {
    if (isReady) {
      log.info("Widget connected");
      callTool("todo", { action: "list" });
    }
  }, [isReady, callTool, log]);

  const handleAdd = async (text: string) => {
    await callTool("todo", { action: "add", text });
  };

  const handleToggle = async (id: string) => {
    await callTool("todo", { action: "toggle", id });
  };

  return (
    <div className="container">
      <h1>Todo List</h1>
      {todos.map((todo) => (
        <div key={todo.id} onClick={() => handleToggle(todo.id)}>
          {todo.completed ? "✓" : "○"} {todo.text}
        </div>
      ))}
    </div>
  );
}
```

### Using Widget State

Use `setWidgetState` for state that persists across PIP refreshes and popouts:

```tsx
const { widgetState, setWidgetState } = useHost({ ... });

// Persist state when data changes
useEffect(() => {
  if (data?.todos) {
    const incompleteCount = data.todos.filter(t => !t.completed).length;
    
    setWidgetState({
      // modelContent: Concise summary for the AI (keep it small!)
      modelContent: {
        countTotal: data.todos.length,
        countIncomplete: incompleteCount,
      },
      // privateContent: Full data for UI restoration (AI doesn't see this)
      privateContent: {
        todos: data.todos,
        lastViewedAt: new Date().toISOString(),
      },
    });
  }
}, [data, setWidgetState]);

// Restore from widget state on mount
useEffect(() => {
  const savedTodos = widgetState?.privateContent?.todos;
  if (savedTodos && todos.length === 0) {
    setTodos(savedTodos);
  }
}, [widgetState]);
```

**Best practice:** Put summaries/counts in `modelContent`, full data in `privateContent`. This keeps the AI's context window lean.

### Responsive Design for Both Modes

Design your UI to work in both inline (constrained) and PIP (larger) contexts:

```css
.app {
  /* Base styles for inline (constrained) */
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

/* Expand in PIP mode */
@container (min-height: 400px) {
  .app {
    max-height: none;
    padding: 16px;
  }
}
```

---

## Real-Time Communication

For apps that need live updates (terminals, collaborative editing), enable WebSocket on the resource:

### Server

```typescript
app.resource({
  uri: "ui://my-app/terminal",
  name: "Terminal",
  displayModes: ["pip"],
  html: "dist/ui/terminal.html",
  websocket: true,  // Enable WebSocket
  csp: { connectDomains: ["ws://localhost:3000"] },
});

app.tool("terminal_run", {
  description: "Run a command",
  input: z.object({ command: z.string() }),
  ui: "ui://my-app/terminal",
}, async ({ command }, context) => {
  // Send output when client connects
  context.onConnect(() => {
    context.send({ type: "output", data: `$ ${command}\n` });
  });

  // Handle input from UI
  context.onMessage<{ type: "input"; data: string }>((msg) => {
    // Process user input...
  });

  // websocketUrl is auto-included in result
  return { data: { ready: true } };
});
```

### UI

```tsx
import { useHost, useToolResult, useWebSocket } from "@creature-ai/sdk/react";

function Terminal() {
  const { data, onToolResult } = useToolResult<{ websocketUrl?: string }>();
  const { isCreature } = useHost({ name: "my-app", version: "1.0.0", onToolResult });

  // Only connect on Creature (WebSocket not available on ChatGPT)
  const wsUrl = isCreature ? data?.websocketUrl : undefined;

  const { status, send } = useWebSocket<ClientMsg, ServerMsg>(wsUrl, {
    onMessage: (msg) => {
      if (msg.type === "output") {
        terminal.write(msg.data);
      }
    },
  });

  return (
    <div>
      {status === "connecting" && <Spinner />}
      <TerminalView onInput={(data) => send({ type: "input", data })} />
    </div>
  );
}
```

### Cross-Platform Fallback

On ChatGPT where WebSocket isn't available, design a polling fallback or accept reduced functionality:

```tsx
const { environment, callTool } = useHost({ ... });

// WebSocket on Creature, polling on ChatGPT
useEffect(() => {
  if (environment === "chatgpt") {
    const interval = setInterval(() => {
      callTool("get_updates", { instanceId });
    }, 2000);
    return () => clearInterval(interval);
  }
}, [environment]);
```

---

## Multi-Instance Apps

For apps that need multiple independent instances (like terminals or editors), use `multiInstance: true`:

### Server

```typescript
app.resource({
  uri: "ui://my-app/editor",
  name: "Editor",
  displayModes: ["pip"],
  html: "dist/ui/editor.html",
  multiInstance: true,  // Allow multiple instances
});

app.tool("editor_open", {
  description: "Open a file in the editor",
  input: z.object({ filename: z.string() }),
  ui: "ui://my-app/editor",
}, async ({ filename }, context) => {
  // Each call creates a new instance with unique instanceId
  const content = await readFile(filename);
  context.setState({ filename, content });

  return {
    data: { filename, content },  // instanceId auto-included
    title: filename,
  };
});

app.tool("editor_save", {
  description: "Save the current file",
  input: z.object({
    instanceId: z.string(),  // Required to target specific instance
    content: z.string(),
  }),
  ui: "ui://my-app/editor",
}, async ({ instanceId, content }, context) => {
  const state = context.getState<{ filename: string }>();
  await writeFile(state.filename, content);
  return { text: `Saved ${state.filename}` };
});
```

### Cross-Platform Behavior

| Action | Creature | ChatGPT |
|--------|----------|---------|
| `editor_open` twice | Opens two PIP tabs | Two widgets in messages |
| `editor_save` with `instanceId` | Updates specific PIP | New widget, loads instance state |

**Note**: Multi-instance is only supported on Creature. On ChatGPT, all resources behave as singletons.

---

## Theming

The SDK automatically applies host theme. Use CSS variables:

```css
.container {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

Provide fallbacks for standalone testing:

```css
:root {
  --color-background-primary: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-border-primary: #e5e5e5;
}

[data-theme="dark"] {
  --color-background-primary: #1a1a1a;
  --color-text-primary: #ffffff;
  --color-border-primary: #333333;
}
```

### Supported CSS Variables

| Category | Variables |
|----------|-----------|
| Background | `--color-background-primary`, `--color-background-secondary` |
| Text | `--color-text-primary`, `--color-text-secondary` |
| Border | `--color-border-primary`, `--color-border-secondary` |
| Typography | `--font-sans`, `--font-mono` |

---

## Authentication

### Creature-Managed Auth

Enable Creature-managed authentication for verified user identity:

```typescript
import { getIdentity } from "@creature-ai/sdk/server";

const app = createApp({
  name: "my-app",
  version: "1.0.0",
  auth: { creatureManaged: true },  // Enable identity
});

app.tool("save_note", {
  description: "Save a note",
  input: z.object({ content: z.string() }),
  ui: "ui://my-app/notes",
}, async ({ content }, context) => {
  // Get user identity from token
  if (!context.creatureToken) {
    return { text: "Authentication required", isError: true };
  }

  const identity = await getIdentity(context.creatureToken);
  
  await db.notes.insert({
    userId: identity.user.id,
    orgId: identity.organization?.id || 'default',
    content,
  });

  return { text: "Note saved" };
});
```

**Identity includes:**
- `user.id`, `user.email`, `user.name` — always present
- `organization.id`, `organization.name`, `organization.slug` — Creature only (may be absent on ChatGPT)
- `project.id`, `project.name` — Creature only (may be absent on ChatGPT)

### Creature OAuth for ChatGPT

To make your authenticated MCP App work on ChatGPT, enable **Creature OAuth**. This allows ChatGPT users to sign in via Creature's OAuth 2.0 provider.

**How authentication works on each platform:**

| Platform | Auth Flow |
|----------|-----------|
| **Creature** | Automatic—tokens injected into tool context, no user action needed |
| **ChatGPT** | OAuth redirect—user signs in at `creature.run`, token issued via OAuth |

The SDK's `getIdentity()` works identically on both platforms. Your tool code doesn't need to change.

**Setup Steps:**

1. **Publish your MCP App** to the Creature Registry (via desktop app)

2. **Enable Creature OAuth** in the Publish view's OAuth Settings section

3. **Copy credentials** — Client ID and Client Secret are shown after enabling

4. **Add the OAuth discovery endpoint** to your app:

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

5. **Add Vercel rewrite** to `vercel.json`:

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

6. **Configure in ChatGPT** — Use the Client ID, Client Secret, and your app's hosted URL

**Handling Missing Organization/Project:**

When users authenticate via ChatGPT, they only have user identity—no organization or project context. Design your app to handle this gracefully:

```typescript
const identity = await getIdentity(context.creatureToken);

// User is always present
const userId = identity.user.id;

// Organization/project may be absent (use defaults)
const orgId = identity.organization?.id || 'default';
const projectId = identity.project?.id || 'default';

// Scope data appropriately
await db.notes.insert({
  userId,
  orgId,
  projectId,
  content,
});
```

---

## Testing Both Platforms

### In Creature

1. Test both inline (via tool calls) and PIP (via sidebar)
2. Use DevConsole to inspect the AI's context and widget state
3. Test multi-instance behavior if applicable

### ChatGPT Compatibility

The SDK's `environment` detection tells you where you're running:

```tsx
const { environment, isCreature } = useHost({ ... });

console.log(environment);
// "mcp-apps"   - Running in an MCP Apps host (Creature or other)
// "chatgpt"    - Running in ChatGPT
// "standalone" - Running in browser directly (dev/test)

console.log(isCreature);
// true when `hostContext.userAgent` indicates Creature
```

Use this to:
- Conditionally enable Creature-only features
- Adjust UI for platform-specific constraints
- Log platform for debugging

---

## Development Tips

### Enabling Hot Module Reloading

By default, Creature runs your built MCP App server directly. Changes require a rebuild.

To enable live reloading during development:

1. Open a terminal in your app folder
2. Run `npm run dev`
3. Reconnect your MCP App in Creature (disconnect, then reconnect)

Now Vite watches for changes—UI updates appear instantly, and server changes trigger auto-restart. You only need to reconnect once after starting dev mode.

### DevConsole Logging

Use the SDK's logger for debugging:

```tsx
const { log } = useHost({ ... });

log("User clicked button");                    // info level (default)
log.info("Todo added", { id: todo.id });       // info level
log.debug("Verbose details", { data });        // debug level
log.warn("Deprecated feature used");           // warning level
log.error("Something failed", { error: err }); // error level
```

Logs appear in Creature's DevConsole. On ChatGPT and standalone, they fall back to `console`.

---

## Serverless Deployment

Deploy to Vercel or AWS Lambda:

```typescript
// api/mcp.ts (Vercel)
import { createTodosApp } from "../src/server/app";
import { main } from "../dist/ui/bundle.js";

// Pass bundled HTML for serverless (no file system access)
const app = createTodosApp({ html: main });

export default app.toVercelFunctionHandler();
```

Your app factory should accept bundled HTML:

```typescript
// src/server/app.ts
export const createTodosApp = (options: { html?: string } = {}) => {
  const app = createApp({ name: "my-app", version: "1.0.0" });
  
  app.resource({
    uri: "ui://my-app/main",
    // Use bundled HTML if provided, otherwise file path for local dev
    html: options.html || "../../dist/ui/main.html",
  });
  
  return app;
};
```

Enable `generateBundle: true` in Vite config to create the embedded HTML:

```typescript
// vite.config.ts
import { creature } from "@creature-ai/sdk/vite";

export default {
  plugins: [creature({ generateBundle: true })],
};
```

---

## Cross-Platform Checklist

Before publishing your MCP App, verify:

- [ ] **Display modes**: Resource declares both `["inline", "pip"]`
- [ ] **UI responsiveness**: Works in constrained inline AND larger PIP
- [ ] **Widget state**: Uses structured format (`modelContent`/`privateContent`)
- [ ] **No Creature dependencies**: WebSocket has fallbacks or graceful degradation
- [ ] **Instance handling**: Works whether instanceId is routed to existing PIP or creates new widget
- [ ] **Theme support**: CSS variables with fallbacks
- [ ] **Environment checks**: Graceful degradation for platform-specific features
- [ ] **Tool metadata**: Includes `loadingMessage`/`completedMessage` for ChatGPT UX
- [ ] **Creature OAuth**: Enabled in Publish view if targeting ChatGPT
- [ ] **OAuth discovery**: `/.well-known/oauth-authorization-server` endpoint added
- [ ] **Missing context handling**: Code handles absent `organization`/`project` gracefully

---

## Platform Compatibility Summary

| Feature | Creature | ChatGPT | SDK API |
|---------|----------|---------|---------|
| Tool calls | ✅ | ✅ | `callTool()` |
| Structured content | ✅ | ✅ | `data` in tool result |
| Widget state | ✅ | ✅ | `setWidgetState()` |
| Tool events | ✅ | ✅ | `onToolInput`, `onToolResult` |
| Environment detection | ✅ | ✅ | `environment` |
| Display mode request | ✅ | ✅ | `requestDisplayMode()` |
| Creature OAuth | ✅ | ✅ | `getIdentity()` |
| WebSocket | ✅ | ❌ | `useWebSocket()` |
| Multi-instance | ✅ | ❌ | `multiInstance: true` |
| Theme events | ✅ | ❌ | `onThemeChange` |
| Teardown events | ✅ | ❌ | `onTeardown` |
| DevConsole logging | ✅ | ❌ | `log()` |
| PIP tabs | ✅ | ❌ | — |
| Org/Project context | ✅ | ❌ | `identity.organization`, `identity.project` |

---

## Next Steps

- [**SDK Reference**](./sdk-reference.md) — Complete API documentation
- [**Concepts**](./concepts.md) — Understand the terminology
- [**MCP Apps Spec**](./mcp-apps-spec.md) — Feature support and Creature extensions
- [**ChatGPT Compatibility**](./chatgpt-apps-spec.md) — Detailed platform comparison

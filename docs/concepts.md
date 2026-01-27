# Concepts

Key terms used throughout Creature's documentation. These terms are capitalized to indicate their specific meaning within MCP Apps.

---

## Host

The **Host** is the application that runs the AI and manages MCP Servers. Creature is a Host. ChatGPT is also a Host.

Hosts are responsible for connecting to MCP Servers, providing tools to the AI, and rendering UI Resources in sandboxed iframes.

---

## Agent

The **Agent** is the AI model that processes user messages and calls Tools. When you chat with Creature, you're talking to the Agent.

The Agent receives your messages, decides which Tools to call, and can route updates to existing widgets.

---

## MCP Server

An **MCP Server** is an external process that provides Tools and optionally UI Resources to the Host. MCP Servers extend what the AI can do.

MCP Servers communicate with the Host via the Model Context Protocol. With `@creature-ai/sdk`, you can build MCP Servers that work in both Creature and ChatGPT.

→ See [Quick Start](./building-mcp-apps.md) to create your first MCP Server.

---

## Tool

A **Tool** is a function that the Agent can call to perform actions. Tools are provided by MCP Servers.

Each Tool has:
- **Name** — Unique identifier (e.g., `terminal_run`, `todo_add`)
- **Description** — What the tool does (shown to the Agent)
- **Input Schema** — What parameters it accepts
- **UI Resource** (optional) — HTML interface for displaying results

→ See [SDK Reference](./mcp-template.md#apptool) for registration options.

---

## Tool Visibility

**Tool Visibility** controls who can call each tool:

| Visibility | Agent Can Call | UI Can Call | Use Case |
|------------|----------------|-------------|----------|
| `["model", "app"]` | ✅ | ✅ | Default—full access |
| `["model"]` | ✅ | ❌ | Sensitive operations |
| `["app"]` | ❌ | ✅ | UI-only actions (refresh, toggle) |

---

## UI Resource

A **UI Resource** is HTML content served by an MCP Server that the Host renders in an iframe. UI Resources enable rich, interactive visualizations.

Each UI Resource has:
- **URI** — Identifier starting with `ui://` (e.g., `ui://my-app/dashboard`)
- **Display Modes** — Where it can be rendered (`inline`, `pip`)
- **HTML** — The content to render

When a Tool with a UI Resource is called, the Host renders that UI and sends it the tool's input and output.

→ See [SDK Reference](./mcp-template.md#appresource) for registration options.

---

## Display Mode

The **Display Mode** determines how a UI Resource appears:

| Mode | Widget Type | Description | Best For |
|------|-------------|-------------|----------|
| `inline` | Inline Widget | Embedded in the conversation | Quick confirmations, previews |
| `pip` | Pip Widget | Sidebar with tabs, persists across messages | Interactive UIs, dashboards |

If a UI Resource supports both modes, the Host chooses based on context.

---

## Pip Widget

A **Pip Widget** (Picture-in-Picture) is a UI Resource rendered in `pip` display mode. Pip Widgets appear alongside the conversation in a tabbed interface.

Pip Widgets are:
- **Persistent** — Stay open across multiple tool calls
- **Interactive** — Can call tools and receive updates
- **Reusable** — The Agent can route subsequent calls to the same widget
- **Flexible** — Can be popped out into separate windows

---

## Inline Widget

An **Inline Widget** is a UI Resource rendered in `inline` display mode. Widgets appear directly in the conversation thread.

Inline Widgets are:
- **Contextual** — Rendered where the action occurred
- **Read-only** — Display information but don't accept input
- **Expandable** — Can be expanded into a Pip Widget for full interaction

---

## Host Context

**Host Context** is environment information the Host provides to UI Resources:

| Field | Description |
|-------|-------------|
| `theme` | `"light"` or `"dark"` |
| `styles.variables` | CSS custom properties for theming |
| `platform` | `"desktop"`, `"web"`, or `"mobile"` |
| `displayMode` | Current display mode |
| `userAgent` | Host identifier in format `"<host>/<version>"` (e.g. `"creature/1.0.0"`). Use this for spec-compliant host detection. |

The SDK automatically applies theme and styles.

---

## Tool Input

**Tool Input** contains the arguments sent to the Tool before execution. The UI receives this immediately, enabling loading states.

---

## Tool Result

**Tool Result** is the data returned after tool execution:

| Field | Description |
|-------|-------------|
| `data` | Structured data for the UI to render |
| `text` | Text summary for the AI's context |
| `title` | Dynamic widget title |
| `isError` | Whether the operation failed |

→ See [SDK Reference](./mcp-template.md#tool-result) for details.

---

## Widget State

**Widget State** persists UI state across sessions. Use it for selected items, active tabs, user preferences, and form input that shouldn't be lost.

For ChatGPT compatibility, structure state as:
- `modelContent` — Data the AI can see
- `privateContent` — UI-only data

→ See [SDK Reference](./mcp-template.md#usewidgetstate) for usage.

---

## Creature Managed Auth

**Creature Managed Auth** is a host-provided authentication system that gives MCP Apps verified user identity without implementing auth flows.

When enabled (`auth: { creatureManaged: true }`), Creature automatically injects identity tokens into tool contexts via `context.creatureToken`. Your server verifies these tokens using `getIdentity()` to get user information.

| What You Get | Description |
|--------------|-------------|
| `user.id`, `user.email`, `user.name` | User identity (always present) |
| `organization.id`, `organization.name` | Organization context (if applicable) |
| `project.id`, `project.name` | Project context (if applicable) |

**Key benefit**: Users are already signed into Creature—no additional login screens or OAuth flows needed for your MCP App.

→ See [SDK Reference](./sdk-reference.md#auth--identity) for implementation.

---

## Creature OAuth

**Creature OAuth** extends Creature Managed Auth to work with ChatGPT and other OAuth-compatible hosts. When enabled, Creature acts as an OAuth 2.0 provider.

| Host | Auth Flow |
|------|-----------|
| **Creature** | Automatic—tokens injected, no user action needed |
| **ChatGPT** | OAuth redirect—user signs in at `creature.run`, token issued via standard OAuth |

The SDK's `getIdentity()` works identically on both platforms. Your tool code doesn't need to change.

**Setup**: After publishing your MCP App to the Creature Registry, enable Creature OAuth in the Publish view's OAuth Settings section. You'll receive a Client ID and Client Secret for configuring your app on ChatGPT.

**Note**: Organization and project context are only available in Creature. ChatGPT users will have user identity only—design your app to handle this gracefully.

→ See [Building MCP Apps](./building-mcp-apps.md#creature-oauth-for-chatgpt) for setup steps.

---

## Content Security Policy (CSP)

**Content Security Policy** restricts what external resources a UI can load.

- `connectDomains` — URLs the UI can fetch from
- `resourceDomains` — URLs for images, scripts, stylesheets

If no CSP is declared, the Host blocks all external connections (secure by default).

→ See [SDK Reference](./mcp-template.md#csp) for configuration.

---

## Iframe Sandbox

UI Resources run in **sandboxed iframes** with restricted permissions:

| Allowed | Blocked |
|---------|---------|
| JavaScript execution | Form submission |
| postMessage communication | Popups |
| | Top navigation |
| | Downloads |

This isolates UI Resources from the Host and from each other.

---

## Multi-Session

**Multi-Session** tools create independent widget instances on each call. Use for terminals, separate workspaces, or any tool where multiple concurrent sessions make sense.

→ See [SDK Reference](./mcp-template.md#multi-session-tools) for implementation.

---

## Channel

A **Channel** provides real-time WebSocket communication between the UI and server. Use for streaming data like terminal output or live logs.

→ See [SDK Reference](./mcp-template.md#websocket-channels-advanced) for implementation.

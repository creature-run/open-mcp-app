# Proposal: Unified Host Architecture

## ⚠️ CRITICAL: Scope & Approach

**Scope:** SDK only (`desktop/artifacts/sdk/`)

**Approach:** CLEAN CUTOVER - NO LEGACY CODE

This is an **unreleased SDK**. There are no production users to migrate. Therefore:
- **DELETE** all legacy code, patterns, and abstractions
- **NO** deprecation warnings or backwards compatibility layers
- **NO** supporting "old and new" paths simultaneously
- **REMOVE** as much code as possible while maintaining functionality
- **SIMPLIFY** ruthlessly - every line must justify its existence

Leaving legacy code in an unreleased SDK is dangerous - it creates technical debt before we even ship.

---

## Problem Statement

The current SDK has a two-layer architecture (BaseHostClient + Adapter) that adds complexity without proportional benefit:

1. **Unnecessary abstraction** - Adapters mostly delegate to base clients
2. **Host-specific leakage** - `isCreature`, `adapterKind`, `CreatureAdapter` expose implementation details
3. **Confusing mental model** - Developers must understand BaseHostClient vs Adapter vs UpgradingMcpAppsClient

The SDK should provide **one unified API** that works identically across ChatGPT, Claude, Creature, and any future MCP Apps host.

## Design Principles

1. **Write once, run everywhere** - No host-specific branching in app code
2. **Graceful degradation** - Non-standard features are no-ops on unsupported hosts
3. **Single abstraction layer** - One class per environment, not two
4. **`exp` namespace** - Clear separation of spec-compliant vs non-standard APIs

---

## Proposed Architecture

### Single-Layer Host Clients

```
UnifiedHostClient (interface)
├── McpAppsHostClient    → iframe postMessage (Creature, Claude, any MCP Apps host)
├── ChatGptHostClient    → window.openai bridge  
└── StandaloneHostClient → no-op for dev/testing
```

**Remove:**
- `BaseHostClient` / `Adapter` two-layer split
- `CreatureAdapter`, `UpgradingMcpAppsClient`
- `isCreature`, `adapterKind` properties
- `KNOWN_HOSTS` constants
- `parseHostUserAgent`, `getHostIdentity`, `isHost` exports

### Unified API

```typescript
interface UnifiedHostClient {
  // ============================================================================
  // Standard API (spec-compliant, works everywhere)
  // ============================================================================
  
  /** Get current state (isReady, environment, widgetState) */
  getState(): HostClientState;
  
  /** Subscribe to state changes */
  subscribe(listener: StateListener): () => void;
  
  /** Get host context (theme, styles, viewport, etc.) */
  getHostContext(): HostContext | null;
  
  /** Call a tool on the MCP server */
  callTool<T>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;
  
  /** Request a display mode change */
  requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }>;
  
  /** Send a log message to host DevConsole (console fallback on ChatGPT) */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void;
  
  /** Subscribe to events */
  on<K extends keyof HostClientEvents>(event: K, handler: HostClientEvents[K]): () => void;
  
  /** Start/stop listening for host messages */
  connect(): void;
  disconnect(): void;
  
  /** The detected environment */
  readonly environment: Environment;
  
  // ============================================================================
  // Experimental API (non-standard, graceful degradation)
  // ============================================================================
  
  readonly exp: ExpHostApi;
}
```

### Experimental API (`exp`)

Features that some hosts support and others don't. Apps call these without checking which host they're on - unsupported features are no-ops or return null.

**Note on MCP Apps Spec Compliance:** The MCP Apps spec (`SEP-1865`) defines the standard protocol. Features marked below as "non-standard" are host-specific extensions that work on some hosts but not others.

```typescript
interface ExpHostApi {
  /**
   * Set widget state and notify the host.
   * 
   * **Non-standard:** Widget state persistence is NOT in the MCP Apps spec.
   * - ChatGPT: Native support via `window.openai.setWidgetState`
   * - Creature: Extension via `ui/notifications/widget-state-changed`
   * - Generic MCP Apps hosts: No-op (may not support)
   * - Standalone: Stores locally
   */
  setWidgetState(state: WidgetState | null): void;
  
  /**
   * Set the pip/widget title displayed in the host UI.
   * 
   * **Non-standard:** Not in MCP Apps spec.
   * - Creature: Supported via `ui/notifications/title-changed`
   * - All others: No-op
   */
  setTitle(title: string): void;
  
  /**
   * Update the model context for future turns.
   * 
   * **In MCP Apps spec** as `ui/update-model-context`.
   * Context is available to the model in future turns without triggering immediate response.
   * Each call overwrites previous context.
   * 
   * - MCP Apps hosts: Supported (if host declares `updateModelContext` capability)
   * - ChatGPT: No-op
   */
  updateModelContext(content: ContentBlock[]): Promise<void>;
  
  /**
   * Send a raw notification to the host.
   * 
   * Low-level API for power users. Most apps should use higher-level methods.
   * MCP Apps only - no-op on ChatGPT.
   */
  sendNotification(method: string, params: unknown): void;
  
  /**
   * Get Creature-specific extended style variables.
   * 
   * **Non-standard:** Returns Creature's extended CSS variables beyond the spec.
   * Standard styles are available via `getHostContext().styles.variables`.
   * 
   * Returns null when not running in Creature.
   */
  getCreatureStyles(): Record<string, string | undefined> | null;
  
  /**
   * Get the instance ID for this widget.
   * 
   * **Non-standard:** Multi-instance support is a Creature extension.
   * - Creature: Full support for multiple instances with independent state
   * - ChatGPT: Maps to `openai/widgetSessionId`, singleton behavior
   * - Generic MCP Apps hosts: May not support, returns null
   * 
   * Used on client-side to identify which instance this UI belongs to.
   * The instanceId is received from tool results via `structuredContent.instanceId`.
   */
  getInstanceId(): string | null;
  
  /**
   * Check if the host supports multi-instance resources.
   * 
   * **Non-standard:** Multi-instance is a Creature extension.
   * - Creature: true
   * - ChatGPT: false (singleton only)
   * - Generic MCP Apps hosts: false (unless they implement it)
   */
  supportsMultiInstance(): boolean;
}
```

### Events

Consolidate base and MCP-specific events into one set:

```typescript
interface HostClientEvents {
  /** Tool input received (before execution) */
  "tool-input": (args: Record<string, unknown>) => void;
  
  /** Tool result received */
  "tool-result": (result: ToolResult) => void;
  
  /** Widget state changed (restored or updated) */
  "widget-state-change": (widgetState: WidgetState | null) => void;
  
  /** Theme changed - MCP Apps only, no-op subscription on ChatGPT */
  "theme-change": (theme: "light" | "dark") => void;
  
  /** Host requests teardown - MCP Apps only, no-op subscription on ChatGPT */
  "teardown": () => Promise<void> | void;
}
```

---

## Multi-Instance & WebSocket System (Experimental)

The SDK supports multiple independent widget instances, each with their own state, WebSockets, and lifecycle. This is essential for scenarios where the same app can be invoked multiple times with different data.

**IMPORTANT:** Neither multi-instance nor WebSockets are in the MCP Apps spec. Both MUST be namespaced under `exp` on both client and server to make it clear these are host-specific extensions.

**Host Support:**
- **Creature:** Full multi-instance + WebSocket support
- **ChatGPT:** Singleton only (uses `openai/widgetSessionId` internally), no WebSockets
- **Generic MCP Apps:** May not support either (graceful degradation)

### Server-Side: Resource Configuration (`exp`)

```typescript
// Register a multi-instance resource with WebSocket
app.resource("ui://my-app/dashboard", {
  name: "Dashboard",
  mimeType: "text/html;profile=mcp-app",
  getContent: () => html,
  
  // Non-standard features go in exp namespace
  exp: {
    multiInstance: true,  // Each tool call creates a new instance
    websocket: true,      // Enable real-time communication
  },
});
```

### Server-Side: Tool Context (`exp`)

Tool handlers access instance features via `ctx.exp`:

```typescript
app.tool("create_chart", {
  description: "Create a chart",
  ui: "ui://my-app/dashboard",
  input: z.object({ data: z.array(z.number()) }),
  handler: async (input, ctx) => {
    // Standard context (always available)
    // ctx.toolName, ctx.args, etc.
    
    // Exp context (may be unavailable on some hosts)
    const { exp } = ctx;
    
    // exp.instanceId - unique ID for this widget instance
    // exp.getState() / setState() - per-instance server-side state  
    // exp.send() - send WebSocket message to this instance's UI
    // exp.websocketUrl - URL for UI to connect
    
    exp.setState({ chartData: input.data });
    
    return {
      content: [{ type: "text", text: "Chart created" }],
      structuredContent: { chartType: "bar", data: input.data },
      // instanceId is automatically attached by SDK when supported
    };
  },
});
```

### Server-Side: Instance Lifecycle (`exp`)

```typescript
// All instance management is under app.exp
const { exp } = app;

// Create instance manually (advanced)
const { instanceId, websocketUrl } = exp.createInstance({ websocket: true });

// Check if instance exists
exp.hasInstance(instanceId);

// Get/set instance state
exp.getInstanceState<MyState>(instanceId);
exp.setInstanceState(instanceId, newState);

// Destroy instance and clean up resources
exp.destroyInstance(instanceId);

// Register cleanup callback
exp.onInstanceDestroy((ctx) => {
  console.log(`Instance ${ctx.instanceId} destroyed, last state:`, ctx.state);
});

// Check host capabilities
if (exp.hostSupportsMultiInstance()) {
  // Host supports multi-instance
}
if (exp.hostSupportsWebSocket()) {
  // Host supports WebSocket
}
```

### Client-Side: React Experience

The UI receives `instanceId` via the `useHost` hook and can use it for WebSocket routing and subsequent tool calls:

```tsx
function ChartWidget() {
  const { 
    toolResult,
    exp,
    callTool,
    isConnected 
  } = useHost<ChartData>();
  
  // Get instance ID from exp API
  const instanceId = exp.getInstanceId();
  
  // Connect to instance-specific WebSocket for real-time updates
  const { messages, send } = useWebSocket<ServerMessage, ClientMessage>({
    // WebSocket URL includes instanceId for routing
    url: toolResult?.data?.websocketUrl,
    enabled: isConnected && !!instanceId,
  });
  
  // Update chart when server sends new data
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (latest.type === "data-update") {
        setChartData(latest.data);
      }
    }
  }, [messages]);
  
  // Call tool targeting THIS instance
  const handleRefresh = async () => {
    await callTool("refresh_chart", { 
      instanceId,  // Target the same widget instance
      options: { animate: true }
    });
  };
  
  return (
    <div>
      <Chart data={chartData} />
      <button onClick={handleRefresh}>Refresh</button>
      {exp.supportsMultiInstance() && (
        <span>Instance: {instanceId}</span>
      )}
    </div>
  );
}
```

Key points:
- `exp.getInstanceId()` returns the instance ID (or `null` if not supported)
- `exp.supportsMultiInstance()` checks host capability
- `instanceId` is passed to subsequent tool calls to target the same widget
- WebSocket URL is instance-specific for real-time updates

### Singleton vs Multi-Instance Behavior

| Mode | Behavior | Use Case |
|------|----------|----------|
| Singleton (default) | Same `instanceId` for all calls to same `resourceUri` | Single dashboard, settings panel |
| Multi-instance | New `instanceId` each call (unless provided in input) | Multiple charts, multiple editors |

---

## Implementation Plan

**Approach:** Single PR, clean cutover. Delete first, then build the minimal new structure.

### Step 1: Delete Legacy Code

```bash
# Delete entire adapter layer
rm -rf core/providers/creature/
rm -rf core/providers/mcp-apps/UpgradingMcpAppsClient.ts
rm core/base/hostIdentity.ts

# Delete from exports
# Remove: isCreature, adapterKind, CreatureAdapter, McpAppsAdapter
# Remove: parseHostUserAgent, getHostIdentity, isHost, KNOWN_HOSTS
```

### Step 2: Restructure Client-Side

**New structure (minimal):**
```
core/
├── index.ts              # createHost(), exports only
├── types.ts              # All types consolidated
├── clients/
│   ├── McpAppsHostClient.ts   # MCP Apps (single class)
│   ├── ChatGptHostClient.ts   # ChatGPT
│   └── StandaloneHostClient.ts
├── styles.ts
├── websocket.ts
└── subscribable.ts
```

Each client implements `UnifiedHostClient` directly. No intermediate layers.

### Step 3: Refactor Server-Side to `exp`

Move non-standard features under `exp` namespace, delete old paths:

```typescript
// types.ts
interface ResourceConfig {
  // standard...
  exp?: { multiInstance?: boolean; websocket?: boolean; }
}

interface ToolContext {
  // standard...
  exp: ExpToolContext;
}

// app.ts
class App {
  exp: ExpAppApi;  // All instance/websocket methods here
}
```

### Step 4: Update React

```typescript
interface UseHostReturn {
  isReady: boolean;
  environment: Environment;
  widgetState: WidgetState | null;
  callTool: <T>(name: string, args: Record<string, unknown>) => ToolCallTuple<T>;
  requestDisplayMode: (params: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;
  log: Logger;
  hostContext: HostContext | null;
  exp: ExpHostApi;
  exp_widgetState: <T extends WidgetState>() => [T | null, (s: T | null) => void];
  onToolResult: (callback: (result: ToolResult) => void) => () => void;
  // NO isCreature, NO adapterKind
}
```

### Step 5: Update Template Apps

Update `template-todos` and any other templates to use new API.

---

## Files Affected (SDK Only)

**Target directory:** `desktop/artifacts/sdk/`

### DELETE (Remove Entirely)
```
core/providers/creature/CreatureAdapter.ts      # Adapter layer - gone
core/providers/mcp-apps/UpgradingMcpAppsClient.ts  # Complexity - gone
core/base/hostIdentity.ts                       # Host detection exports - gone
core/providers/                                 # Entire folder restructure
core/base/                                      # Merge into clients
```

### REWRITE (Server-Side → `exp` Namespace)
Move non-standard features under `exp`, delete old API paths:

```typescript
// server/types.ts - New API only
{ exp: { multiInstance, websocket } }           // Old: { multiInstance, websocket }

// server/app.ts - New API only
app.exp.createInstance()                        // Old: app.createInstance()
app.exp.destroyInstance()                       // Old: app.destroyInstance()

// Tool context - New API only  
ctx.exp.instanceId                              // Old: ctx.instanceId
ctx.exp.getState()                              // Old: ctx.getState()
ctx.exp.send()                                  // Old: ctx.send()
```

### SIMPLIFY (Client-Side)
**New structure:**
```
core/
├── index.ts                  # createHost(), exports
├── types.ts                  # All types (consolidated)
├── clients/
│   ├── McpAppsHostClient.ts  # MCP Apps (Creature, Claude, etc.)
│   ├── ChatGptHostClient.ts  # ChatGPT
│   └── StandaloneHostClient.ts
├── styles.ts
├── websocket.ts
└── subscribable.ts
```

**Delete from public API:**
- `isCreature`, `adapterKind`
- `CreatureAdapter`, `McpAppsAdapter`, `UpgradingMcpAppsClient`
- `parseHostUserAgent`, `getHostIdentity`, `isHost`, `KNOWN_HOSTS`
- All adapter-related types

### UPDATE (React)
- `react/useHost.ts` - Remove `isCreature`, `adapterKind`, rename `experimental` → `exp`
- `react/types.ts` - Remove adapter types, simplify `UseHostReturn`

---

## Estimated Impact

**Goal:** Maximize code deletion while maintaining functionality.

| Metric | Estimate |
|--------|----------|
| Lines deleted | ~500-700 |
| Lines added | ~50-100 |
| **Net reduction** | **~400-600 lines** |
| Files deleted | 5-8 |
| Concepts removed | BaseHostClient, Adapter, UpgradingClient, hostIdentity |

**This is a clean cutover. There is no "breaking" vs "non-breaking" - we're shipping a new API.**

### New API Surface (Complete)

**Client-Side:**
```typescript
createHost(config)              // Factory
host.getState()                 // State
host.getHostContext()           // Host context
host.callTool(name, args)       // Tool calls
host.requestDisplayMode(mode)   // Display mode
host.log(level, msg)            // Logging
host.on(event, handler)         // Events
host.exp.*                      // Non-standard features
```

**Server-Side:**
```typescript
app.resource(uri, config)       // Register resource
app.tool(name, config)          // Register tool
app.exp.*                       // Non-standard (instances, websockets)
ctx.exp.*                       // Tool context non-standard features
```

---

## Open Questions

1. **Keep `getCreatureStyles()` name?**
   - Standard styles are already in `getHostContext().styles.variables` (per MCP Apps spec)
   - Creature's extended styles are non-standard additions
   - Recommendation: Keep `getCreatureStyles()` since it's specifically for Creature's extensions

2. **Should we add `exp.supportsFeature(feature: string): boolean`?**
   - Allows apps to check capability without knowing host identity
   - e.g., `host.exp.supportsFeature("setTitle")`
   - Tradeoff: adds API surface, may encourage feature-checking anti-pattern
   - Alternative: Apps can check `getHostContext().availableDisplayModes` etc. for spec-defined capabilities

3. **What about `hostContext.userAgent`?**
   - This IS in the MCP Apps spec: `hostContext.userAgent` identifies the host
   - Keep it exposed - it's the spec-compliant way for apps to identify hosts if needed
   - The point is apps shouldn't NEED to check it for normal usage

4. ~~**Server-side migration strategy?**~~ **RESOLVED: Clean cutover**
   - SDK is unreleased - no migration needed
   - Just implement the new API, delete all old code

---

## Testing Strategy

Testing host behavior is complex because hosts are external systems with different communication mechanisms. However, a minimal testing suite can verify that the SDK:

1. Sends the correct messages for each operation
2. Handles responses correctly
3. Gracefully degrades experimental features on unsupported hosts

### Approach: Mock Host Adapters

Create mock implementations of host communication layers that can be injected during tests.

```typescript
// test/mocks/MockMcpAppsHost.ts
/**
 * Simulates an MCP Apps host (Creature, Claude, etc.)
 * Intercepts postMessage and responds with configurable behavior.
 */
export class MockMcpAppsHost {
  private messageLog: Array<{ method: string; params: unknown }> = [];
  private responseHandlers = new Map<string, (params: unknown) => unknown>();
  
  constructor(private options: {
    hostInfo?: { name: string; version: string };
    hostContext?: Partial<HostContext>;
    capabilities?: Partial<HostCapabilities>;
    supportsMultiInstance?: boolean;
    supportsWebSocket?: boolean;
  } = {}) {}
  
  /** Attach to window to intercept postMessage */
  attach(): () => void {
    const handler = (event: MessageEvent) => {
      if (event.data?.jsonrpc === "2.0") {
        this.handleMessage(event.data);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }
  
  /** Get all messages sent by SDK */
  getMessages(): Array<{ method: string; params: unknown }> {
    return [...this.messageLog];
  }
  
  /** Assert a specific message was sent */
  assertMessageSent(method: string, paramsMatcher?: (p: unknown) => boolean): void {
    const found = this.messageLog.find(m => 
      m.method === method && (!paramsMatcher || paramsMatcher(m.params))
    );
    if (!found) throw new Error(`Expected message "${method}" not sent`);
  }
  
  /** Configure response for a method */
  onMethod(method: string, handler: (params: unknown) => unknown): void {
    this.responseHandlers.set(method, handler);
  }
  
  /** Send a notification to the SDK (simulate host → app) */
  sendNotification(method: string, params: unknown): void {
    window.postMessage({ jsonrpc: "2.0", method, params }, "*");
  }
  
  private handleMessage(msg: { id?: number; method: string; params: unknown }) {
    this.messageLog.push({ method: msg.method, params: msg.params });
    
    // Auto-respond to initialize
    if (msg.method === "ui/initialize" && msg.id) {
      window.postMessage({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2026-01-26",
          hostInfo: this.options.hostInfo ?? { name: "MockHost", version: "1.0.0" },
          hostCapabilities: this.options.capabilities ?? {},
          hostContext: {
            theme: "light",
            userAgent: this.options.supportsMultiInstance ? "Creature/1.0" : "GenericMcpHost/1.0",
            ...this.options.hostContext,
          },
        },
      }, "*");
      return;
    }
    
    // Use custom handler if registered
    const handler = this.responseHandlers.get(msg.method);
    if (handler && msg.id) {
      window.postMessage({
        jsonrpc: "2.0",
        id: msg.id,
        result: handler(msg.params),
      }, "*");
    }
  }
}
```

```typescript
// test/mocks/MockChatGptHost.ts
/**
 * Simulates ChatGPT host via window.openai bridge.
 */
export class MockChatGptHost {
  private callLog: Array<{ method: string; args: unknown[] }> = [];
  
  constructor(private options: {
    widgetState?: unknown;
    theme?: "light" | "dark";
  } = {}) {}
  
  /** Attach mock to window.openai */
  attach(): () => void {
    const mockOpenai = {
      onWidgetStateChange: (callback: (state: unknown) => void) => {
        // Simulate initial state
        if (this.options.widgetState) {
          setTimeout(() => callback(this.options.widgetState), 0);
        }
      },
      setWidgetState: (state: unknown) => {
        this.callLog.push({ method: "setWidgetState", args: [state] });
      },
      callTool: async (name: string, args: unknown) => {
        this.callLog.push({ method: "callTool", args: [name, args] });
        return { content: [{ type: "text", text: "mock result" }] };
      },
      // ... other methods
    };
    
    (window as any).openai = mockOpenai;
    return () => delete (window as any).openai;
  }
  
  getCalls(): Array<{ method: string; args: unknown[] }> {
    return [...this.callLog];
  }
  
  assertCalled(method: string): void {
    if (!this.callLog.find(c => c.method === method)) {
      throw new Error(`Expected "${method}" to be called`);
    }
  }
}
```

### Test Structure

```typescript
// test/client/host-clients.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHost } from "../../src/core";
import { MockMcpAppsHost } from "../mocks/MockMcpAppsHost";
import { MockChatGptHost } from "../mocks/MockChatGptHost";

describe("UnifiedHostClient", () => {
  describe("MCP Apps Host", () => {
    let mockHost: MockMcpAppsHost;
    let cleanup: () => void;
    
    beforeEach(() => {
      mockHost = new MockMcpAppsHost({
        hostContext: { theme: "dark" },
        supportsMultiInstance: true,
      });
      cleanup = mockHost.attach();
    });
    
    afterEach(() => cleanup());
    
    it("sends ui/initialize on connect", async () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      
      await vi.waitFor(() => {
        mockHost.assertMessageSent("ui/initialize");
      });
    });
    
    it("calls tools via tools/call", async () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      
      mockHost.onMethod("tools/call", (params) => ({
        content: [{ type: "text", text: "Hello" }],
        structuredContent: { greeting: "Hello" },
      }));
      
      const result = await host.callTool("greet", { name: "World" });
      
      mockHost.assertMessageSent("tools/call", (p: any) => p.name === "greet");
      expect(result.structuredContent?.greeting).toBe("Hello");
    });
    
    it("exp.setTitle sends notification on Creature", async () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      await vi.waitFor(() => host.getState().isReady);
      
      host.exp.setTitle("My Widget");
      
      mockHost.assertMessageSent("ui/notifications/title-changed");
    });
    
    it("exp.setTitle is no-op on generic MCP Apps host", async () => {
      cleanup();
      mockHost = new MockMcpAppsHost({ supportsMultiInstance: false });
      cleanup = mockHost.attach();
      
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      await vi.waitFor(() => host.getState().isReady);
      
      host.exp.setTitle("My Widget");  // Should not throw
      
      // Should NOT have sent the notification
      expect(mockHost.getMessages().find(m => m.method === "ui/notifications/title-changed")).toBeUndefined();
    });
  });
  
  describe("ChatGPT Host", () => {
    let mockHost: MockChatGptHost;
    let cleanup: () => void;
    
    beforeEach(() => {
      mockHost = new MockChatGptHost({ widgetState: { count: 5 } });
      cleanup = mockHost.attach();
    });
    
    afterEach(() => cleanup());
    
    it("detects ChatGPT environment", () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      expect(host.environment).toBe("chatgpt");
    });
    
    it("calls tools via window.openai.callTool", async () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      
      await host.callTool("greet", { name: "World" });
      
      mockHost.assertCalled("callTool");
    });
    
    it("exp.setWidgetState calls window.openai.setWidgetState", async () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      
      host.exp.setWidgetState({ count: 10 });
      
      mockHost.assertCalled("setWidgetState");
    });
  });
  
  describe("Standalone (no host)", () => {
    it("detects standalone environment", () => {
      // No mock attached - should fall back to standalone
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      expect(host.environment).toBe("standalone");
    });
    
    it("exp methods are no-ops", () => {
      const host = createHost({ name: "TestApp", version: "1.0.0" });
      host.connect();
      
      // Should not throw
      host.exp.setTitle("Test");
      host.exp.setWidgetState({ foo: "bar" });
    });
  });
});
```

### Server-Side Testing

```typescript
// test/server/app.test.ts
import { describe, it, expect } from "vitest";
import { App } from "../../src/server/app";
import { z } from "zod";

describe("App (Server)", () => {
  it("registers tools with exp config", () => {
    const app = new App({ name: "TestServer", version: "1.0.0" });
    
    app.resource("ui://test/widget", {
      name: "Test Widget",
      mimeType: "text/html;profile=mcp-app",
      getContent: () => "<html></html>",
      exp: { multiInstance: true, websocket: true },
    });
    
    app.tool("create_widget", {
      description: "Create a widget",
      ui: "ui://test/widget",
      input: z.object({ title: z.string() }),
      handler: async (input, ctx) => {
        expect(ctx.exp.instanceId).toBeDefined();
        ctx.exp.setState({ title: input.title });
        return { content: [{ type: "text", text: "Created" }] };
      },
    });
    
    // Test tool execution
    // ...
  });
  
  it("exp.instanceId is undefined when multiInstance not enabled", async () => {
    const app = new App({ name: "TestServer", version: "1.0.0" });
    
    app.resource("ui://test/singleton", {
      name: "Singleton",
      mimeType: "text/html;profile=mcp-app",
      getContent: () => "<html></html>",
      // No exp config
    });
    
    let capturedCtx: any;
    app.tool("test", {
      description: "Test",
      ui: "ui://test/singleton",
      input: z.object({}),
      handler: async (_, ctx) => {
        capturedCtx = ctx;
        return { content: [] };
      },
    });
    
    // Execute tool and verify ctx.exp behavior
    // ...
  });
});
```

### Minimal Test Coverage Goals

| Area | Tests | Priority |
|------|-------|----------|
| Environment detection | Detects MCP Apps, ChatGPT, Standalone | P0 |
| Tool calls | Sends correct format per host | P0 |
| `exp` graceful degradation | No-ops on unsupported hosts | P0 |
| Events | `tool-input`, `tool-result`, `theme-change` | P1 |
| Server `exp` namespace | `instanceId`, `getState`, `setState` | P1 |
| WebSocket routing | Per-instance WebSocket (Creature only) | P2 |

### Running Tests

```bash
# Run all SDK tests
cd desktop/artifacts/sdk
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- test/client/host-clients.test.ts
```

---

## Spec Compatibility Notes

After reviewing the MCP Apps specification (`SEP-1865`) and official SDK:

**Fully Spec-Compliant:**
- `callTool()` → `tools/call`
- `requestDisplayMode()` → `ui/request-display-mode`
- `log()` → `notifications/message`
- `getHostContext()` → `McpUiInitializeResult.hostContext`
- All event subscriptions (`tool-input`, `tool-result`, `teardown`, `theme-change`)

**Host Extensions (must be in `exp`):**

*Client-side:*
- `setWidgetState` - ChatGPT native, Creature extension, not in MCP Apps spec
- `setTitle` - Creature only, not in MCP Apps spec
- `getCreatureStyles` - Creature only, not in MCP Apps spec
- `getInstanceId` / `supportsMultiInstance` - Creature multi-instance, not in spec

*Server-side:*
- `multiInstance` resource option - Creature only, not in MCP Apps spec
- `websocket` resource option - Creature only, NOT in MCP Apps spec
- Instance lifecycle (`createInstance`, `destroyInstance`, etc.) - Creature only
- Per-instance state (`getState`, `setState`) - Creature only
- WebSocket methods (`send`, `onMessage`, `websocketUrl`) - Creature only

**Spec-Compliant but in `exp`:**
- `updateModelContext` - IS in MCP Apps spec as `ui/update-model-context`, but placed in `exp` because ChatGPT doesn't support it

**No Blocking Issues:** The proposed architecture is compatible with the MCP Apps specification.

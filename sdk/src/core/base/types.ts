/**
 * Base Host Client Types
 *
 * These types define the spec-compliant interface for MCP Apps and ChatGPT Apps.
 * Host-specific extensions are defined in their respective adapter modules.
 */

// ============================================================================
// Environment & Logging
// ============================================================================

/**
 * Environment types for host detection.
 */
export type Environment = "chatgpt" | "mcp-apps" | "standalone";

/**
 * Display modes for UI resources.
 * - "inline": Embedded within the conversation flow
 * - "pip": Picture-in-picture floating panel
 * - "fullscreen": Full-screen overlay
 */
export type DisplayMode = "inline" | "pip" | "fullscreen";

/**
 * Log severity levels matching MCP protocol LoggingLevel.
 * These are displayed in the host's DevConsole with appropriate colors.
 */
export type LogLevel = "debug" | "info" | "notice" | "warning" | "error";

// ============================================================================
// Widget State
// ============================================================================

/**
 * Structured widget state format (ChatGPT-compatible).
 * Allows separating model-visible content from private UI state.
 */
export interface StructuredWidgetState {
  /** Content visible to the AI model on follow-up turns */
  modelContent?: string | Record<string, unknown> | null;
  /** UI-only state, hidden from model */
  privateContent?: Record<string, unknown> | null;
  /** File IDs for images the model can see */
  imageIds?: string[];
}

/**
 * Widget state can be structured (with modelContent/privateContent)
 * or a simple key-value object.
 */
export type WidgetState = StructuredWidgetState | Record<string, unknown>;

// ============================================================================
// Tool Results
// ============================================================================

/**
 * Tool call result structure.
 */
export interface ToolResult<T = Record<string, unknown>> {
  content?: Array<{ type: string; text: string }>;
  structuredContent?: T;
  isError?: boolean;
  source?: "agent" | "ui";
}

// ============================================================================
// Host Context
// ============================================================================

/**
 * Host context sent from MCP Apps host.
 * Follows MCP Apps spec with extensions via [key: string]: unknown.
 */
export interface HostContext {
  theme?: "light" | "dark";
  styles?: {
    variables?: Record<string, string>;
  };
  displayMode?: DisplayMode;
  availableDisplayModes?: DisplayMode[];
  viewport?: { width: number; height: number };
  platform?: string;
  /**
   * Host application identifier per MCP Apps spec.
   * Format: "<host>/<version>" (e.g. "creature/1.0.0", "chatgpt/2.0.0").
   * Use this for spec-compliant host detection after ui/initialize.
   */
  userAgent?: string;
  /**
   * Widget state restored from previous widget instance.
   * Supported on both MCP Apps and ChatGPT.
   */
  widgetState?: WidgetState;
  /**
   * Allow additional host-specific properties.
   */
  [key: string]: unknown;
}

// ============================================================================
// Base Host Client
// ============================================================================

/**
 * Configuration for creating a host client.
 */
export interface HostClientConfig {
  /** Name of the client (for protocol handshake) */
  name: string;
  /** Version of the client */
  version: string;
}

/**
 * State managed by the host client.
 */
export interface HostClientState {
  /** Whether the host connection is ready */
  isReady: boolean;
  /** The detected environment */
  environment: Environment;
  /** Current widget state */
  widgetState: WidgetState | null;
}

/**
 * Base event handlers supported by all host clients.
 * These are spec-compliant events that work across platforms.
 */
export interface BaseHostClientEvents {
  /** Called when tool input is received (before execution) */
  "tool-input": (args: Record<string, unknown>) => void;
  /** Called when tool result is received */
  "tool-result": (result: ToolResult) => void;
  /** Called when widget state changes (restored or updated) */
  "widget-state-change": (widgetState: WidgetState | null) => void;
}

/**
 * Extended event handlers for MCP Apps hosts.
 * These are MCP-specific events not available on ChatGPT.
 */
export interface McpAppsHostClientEvents extends BaseHostClientEvents {
  /** Called when theme changes (MCP Apps only) */
  "theme-change": (theme: "light" | "dark") => void;
  /** Called when host requests teardown (MCP Apps only) */
  teardown: () => Promise<void> | void;
}

/**
 * Listener for state changes.
 */
export type StateListener = (state: HostClientState, prevState: HostClientState) => void;

/**
 * Base host client interface.
 * Contains only spec-compliant methods that work across all platforms.
 */
export interface BaseHostClient {
  /** Get current state */
  getState(): HostClientState;

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: StateListener): () => void;

  /** Call a tool on the MCP server */
  callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>>;

  /** Set widget state */
  setWidgetState(state: WidgetState | null): void;

  /**
   * Request a display mode change from the host.
   *
   * The host may refuse or coerce the request (e.g., "pip" → "fullscreen" on mobile).
   * Always check `availableDisplayModes` in host context before calling, and handle
   * the returned mode differing from the requested mode.
   */
  requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }>;

  /**
   * Send a log message.
   *
   * On MCP Apps hosts, logs are sent via the MCP protocol's `notifications/message`
   * and displayed in the host's unified log viewer alongside server logs.
   * On ChatGPT, logs go to browser console only.
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void;

  /** Register an event handler. Returns unsubscribe function. */
  on<K extends keyof BaseHostClientEvents>(
    event: K,
    handler: BaseHostClientEvents[K]
  ): () => void;

  /** Start listening for host messages */
  connect(): void;

  /** Stop listening for host messages */
  disconnect(): void;
}

// ============================================================================
// WebSocket (optional, Creature-specific)
// ============================================================================

/**
 * WebSocket connection status.
 */
export type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";

/**
 * Configuration for creating a WebSocket client.
 */
export interface WebSocketClientConfig<TReceive = unknown> {
  /** Called when a message is received */
  onMessage?: (message: TReceive) => void;
  /** Called when connection status changes */
  onStatusChange?: (status: WebSocketStatus, error?: string) => void;
  /** Whether to auto-reconnect on disconnect (default: true) */
  reconnect?: boolean;
  /** Base interval for reconnection attempts in ms (default: 1000) */
  reconnectInterval?: number;
}

/**
 * WebSocket client interface.
 */
export interface WebSocketClient<TSend = unknown, TReceive = unknown> {
  /** Current connection status */
  readonly status: WebSocketStatus;
  /** Error message if status is "error" */
  readonly error: string | undefined;
  /** Connect to the WebSocket server */
  connect(): void;
  /** Disconnect from the WebSocket server */
  disconnect(): void;
  /** Send a message to the server */
  send(message: TSend): void;
}

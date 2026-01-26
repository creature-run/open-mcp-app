/**
 * Core types for the MCP SDK.
 * These are framework-agnostic and shared between vanilla JS and React.
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
 * Follows MCP Apps spec with Creature extensions via [key: string]: unknown.
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
   * Widget state restored from previous widget instance.
   * Creature extension - passed via hostContext on ui/initialize.
   */
  widgetState?: WidgetState;
}

// ============================================================================
// Host Client
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
 * Event handlers that can be registered on the host client.
 */
export interface HostClientEvents {
  /** Called when tool input is received (before execution) */
  "tool-input": (args: Record<string, unknown>) => void;
  /** Called when tool result is received */
  "tool-result": (result: ToolResult) => void;
  /** Called when theme changes (MCP Apps only) */
  "theme-change": (theme: "light" | "dark") => void;
  /** Called when host requests teardown (MCP Apps only) */
  teardown: () => Promise<void> | void;
  /** Called when widget state changes (restored or updated) */
  "widget-state-change": (widgetState: WidgetState | null) => void;
}

/**
 * Listener for state changes.
 */
export type StateListener = (state: HostClientState, prevState: HostClientState) => void;

/**
 * Host client interface.
 * Implemented by McpAppHostClient and ChatGptAppHostClient.
 */
export interface HostClient {
  /** Get current state */
  getState(): HostClientState;

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: StateListener): () => void;

  /** Call a tool on the MCP server */
  callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>>;

  /** Send a notification to the host (MCP Apps only, no-op on ChatGPT) */
  sendNotification(method: string, params: unknown): void;

  /** Set widget state */
  setWidgetState(state: WidgetState | null): void;

  /**
   * Set the pip/widget title displayed in the host UI.
   *
   * Sends a notification to the host to update the title. This is useful
   * for updating the title based on user actions (e.g., switching tabs)
   * without making a tool call.
   *
   * Note: Creature-specific extension, no-op on ChatGPT Apps.
   *
   * @param title - The new title to display
   */
  setTitle(title: string): void;

  /**
   * Request a display mode change from the host.
   *
   * The host may refuse or coerce the request (e.g., "pip" → "fullscreen" on mobile).
   * Always check `availableDisplayModes` in host context before calling, and handle
   * the returned mode differing from the requested mode.
   *
   * @param params - Object containing the requested display mode
   * @returns Promise resolving to the actual display mode granted by the host
   */
  requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }>;

  /**
   * Send a log message to the host's DevConsole.
   *
   * Logs are sent via the MCP protocol's `notifications/message` notification
   * and displayed in the host's unified log viewer alongside server logs.
   *
   * @param level - Log severity level
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void;

  /** Register an event handler. Returns unsubscribe function. */
  on<K extends keyof HostClientEvents>(
    event: K,
    handler: HostClientEvents[K]
  ): () => void;

  /** Start listening for host messages */
  connect(): void;

  /** Stop listening for host messages */
  disconnect(): void;
}

// ============================================================================
// WebSocket
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

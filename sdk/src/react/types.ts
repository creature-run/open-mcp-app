import type {
  DisplayMode,
  Environment,
  LogLevel,
  ToolResult,
  WidgetState,
  HostContext,
  WebSocketStatus,
} from "../core/types.js";
import type { AdapterKind } from "../core/providers/types.js";

export type { DisplayMode, Environment, LogLevel, ToolResult, WidgetState, HostContext, WebSocketStatus, AdapterKind };

export { type StructuredWidgetState } from "../core/types.js";

// ============================================================================
// useHost
// ============================================================================

export interface UseHostConfig {
  name: string;
  version: string;
  onToolInput?: (args: Record<string, unknown>) => void;
  onToolResult?: (result: ToolResult) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
  onTeardown?: () => Promise<void>;
  /** Called when widget state changes (restored from host or updated) */
  onWidgetStateChange?: (widgetState: WidgetState | null) => void;
}

/**
 * Logger interface with convenience methods for each log level.
 *
 * Provides both a default `log(message, data?)` method (logs at "info" level)
 * and explicit level methods: `debug()`, `info()`, `notice()`, `warn()`, `error()`.
 */
export interface Logger {
  /**
   * Log a message at "info" level (default).
   * @param message - Log message
   * @param data - Optional structured data
   */
  (message: string, data?: Record<string, unknown>): void;

  /**
   * Log at "debug" level. Gray in DevConsole, typically hidden by default.
   */
  debug: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log at "info" level. Normal text color in DevConsole.
   */
  info: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log at "notice" level. Blue in DevConsole, for notable events.
   */
  notice: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log at "warning" level. Yellow in DevConsole.
   */
  warn: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Log at "error" level. Red in DevConsole.
   */
  error: (message: string, data?: Record<string, unknown>) => void;
}

export interface UseHostReturn {
  isReady: boolean;
  callTool: <T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ) => Promise<ToolResult<T>>;
  sendNotification: (method: string, params: unknown) => void;
  environment: Environment;
  widgetState: WidgetState | null;
  setWidgetState: (state: WidgetState | null) => void;
  requestDisplayMode: (params: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;

  /**
   * The adapter kind currently in use.
   * For MCP Apps, this is determined after connection based on hostContext.userAgent.
   * Values: "mcp-apps" | "creature" | "chatgpt" | "standalone"
   */
  adapterKind: AdapterKind;

  /**
   * Whether this host is Creature (supports Creature-specific extensions).
   * Determined via hostContext.userAgent after connection.
   */
  isCreature: boolean;

  /**
   * Get the host context received from the host.
   * Contains theme, styles, userAgent, and host-specific properties.
   * Returns null before connection is established.
   */
  hostContext: HostContext | null;

  /**
   * Logger for sending messages to the host's DevConsole.
   *
   * @example
   * ```tsx
   * const { log } = useHost({ name: "my-app", version: "1.0.0" });
   *
   * // Default level (info)
   * log("User clicked button");
   *
   * // With data
   * log("Processing item", { itemId: 123 });
   *
   * // Specific levels
   * log.debug("Verbose debugging info");
   * log.info("General information");
   * log.notice("Notable event");
   * log.warn("Something looks off");
   * log.error("Something went wrong", { error: err.message });
   * ```
   */
  log: Logger;
}

// ============================================================================
// useToolResult
// ============================================================================

export interface UseToolResultReturn<T> {
  /** Structured data from tool result */
  data: T | null;
  /** Instance ID for this widget */
  instanceId: string | null;
  /** Title for PIP tab */
  title: string | null;
  /** Whether this is an error result */
  isError: boolean;
  /** Text content for AI context */
  text: string | null;
  /** Callback to handle tool result */
  onToolResult: (result: ToolResult) => void;
  /** Reset all state */
  reset: () => void;
}

// ============================================================================
// useWebSocket
// ============================================================================

export interface UseWebSocketConfig<TReceive = unknown> {
  onMessage?: (message: TReceive) => void;
  enabled?: boolean;
}

export interface UseWebSocketReturn<TSend = unknown> {
  status: WebSocketStatus;
  error: string | undefined;
  send: (message: TSend) => void;
}

// ============================================================================
// CreatureIcon
// ============================================================================

export interface CreatureIconProps {
  /** Whether the app is in dark mode */
  isDarkMode: boolean;
  /** Whether to show the eyes (default: true) */
  showEyes?: boolean;
  /** Whether to enable eye blinking animation (default: false) */
  enableBlink?: boolean;
  /** Width of the icon in pixels */
  width?: number;
  /** Height of the icon in pixels */
  height?: number;
  /** Optional className for additional styling */
  className?: string;
}

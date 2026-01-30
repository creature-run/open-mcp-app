/**
 * Provider Adapter Types
 *
 * Defines the interfaces for host-specific adapters that extend
 * the base host client with additional capabilities.
 */

import type {
  BaseHostClient,
  BaseHostClientEvents,
  McpAppsHostClientEvents,
  DisplayMode,
  Environment,
  HostClientConfig,
  HostClientState,
  HostContext,
  LogLevel,
  StateListener,
  ToolResult,
  WidgetState,
} from "../base/types.js";

// ============================================================================
// Unified Host Client Events
// ============================================================================

/**
 * All events supported by the unified host client.
 * Combines base events with MCP-specific events.
 */
export interface UnifiedHostClientEvents extends BaseHostClientEvents, McpAppsHostClientEvents {}

// ============================================================================
// Experimental Host API
// ============================================================================

/**
 * Experimental host APIs that are not part of the MCP Apps spec.
 *
 * These APIs may change or be removed in future versions. They provide
 * access to Creature-specific features and other non-standard extensions.
 *
 * Similar to Vercel AI SDK's `experimental_*` pattern, these APIs are
 * grouped under a separate namespace to clearly indicate their status.
 */
export interface ExperimentalHostApi {
  /**
   * Send a raw notification to the host.
   *
   * This is a low-level API for sending custom notifications. Most apps
   * should use higher-level methods like `setWidgetState` or `setTitle`.
   *
   * MCP Apps only - no-op on ChatGPT.
   *
   * @param method - The notification method name (e.g., "ui/notifications/...")
   * @param params - The notification parameters
   */
  sendNotification(method: string, params: unknown): void;

  /**
   * Set widget state and notify the host.
   *
   * Widget state is synchronized with the host for persistence across
   * sessions and visibility to the AI model.
   *
   * **Non-spec extension:** On MCP Apps hosts, this sends a
   * `ui/notifications/widget-state-changed` notification (Creature extension).
   * On ChatGPT, this uses the native `window.openai.setWidgetState` bridge.
   *
   * @param state - New widget state (or null to clear)
   */
  setWidgetState(state: WidgetState | null): void;

  /**
   * Set the pip/widget title displayed in the host UI.
   *
   * **Creature-only extension:** This sends a `ui/notifications/title-changed`
   * notification. No-op on ChatGPT and generic MCP Apps hosts.
   *
   * @param title - The new title to display
   */
  setTitle(title: string): void;

  /**
   * Get Creature-specific CSS style variables.
   *
   * **Creature-only extension:** Returns custom CSS variables provided by the
   * Creature host via `hostContext.creatureStyles`. Returns null when not
   * running in Creature or styles are not available.
   */
  getCreatureStyles(): Record<string, string | undefined> | null;
}

// ============================================================================
// Unified Host Client Interface
// ============================================================================

/**
 * Unified host client interface.
 *
 * This is the primary interface returned by `createHost()`.
 * It combines the base interface with host-specific extensions,
 * providing a consistent API across all platforms.
 */
export interface UnifiedHostClient {
  /** Get current state */
  getState(): HostClientState;

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: StateListener): () => void;

  /** Call a tool on the MCP server */
  callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>>;

  /**
   * Request a display mode change from the host.
   */
  requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }>;

  /**
   * Send a log message.
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void;

  /** Register an event handler. Returns unsubscribe function. */
  on<K extends keyof UnifiedHostClientEvents>(
    event: K,
    handler: UnifiedHostClientEvents[K]
  ): () => void;

  /** Start listening for host messages */
  connect(): void;

  /** Stop listening for host messages */
  disconnect(): void;

  /**
   * The detected environment.
   * Use this to conditionally enable host-specific features.
   */
  readonly environment: Environment;

  /**
   * The adapter kind currently in use.
   */
  readonly adapterKind: AdapterKind;

  /**
   * Whether this host is Creature (supports Creature-specific extensions).
   * Checked via hostContext after connection.
   */
  readonly isCreature: boolean;

  /**
   * Get the host context received from the host.
   * Contains theme, styles, userAgent, and host-specific properties.
   * Returns null before connection is established.
   */
  getHostContext(): HostContext | null;

  /**
   * Experimental APIs that are not part of the MCP Apps spec.
   *
   * These APIs provide access to Creature-specific features and other
   * non-standard extensions. They may change or be removed in future versions.
   *
   * @example
   * ```typescript
   * // Set widget state (non-spec extension)
   * client.experimental.setWidgetState({ count: 42 });
   *
   * // Set title (Creature-only)
   * if (client.isCreature) {
   *   client.experimental.setTitle("My Widget");
   * }
   * ```
   */
  readonly experimental: ExperimentalHostApi;
}

// ============================================================================
// Adapter Types
// ============================================================================

/**
 * The kind of adapter in use.
 */
export type AdapterKind = "mcp-apps" | "creature" | "chatgpt" | "standalone";

/**
 * Base adapter interface.
 * All adapters implement this interface.
 */
export interface HostAdapter extends UnifiedHostClient {
  /** The underlying base client */
  readonly base: BaseHostClient;
}

/**
 * Static adapter factory interface.
 * Each adapter provides a static `create` method.
 */
export interface AdapterFactory {
  /**
   * Create an adapter instance with the given config.
   */
  create(config: HostClientConfig): HostAdapter;

  /**
   * Check if this adapter should be used for the current environment.
   */
  detect(): boolean;
}

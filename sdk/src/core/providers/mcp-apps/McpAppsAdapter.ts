/**
 * MCP Apps Adapter (Base)
 *
 * Base adapter for all MCP Apps hosts. This is the foundation that other
 * host-specific adapters (like CreatureAdapter) extend.
 *
 * Works with any MCP Apps-compliant host out of the box.
 */

import { McpAppsBaseHostClient } from "../../base/McpAppsBaseHostClient.js";
import type {
  DisplayMode,
  HostClientConfig,
  HostClientState,
  LogLevel,
  StateListener,
  ToolResult,
  WidgetState,
  Environment,
  HostContext,
} from "../../base/types.js";
import type {
  AdapterKind,
  HostAdapter,
  UnifiedHostClientEvents,
} from "../types.js";

/**
 * MCP Apps adapter implementation.
 *
 * This is the base adapter for all MCP Apps hosts. It provides the standard
 * MCP Apps functionality that works across all compliant hosts.
 *
 * Host-specific adapters (like CreatureAdapter) should extend this class
 * to add their own extensions while maintaining compatibility.
 */
export class McpAppsAdapter implements HostAdapter {
  readonly base: McpAppsBaseHostClient;
  readonly adapterKind: AdapterKind = "mcp-apps";

  constructor(config: HostClientConfig) {
    this.base = this.createBaseClient(config);
  }

  /**
   * Factory method for creating the base client.
   * Subclasses can override this to use a custom base client.
   */
  protected createBaseClient(config: HostClientConfig): McpAppsBaseHostClient {
    return new McpAppsBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create an MCP Apps adapter instance.
   */
  static create(config: HostClientConfig): McpAppsAdapter {
    return new McpAppsAdapter(config);
  }

  /**
   * Check if the current environment is MCP Apps (iframe with parent).
   */
  static detect(): boolean {
    if (typeof window === "undefined") return false;
    // MCP Apps runs in an iframe with a parent window
    return window.parent !== window && !("openai" in window && (window as unknown as { openai?: unknown }).openai);
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

  get environment(): Environment {
    return this.base.getState().environment;
  }

  /**
   * Whether this is a Creature host.
   * Base MCP Apps adapter returns false - CreatureAdapter overrides this.
   */
  get isCreature(): boolean {
    return false;
  }

  /**
   * Get the host context received from the host.
   * Useful for checking host-specific capabilities.
   */
  getHostContext(): HostContext | null {
    return this.base.getHostContext();
  }

  getState(): HostClientState {
    return this.base.getState();
  }

  subscribe(listener: StateListener): () => void {
    return this.base.subscribe(listener);
  }

  async callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    return this.base.callTool<T>(toolName, args);
  }

  sendNotification(method: string, params: unknown): void {
    this.base.sendNotification(method, params);
  }

  setWidgetState(state: WidgetState | null): void {
    this.base.setWidgetState(state);
  }

  /**
   * Set pip/widget title.
   * Sends a notification - hosts that support it will update the title.
   */
  setTitle(title: string): void {
    this.base.sendNotification("ui/notifications/title-changed", { title });
  }

  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    return this.base.requestDisplayMode(params);
  }

  log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    this.base.log(level, message, data);
  }

  on<K extends keyof UnifiedHostClientEvents>(
    event: K,
    handler: UnifiedHostClientEvents[K]
  ): () => void {
    if (event === "theme-change" || event === "teardown") {
      // MCP-specific events go through the MCP subscribable
      return this.base.onMcpEvent(
        event as "theme-change" | "teardown",
        handler as (theme: "light" | "dark") => void | (() => Promise<void> | void)
      );
    }
    // Base events
    return this.base.on(
      event as keyof import("../../base/types.js").BaseHostClientEvents,
      handler as import("../../base/types.js").BaseHostClientEvents[keyof import("../../base/types.js").BaseHostClientEvents]
    );
  }

  connect(): void {
    this.base.connect();
  }

  disconnect(): void {
    this.base.disconnect();
  }
}

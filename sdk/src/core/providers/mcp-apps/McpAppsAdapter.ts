/**
 * MCP Apps Adapter
 *
 * Wraps the MCP Apps base host client with the unified interface.
 * Provides MCP-specific features like notifications and teardown events.
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
  BaseHostClient,
} from "../../base/types.js";
import type {
  AdapterKind,
  HostAdapter,
  UnifiedHostClientEvents,
} from "../types.js";

/**
 * MCP Apps adapter implementation.
 *
 * Wraps McpAppsBaseHostClient and exposes the unified interface.
 * This adapter is used for generic MCP Apps hosts (not specifically Creature).
 */
export class McpAppsAdapter implements HostAdapter {
  readonly base: McpAppsBaseHostClient;
  readonly adapterKind: AdapterKind = "mcp-apps";

  constructor(config: HostClientConfig) {
    this.base = new McpAppsBaseHostClient(config);
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

  get isCreature(): boolean {
    // Generic MCP Apps adapter - not Creature
    // Creature-specific detection happens in CreatureAdapter
    return false;
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
   * Set pip/widget title - available on MCP Apps hosts that support it.
   * Generic MCP Apps hosts may or may not support this notification.
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

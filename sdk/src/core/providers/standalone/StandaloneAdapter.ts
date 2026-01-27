/**
 * Standalone Adapter
 *
 * Wraps the Standalone base host client with the unified interface.
 * Used when running outside any host environment (development/testing).
 */

import { StandaloneBaseHostClient } from "../../base/StandaloneBaseHostClient.js";
import type {
  DisplayMode,
  HostClientConfig,
  HostClientState,
  HostContext,
  LogLevel,
  StateListener,
  ToolResult,
  WidgetState,
  Environment,
} from "../../base/types.js";
import type {
  AdapterKind,
  HostAdapter,
  UnifiedHostClientEvents,
} from "../types.js";

/**
 * Standalone adapter implementation.
 *
 * A minimal fallback for development and testing scenarios.
 * Host-specific features are no-ops or console-logged.
 */
export class StandaloneAdapter implements HostAdapter {
  readonly base: StandaloneBaseHostClient;
  readonly adapterKind: AdapterKind = "standalone";

  constructor(config: HostClientConfig) {
    this.base = new StandaloneBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create a Standalone adapter instance.
   */
  static create(config: HostClientConfig): StandaloneAdapter {
    return new StandaloneAdapter(config);
  }

  /**
   * Check if the current environment is standalone.
   * Returns true when not in ChatGPT or MCP Apps.
   */
  static detect(): boolean {
    if (typeof window === "undefined") return true;
    // Not ChatGPT
    if ("openai" in window && (window as unknown as { openai?: unknown }).openai) {
      return false;
    }
    // Not MCP Apps (iframe)
    if (window.parent !== window) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

  get environment(): Environment {
    return this.base.getState().environment;
  }

  get isCreature(): boolean {
    return false;
  }

  /**
   * Get host context - returns null for standalone mode.
   */
  getHostContext(): HostContext | null {
    return null;
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

  /**
   * Send notification - logged in standalone mode.
   */
  sendNotification(method: string, params: unknown): void {
    console.debug(`[Standalone] sendNotification("${method}")`, params);
  }

  setWidgetState(state: WidgetState | null): void {
    this.base.setWidgetState(state);
  }

  /**
   * Set pip/widget title - logged in standalone mode.
   */
  setTitle(title: string): void {
    console.debug(`[Standalone] setTitle("${title}")`);
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
    // Standalone only supports base events
    if (event === "theme-change" || event === "teardown") {
      // Return no-op unsubscribe for unsupported events
      return () => {};
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

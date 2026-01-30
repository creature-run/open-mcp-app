/**
 * ChatGPT Adapter
 *
 * Wraps the ChatGPT base host client with the unified interface.
 * Provides ChatGPT-specific features via the window.openai bridge.
 */

import { ChatGptBaseHostClient } from "../../base/ChatGptBaseHostClient.js";
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
  ExperimentalHostApi,
} from "../types.js";

/**
 * ChatGPT adapter implementation.
 *
 * Wraps ChatGptBaseHostClient and exposes the unified interface.
 * MCP-specific features (like notifications and teardown) are no-ops.
 */
export class ChatGptAdapter implements HostAdapter {
  readonly base: ChatGptBaseHostClient;
  readonly adapterKind: AdapterKind = "chatgpt";

  constructor(config: HostClientConfig) {
    this.base = new ChatGptBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create a ChatGPT adapter instance.
   */
  static create(config: HostClientConfig): ChatGptAdapter {
    return new ChatGptAdapter(config);
  }

  /**
   * Check if the current environment is ChatGPT.
   */
  static detect(): boolean {
    if (typeof window === "undefined") return false;
    return "openai" in window && !!(window as unknown as { openai?: unknown }).openai;
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
   * Experimental APIs for ChatGPT.
   * Most are no-ops since ChatGPT doesn't support MCP Apps extensions.
   */
  get experimental(): ExperimentalHostApi {
    return {
      sendNotification: (_method: string, _params: unknown) => {
        // No-op on ChatGPT
      },
      setWidgetState: (state: WidgetState | null) => {
        // ChatGPT supports widget state via native bridge
        this.base.setWidgetState(state);
      },
      setTitle: (_title: string) => {
        // No-op on ChatGPT
      },
      getCreatureStyles: () => {
        // Not available on ChatGPT
        return null;
      },
    };
  }

  /**
   * Get host context - returns null for ChatGPT as it doesn't use MCP Apps protocol.
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
    // ChatGPT only supports base events
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

/**
 * Creature Adapter
 *
 * Extends the MCP Apps adapter with Creature-specific features:
 * - setTitle() for pip title updates
 * - creatureStyles CSS variables from hostContext
 * - Enhanced logging to DevConsole
 * - WebSocket support detection
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
 * Extended host context with Creature-specific fields.
 */
interface CreatureHostContext extends HostContext {
  creatureStyles?: Record<string, string | undefined>;
}

/**
 * Extended MCP Apps base client that handles Creature-specific hostContext.
 */
class CreatureBaseHostClient extends McpAppsBaseHostClient {
  private creatureStyles: Record<string, string | undefined> | null = null;

  /**
   * Get Creature-specific styles from host context.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.creatureStyles;
  }

  /**
   * Check if connected to a Creature host.
   */
  isCreatureHost(): boolean {
    const context = this.getHostContext() as CreatureHostContext | null;
    return context?.creatureStyles !== undefined;
  }

  /**
   * Override to also apply Creature-specific styles.
   */
  protected applyHostContext(context: {
    theme?: unknown;
    styles?: { variables?: unknown; css?: { fonts?: string } };
    creatureStyles?: Record<string, string | undefined>;
  }): void {
    // Apply base MCP Apps styles first
    super.applyHostContext(context);

    // Apply Creature-specific extension styles
    if (context.creatureStyles) {
      this.creatureStyles = context.creatureStyles;
      this.applyCreatureStyles(context.creatureStyles);
    }
  }

  /**
   * Apply Creature-specific CSS variables to the document root.
   */
  private applyCreatureStyles(styles: Record<string, string | undefined>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    }
  }
}

/**
 * Creature adapter implementation.
 *
 * Provides full Creature-specific functionality including:
 * - setTitle() for dynamic pip tab titles
 * - creatureStyles CSS variables
 * - Full DevConsole logging
 */
export class CreatureAdapter implements HostAdapter {
  readonly base: CreatureBaseHostClient;
  readonly adapterKind: AdapterKind = "creature";

  constructor(config: HostClientConfig) {
    this.base = new CreatureBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create a Creature adapter instance.
   */
  static create(config: HostClientConfig): CreatureAdapter {
    return new CreatureAdapter(config);
  }

  /**
   * Check if the current environment is Creature.
   *
   * Note: This performs basic detection. Full Creature detection
   * requires connecting and checking hostContext for creatureStyles.
   */
  static detect(): boolean {
    if (typeof window === "undefined") return false;
    // For now, we detect MCP Apps (iframe) and assume Creature
    // More accurate detection happens after connection via hostContext
    return window.parent !== window && !("openai" in window && (window as unknown as { openai?: unknown }).openai);
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

  get environment(): Environment {
    return this.base.getState().environment;
  }

  get isCreature(): boolean {
    return this.base.isCreatureHost();
  }

  /**
   * Get Creature-specific styles if available.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.base.getCreatureStyles();
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
   * Set the pip/widget title displayed in Creature's UI.
   *
   * Sends a notification to the host to update the title. This is useful
   * for updating the title based on user actions (e.g., switching tabs)
   * without making a tool call.
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
      // MCP-specific events
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

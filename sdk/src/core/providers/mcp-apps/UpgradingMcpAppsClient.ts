/**
 * Upgrading MCP Apps Client
 *
 * A delegating wrapper for MCP Apps environments that determines the
 * correct adapter type after connection based on hostContext.userAgent.
 *
 * This implements the spec-compliant host identification flow:
 * 1. Start as a generic MCP Apps client
 * 2. Connect and receive hostContext via ui/initialize
 * 3. Check hostContext.userAgent to determine if it's Creature
 * 4. Update adapterKind/isCreature accordingly
 */

import { McpAppsBaseHostClient } from "../../base/McpAppsBaseHostClient.js";
import { isHost, KNOWN_HOSTS } from "../../base/hostIdentity.js";
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
 * Extended MCP Apps base client that handles Creature-specific hostContext.
 * Used internally by UpgradingMcpAppsClient.
 */
class CreatureCapableBaseHostClient extends McpAppsBaseHostClient {
  private creatureStyles: Record<string, string | undefined> | null = null;

  /**
   * Get Creature-specific styles from host context.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.creatureStyles;
  }

  /**
   * Check if connected to a Creature host.
   * Uses hostContext.userAgent (spec-compliant).
   */
  isCreatureHost(): boolean {
    const context = this.getHostContext();
    return isHost(context, KNOWN_HOSTS.CREATURE);
  }

  /**
   * Override to also apply Creature-specific styles.
   */
  protected override applyHostContext(context: {
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
 * Upgrading MCP Apps client that determines the correct adapter type
 * after connection based on hostContext.userAgent.
 *
 * Before connection: adapterKind = "mcp-apps", isCreature = false
 * After connection: adapterKind and isCreature reflect the actual host
 */
export class UpgradingMcpAppsClient implements HostAdapter {
  readonly base: CreatureCapableBaseHostClient;

  constructor(config: HostClientConfig) {
    this.base = new CreatureCapableBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  static create(config: HostClientConfig): UpgradingMcpAppsClient {
    return new UpgradingMcpAppsClient(config);
  }

  static detect(): boolean {
    if (typeof window === "undefined") return false;
    // MCP Apps runs in an iframe with a parent window
    return window.parent !== window && !("openai" in window && (window as unknown as { openai?: unknown }).openai);
  }

  // ============================================================================
  // Dynamic Properties (change after connection based on hostContext)
  // ============================================================================

  /**
   * The adapter kind - determined after connection based on hostContext.userAgent.
   * Returns "creature" if running in Creature, "mcp-apps" otherwise.
   */
  get adapterKind(): AdapterKind {
    return this.base.isCreatureHost() ? "creature" : "mcp-apps";
  }

  /**
   * Whether this host is Creature.
   * Determined via hostContext.userAgent after connection.
   */
  get isCreature(): boolean {
    return this.base.isCreatureHost();
  }

  get environment(): Environment {
    return this.base.getState().environment;
  }

  // ============================================================================
  // Creature-Specific Extensions (gracefully no-op when not in Creature)
  // ============================================================================

  /**
   * Get Creature-specific styles if available.
   * Returns null when not running in Creature.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.base.getCreatureStyles();
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

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
      return this.base.onMcpEvent(
        event as "theme-change" | "teardown",
        handler as (theme: "light" | "dark") => void | (() => Promise<void> | void)
      );
    }
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

import { Subscribable } from "./Subscribable.js";
import type {
  DisplayMode,
  HostBridge,
  HostClientConfig,
  HostClientState,
  LogLevel,
  ToolResult,
  WidgetState,
} from "./types.js";

/**
 * Standalone host bridge implementation.
 *
 * A minimal fallback for when running outside any host environment.
 * Useful for development and testing scenarios.
 */
export class StandaloneHostBridge extends Subscribable implements HostBridge {
  // ============================================================================
  // Private Properties
  // ============================================================================

  private state: HostClientState = {
    isReady: false,
    environment: "standalone",
    widgetState: null,
  };
  protected config: HostClientConfig;
  private connected = false;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(config: HostClientConfig) {
    super();
    this.config = config;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get the current client state.
   */
  getState(): HostClientState {
    return this.state;
  }

  /**
   * Connect in standalone mode.
   *
   * Simply marks the client as ready since there's no host to connect to.
   */
  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.setState({ isReady: true });
    console.info(`[${this.config.name}] Running in standalone mode`);
  }

  /**
   * Disconnect in standalone mode.
   */
  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    this.setState({ isReady: false });
  }

  /**
   * Call a tool - not available in standalone mode.
   */
  async callTool<T = Record<string, unknown>>(
    toolName: string,
    _args: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    console.warn(`[${this.config.name}] callTool("${toolName}") not available in standalone mode`);
    return {
      content: [{ type: "text", text: "Tool calls not available in standalone mode" }],
      isError: true,
    };
  }

  /**
   * Set widget state locally (no host to sync with).
   */
  setWidgetState(state: WidgetState | null): void {
    this.setState({ widgetState: state });
    this.emit("widget-state-change", state);
  }

  /**
   * Log a message to the console.
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
    console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
  }

  /**
   * Request a display mode - returns the requested mode since there's no host to negotiate with.
   */
  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    console.info(`[${this.config.name}] Display mode requested: ${params.mode} (standalone)`);
    return { mode: params.mode };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Update internal state and notify listeners.
   */
  protected setState(partial: Partial<HostClientState>): void {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }
}

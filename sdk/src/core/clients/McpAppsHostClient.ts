/**
 * MCP Apps Host Client
 *
 * Unified host client for MCP Apps environments (Creature, Claude, etc.).
 * Handles iframe postMessage communication with the host application.
 */

import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";
import { Subscribable } from "../subscribable.js";
import type {
  ContentBlock,
  DisplayMode,
  ExpHostApi,
  HostClientConfig,
  HostClientEvents,
  HostClientState,
  HostContext,
  LogLevel,
  StateListener,
  ToolResult,
  UnifiedHostClient,
  WidgetState,
} from "../types.js";

/**
 * MCP Apps host client implementation.
 *
 * Provides a unified interface for MCP Apps hosts. Automatically handles
 * Creature-specific extensions when connected to Creature host.
 */
export class McpAppsHostClient extends Subscribable implements UnifiedHostClient {
  readonly environment = "mcp-apps" as const;

  private state: HostClientState = {
    isReady: false,
    environment: "mcp-apps",
    widgetState: null,
  };
  private config: HostClientConfig;
  private app: App | null = null;
  private connected = false;
  private hostContext: HostContext | null = null;
  private instanceId: string | null = null;

  /**
   * Timer for the ready buffer period.
   * 
   * After ui/initialize completes, we wait briefly for tool-input/tool-result
   * messages that may arrive immediately after. This prevents flickering when
   * pips are opened via tool calls - the app sees the correct initial data
   * rather than rendering a default view and then switching.
   */
  private readyBufferTimer: ReturnType<typeof setTimeout> | null = null;

  /** Duration to wait after initialization before setting isReady */
  private static readonly READY_BUFFER_MS = 500;

  constructor(config: HostClientConfig) {
    super();
    this.config = config;
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create an MCP Apps host client instance.
   */
  static create(config: HostClientConfig): McpAppsHostClient {
    return new McpAppsHostClient(config);
  }

  /**
   * Check if the current environment is MCP Apps (iframe with parent).
   */
  static detect(): boolean {
    if (typeof window === "undefined") return false;
    return window.parent !== window && !("openai" in window && (window as { openai?: unknown }).openai);
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

  getState(): HostClientState {
    return this.state;
  }

  getHostContext(): HostContext | null {
    return this.hostContext;
  }

  subscribe(listener: StateListener): () => void {
    return this.subscribeToState(listener);
  }

  /**
   * Connect to the MCP Apps host.
   *
   * Creates the App instance, registers notification handlers, and initiates
   * the protocol handshake. The host responds with hostContext including
   * theme, styles, and widgetState.
   */
  connect(): void {
    if (this.connected) return;
    this.connected = true;

    this.app = new App(
      { name: this.config.name, version: this.config.version },
      {},
      { autoResize: true }
    );

    this.setupHandlers();
    this.initiateConnection();
  }

  /**
   * Disconnect from the host.
   */
  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;

    // Clear any pending ready buffer timer
    if (this.readyBufferTimer) {
      clearTimeout(this.readyBufferTimer);
      this.readyBufferTimer = null;
    }

    if (this.app) {
      this.app.close();
      this.app = null;
    }

    this.setState({ isReady: false });
  }

  /**
   * Call a tool on the MCP server via the host.
   */
  async callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    if (!this.app) {
      throw new Error("Not connected");
    }

    const sdkResult = await this.app.callServerTool({
      name: toolName,
      arguments: args,
    });

    const result: ToolResult<T> = {
      content: this.extractTextContent(sdkResult.content),
      structuredContent: sdkResult.structuredContent as T,
      isError: sdkResult.isError,
      source: "ui",
    };

    // Extract instanceId from structuredContent if present
    if (sdkResult.structuredContent && typeof sdkResult.structuredContent === "object") {
      const sc = sdkResult.structuredContent as Record<string, unknown>;
      if (typeof sc.instanceId === "string") {
        this.instanceId = sc.instanceId;
      }
    }

    this.emit("tool-result", result as ToolResult);
    return result;
  }

  /**
   * Request a display mode change from the host.
   */
  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    if (!this.app) {
      return { mode: params.mode };
    }

    const result = await this.app.requestDisplayMode({ mode: params.mode });
    return { mode: result.mode as DisplayMode };
  }

  /**
   * Send a log message to the host's DevConsole.
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.app) {
      const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
      console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
      return;
    }

    this.app.sendLog({
      level,
      logger: this.config.name,
      data: data ? { message, ...data } : message,
    });
  }

  on<K extends keyof HostClientEvents>(
    event: K,
    handler: HostClientEvents[K]
  ): () => void {
    if (event === "theme-change" || event === "teardown") {
      return this.onMcpEvent(
        event as "theme-change" | "teardown",
        handler as (theme: "light" | "dark") => void | (() => Promise<void> | void)
      );
    }
    return this.onEvent(
      event as "tool-input" | "tool-result" | "widget-state-change",
      handler as HostClientEvents["tool-input" | "tool-result" | "widget-state-change"]
    );
  }

  // ============================================================================
  // Experimental API
  // ============================================================================

  /**
   * Experimental APIs for non-standard features.
   */
  get exp(): ExpHostApi {
    return {
      setWidgetState: (state: WidgetState | null) => {
        this.setState({ widgetState: state });
        this.emit("widget-state-change", state);
        this.sendNotification("ui/notifications/widget-state-changed", {
          widgetState: state,
        });
      },

      setTitle: (title: string) => {
        // Only send if connected to Creature (detected via userAgent)
        if (this.isCreatureHost()) {
          this.sendNotification("ui/notifications/title-changed", { title });
        }
      },

      updateModelContext: async (content: ContentBlock[]) => {
        if (!this.app) return;
        // Type assertion needed for MCP Apps SDK
        this.app.notification({
          method: "ui/update-model-context",
          params: { content },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      },

      sendNotification: (method: string, params: unknown) => {
        this.sendNotification(method, params);
      },

      getInstanceId: () => {
        return this.instanceId;
      },

      supportsMultiInstance: () => {
        return this.isCreatureHost();
      },

      // ChatGPT-only APIs - no-ops on MCP Apps
      sendFollowUpMessage: async (_prompt: string) => {
        // No-op on MCP Apps
      },

      requestModal: async (_options: { title?: string; params?: Record<string, unknown> }) => {
        // No-op on MCP Apps
        return null;
      },

      requestClose: async () => {
        // No-op on MCP Apps
      },
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Send a notification to the host.
   */
  private sendNotification(method: string, params: unknown): void {
    if (!this.app) {
      console.warn(`[${this.config.name}] Cannot send notification before connection`);
      return;
    }
    // Type assertion needed for notifications not in the official MCP Apps spec
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.notification({ method, params } as any);
  }

  /**
   * Check if connected to a Creature host via userAgent.
   */
  private isCreatureHost(): boolean {
    if (!this.hostContext?.userAgent) return false;
    return this.hostContext.userAgent.toLowerCase().startsWith("creature");
  }

  /**
   * Update internal state and notify listeners.
   */
  private setState(partial: Partial<HostClientState>): void {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }

  /**
   * Complete the ready state immediately.
   * 
   * Called when tool-input or tool-result arrives during the buffer period.
   * Since we now have the data, there's no need to wait for the buffer timeout.
   */
  private completeReadyState(): void {
    if (this.readyBufferTimer) {
      clearTimeout(this.readyBufferTimer);
      this.readyBufferTimer = null;
    }
    if (!this.state.isReady) {
      this.setState({ isReady: true });
    }
  }

  /**
   * Set up notification handlers on the App instance.
   */
  private setupHandlers(): void {
    if (!this.app) return;

    this.app.ontoolinput = (params) => {
      console.debug(`[${this.config.name}] Received tool-input`, { args: params.arguments });
      
      // If we receive tool-input during the buffer period, we have the data
      // we were waiting for - complete ready state immediately
      this.completeReadyState();
      
      this.emit("tool-input", params.arguments || {});
    };

    this.app.ontoolresult = (params) => {
      const result: ToolResult = {
        content: this.extractTextContent(params.content),
        structuredContent: params.structuredContent as Record<string, unknown>,
        isError: params.isError,
        source: params.source as "agent" | "ui",
      };

      // Extract instanceId from structuredContent if present
      if (params.structuredContent && typeof params.structuredContent === "object") {
        const sc = params.structuredContent as Record<string, unknown>;
        if (typeof sc.instanceId === "string") {
          this.instanceId = sc.instanceId;
        }
      }

      // If we receive tool-result during the buffer period, we have the data
      // we were waiting for - complete ready state immediately
      this.completeReadyState();

      this.emit("tool-result", result);
    };

    this.app.onhostcontextchanged = (params) => {
      console.debug(`[${this.config.name}] Host context changed`, { theme: params.theme });
      this.applyHostContext(params as HostContext);
    };

    this.app.onteardown = async (_params, _extra) => {
      console.debug(`[${this.config.name}] Teardown requested`);
      await this.emitMcpEvent("teardown");
      return {};
    };
  }

  /**
   * Initiate connection using PostMessageTransport.
   * 
   * After ui/initialize completes, we start a buffer period before setting
   * isReady. This allows tool-input/tool-result messages to arrive first,
   * preventing flickering when pips are opened via tool calls.
   */
  private async initiateConnection(): Promise<void> {
    if (!this.app) return;

    try {
      const transport = new PostMessageTransport(window.parent, window.parent);
      await this.app.connect(transport);

      const hostContext = this.app.getHostContext() as HostContext | null;
      console.debug(`[${this.config.name}] Connected to host`, { theme: hostContext?.theme });

      if (hostContext) {
        this.hostContext = hostContext;
        this.applyHostContext(hostContext);

        // Restore widget state if provided by host
        if (hostContext.widgetState) {
          this.setState({ widgetState: hostContext.widgetState });
          this.emit("widget-state-change", hostContext.widgetState);
        }
      }

      // Start buffer period before setting isReady.
      // If tool-input/tool-result arrives during this period, isReady will be
      // set immediately (see completeReadyState). Otherwise, it fires after the timeout.
      // This prevents flickering when pips are opened via tool calls.
      this.readyBufferTimer = setTimeout(() => {
        this.readyBufferTimer = null;
        this.setState({ isReady: true });
      }, McpAppsHostClient.READY_BUFFER_MS);
    } catch (error) {
      console.error(`[${this.config.name}] Connection failed`, { error });
    }
  }

  /**
   * Apply theme, styles, and fonts from host context.
   */
  private applyHostContext(context: HostContext): void {
    if (context.theme) {
      applyDocumentTheme(context.theme);
      this.emitMcpEvent("theme-change", context.theme);
    }

    // Apply spec-compliant styles
    if (context.styles?.variables) {
      applyHostStyleVariables(context.styles.variables as Parameters<typeof applyHostStyleVariables>[0]);
    }

    if (context.styles?.css?.fonts) {
      applyHostFonts(context.styles.css.fonts);
    }

    // Apply experimental styles (non-standard extensions)
    if (context.experimental?.styles?.variables) {
      this.applyExperimentalStyles(context.experimental.styles.variables);
    }
  }

  /**
   * Apply experimental CSS variables to the document root.
   * These are non-standard extensions that enhance the spec styles.
   */
  private applyExperimentalStyles(styles: Record<string, string | undefined>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    }
  }

  /**
   * Extract text content from SDK result content array.
   */
  private extractTextContent(
    content?: Array<{ type: string; text?: string }>
  ): Array<{ type: string; text: string }> | undefined {
    return content
      ?.filter((item): item is { type: "text"; text: string } => item.type === "text")
      .map((item) => ({ type: item.type, text: item.text }));
  }
}

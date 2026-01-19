import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";
import { Subscribable } from "./Subscribable.js";
import type {
  DisplayMode,
  HostClient,
  HostClientConfig,
  HostClientState,
  LogLevel,
  ToolResult,
  WidgetState,
} from "./types.js";

/**
 * MCP Apps host client implementation.
 *
 * Wraps the official MCP Apps SDK `App` class to provide a consistent interface
 * with the ChatGPT host client. Handles the protocol handshake, tool calls,
 * notifications, and automatic style/theme application.
 */
export class McpAppHostClient extends Subscribable implements HostClient {
  // ============================================================================
  // Private Properties
  // ============================================================================

  private state: HostClientState = {
    isReady: false,
    environment: "mcp-apps",
    widgetState: null,
  };
  private config: HostClientConfig;
  private app: App | null = null;
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
   * Connect to the MCP Apps host.
   *
   * Creates the App instance, registers notification handlers, and initiates
   * the protocol handshake. The host will receive `ui/initialize` and respond
   * with host context including theme, styles, and widgetState.
   */
  connect(): void {
    if (this.connected) {
      return;
    }
    this.connected = true;

    this.app = new App(
      { name: this.config.name, version: this.config.version },
      {}, // capabilities
      { autoResize: true }
    );

    this.setupHandlers();
    this.initiateConnection();
  }

  /**
   * Disconnect from the host.
   *
   * Cleans up the App instance and resets state.
   */
  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;

    if (this.app) {
      this.app.close();
      this.app = null;
    }

    this.setState({ isReady: false });
  }

  /**
   * Call a tool on the MCP server via the host.
   *
   * Uses the SDK's callServerTool method which properly routes through
   * the host to the MCP server.
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Tool result with content and structuredContent
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
    };

    this.emit("tool-result", result as ToolResult);
    return result;
  }

  /**
   * Send a notification to the host.
   *
   * Sends a notification via the ext-apps SDK transport. Can be used for both
   * spec-compliant and custom (Creature-specific) notifications.
   *
   * @param method - Notification method name
   * @param params - Notification parameters
   */
  sendNotification(method: string, params: unknown): void {
    if (!this.app) {
      console.warn(`[${this.config.name}] Cannot send notification before connection`);
      return;
    }
    // Type assertion needed for Creature-specific extensions not in the MCP Apps spec
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.notification({ method, params } as any);
  }

  /**
   * Set widget state and notify the host.
   *
   * Widget state is synchronized with the host for persistence across
   * sessions and visibility to the AI model.
   *
   * Note: This is a Creature-specific extension, not part of the MCP Apps spec.
   * The host should handle `ui/notifications/widget-state-changed` notifications.
   *
   * @param state - New widget state (or null to clear)
   */
  setWidgetState(state: WidgetState | null): void {
    this.setState({ widgetState: state });
    this.emit("widget-state-change", state);

    this.sendNotification("ui/notifications/widget-state-changed", {
      widgetState: state,
    });
  }

  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    if (!this.app) {
      return { mode: params.mode };
    }

    const result = await this.app.requestDisplayMode({ mode: params.mode });
    return { mode: result.mode as DisplayMode };
  }

  /**
   * Send a log message to the host's DevConsole.
   *
   * Uses the MCP protocol's `notifications/message` notification to send logs
   * to the host. Logs appear in the unified DevConsole alongside server logs,
   * with appropriate color coding based on level.
   *
   * @param level - Log severity level (debug, info, notice, warning, error)
   * @param message - Log message
   * @param data - Optional structured data to include with the log
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

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Update internal state and notify listeners.
   */
  private setState(partial: Partial<HostClientState>): void {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }

  /**
   * Set up notification handlers on the App instance.
   *
   * Maps the official SDK's callback pattern to our event emitter pattern,
   * allowing consumers to use `.on("tool-result", ...)` etc.
   */
  private setupHandlers(): void {
    if (!this.app) return;

    this.app.ontoolinput = (params) => {
      console.debug(`[${this.config.name}] Received tool-input`, { args: params.arguments });
      this.emit("tool-input", params.arguments || {});
    };

    this.app.ontoolresult = (params) => {
      console.log(`[McpAppHostClient] ontoolresult called`, { 
        isError: params.isError, 
        source: params.source,
        hasContent: !!params.content,
        hasStructuredContent: !!params.structuredContent,
        structuredContent: params.structuredContent,
      });

      const result: ToolResult = {
        content: this.extractTextContent(params.content),
        structuredContent: params.structuredContent as Record<string, unknown>,
        isError: params.isError,
        source: params.source as "agent" | "ui",
      };

      console.log(`[McpAppHostClient] Emitting tool-result event`, result);
      this.emit("tool-result", result);
    };

    this.app.onhostcontextchanged = (params) => {
      console.debug(`[${this.config.name}] Host context changed`, { theme: params.theme });
      this.applyHostContext(params);
    };

    this.app.onteardown = async (_params, _extra) => {
      console.debug(`[${this.config.name}] Teardown requested`);
      await this.emit("teardown");
      return {};
    };
  }

  /**
   * Initiate connection using PostMessageTransport.
   *
   * The SDK's App.connect() handles the protocol handshake correctly:
   * the guest (App) sends `ui/initialize` to the host.
   */
  private async initiateConnection(): Promise<void> {
    if (!this.app) {
      return;
    }

    try {
      const transport = new PostMessageTransport(window.parent, window.parent);
      await this.app.connect(transport);

      const hostContext = this.app.getHostContext();
      console.debug(`[${this.config.name}] Connected to host`, { theme: hostContext?.theme });

      if (hostContext) {
        this.applyHostContext(hostContext);

        // Restore widget state if provided by host
        const widgetState = hostContext.widgetState as WidgetState | undefined;
        if (widgetState) {
          this.setState({ widgetState });
          this.emit("widget-state-change", widgetState);
        }
      }

      this.setState({ isReady: true });
    } catch (error) {
      console.error(`[${this.config.name}] Connection failed`, { error });
    }
  }

  /**
   * Apply theme, styles, and fonts from host context.
   * Also applies Creature-specific extension styles if present.
   */
  private applyHostContext(context: {
    theme?: unknown;
    styles?: { variables?: unknown; css?: { fonts?: string } };
    creatureStyles?: Record<string, string | undefined>;
  }): void {
    if (context.theme) {
      applyDocumentTheme(context.theme as Parameters<typeof applyDocumentTheme>[0]);
      this.emit("theme-change", context.theme as "light" | "dark");
    }

    if (context.styles?.variables) {
      applyHostStyleVariables(context.styles.variables as Parameters<typeof applyHostStyleVariables>[0]);
    }

    if (context.styles?.css?.fonts) {
      applyHostFonts(context.styles.css.fonts);
    }

    // Apply Creature-specific extension styles (outside the validated schema path)
    if (context.creatureStyles) {
      this.applyCreatureStyles(context.creatureStyles);
    }
  }

  /**
   * Apply Creature-specific CSS variables to the document root.
   * These are host extensions sent outside the spec-validated styles.variables path.
   */
  private applyCreatureStyles(styles: Record<string, string | undefined>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    }
  }

  /**
   * Extract text content from SDK result content array.
   * Filters to only include text items since our ToolResult type expects text.
   */
  private extractTextContent(
    content?: Array<{ type: string; text?: string }>
  ): Array<{ type: string; text: string }> | undefined {
    return content
      ?.filter((item): item is { type: "text"; text: string } => item.type === "text")
      .map((item) => ({ type: item.type, text: item.text }));
  }
}

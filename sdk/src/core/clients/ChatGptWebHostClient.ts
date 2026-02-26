/**
 * ChatGPT Web Host Client
 *
 * Host client for the ChatGPT web environment using the standard MCP Apps
 * protocol (iframe + `ui/*` JSON-RPC over `postMessage`).
 *
 * ChatGPT-specific extensions (`window.openai`) are used only for capabilities
 * not covered by the MCP Apps standard (requestModal, requestClose, sendFollowUpMessage).
 *
 * @see https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
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
 * Slim interface for ChatGPT-only extensions on `window.openai`.
 * These are optional capabilities not covered by the MCP Apps standard.
 */
interface OpenAIExtensions {
  sendFollowUpMessage?: (prompt: string) => Promise<void>;
  requestModal?: (options: { title?: string; params?: Record<string, unknown> }) => Promise<unknown>;
  requestClose?: () => Promise<void>;
}

declare global {
  interface Window {
    openai?: OpenAIExtensions;
  }
}

/**
 * ChatGPT Web host client implementation.
 *
 * Uses the standard MCP Apps protocol (`App` + `PostMessageTransport`)
 * for core functionality, with `window.openai` layered on for ChatGPT-only
 * extensions (requestModal, requestClose, sendFollowUpMessage).
 *
 * Event Buffering:
 * Tool-input and tool-result events may arrive before React components
 * have subscribed (due to useEffect timing). We buffer these events and
 * replay them when the first subscriber is added, ensuring no data is lost.
 */
export class ChatGptWebHostClient extends Subscribable implements UnifiedHostClient {
  readonly environment = "chatgpt" as const;

  private state: HostClientState = {
    isReady: false,
    environment: "chatgpt",
    widgetState: null,
  };
  private config: HostClientConfig;
  private app: App | null = null;
  private connected = false;
  private hostContext: HostContext | null = null;

  /**
   * Whether this view was triggered by a tool call.
   * Determined from openContext.triggeredBy in hostContext.
   */
  private triggeredByTool = true;

  /**
   * Whether we've received the initial tool-result notification.
   * Used to gate isReady when triggeredByTool is true.
   */
  private hasReceivedToolResult = false;

  /**
   * The initial tool result received when view was opened by agent.
   * Stored for getInitialToolResult() access.
   */
  private initialToolResult: ToolResult | null = null;

  /**
   * Buffered events for replay when subscribers are added.
   *
   * Events may arrive before React's useEffect sets up subscriptions.
   * We buffer them here and replay when the first subscriber is added.
   */
  private bufferedToolInput: Record<string, unknown> | null = null;
  private bufferedToolResult: ToolResult | null = null;

  constructor(config: HostClientConfig) {
    super();
    this.config = config;
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  static create(config: HostClientConfig): ChatGptWebHostClient {
    return new ChatGptWebHostClient(config);
  }

  /**
   * Check if the current environment is ChatGPT.
   * ChatGPT is the only MCP Apps host that sets `window.openai`.
   */
  static detect(): boolean {
    if (typeof window === "undefined") return false;
    return "openai" in window && !!window.openai;
  }

  // ============================================================================
  // UnifiedHostClient Implementation
  // ============================================================================

  getState(): HostClientState {
    return this.state;
  }

  getHostContext(): HostContext | null {
    // Read live context from the ChatGPT SDK to pick up display mode
    // changes that happen without onhostcontextchanged firing.
    if (this.app) {
      const live = this.app.getHostContext() as HostContext | null;
      if (live && this.hostContext) {
        const merged = { ...this.hostContext, ...live };
        if (merged.displayMode !== this.hostContext.displayMode) {
          console.log(`[${this.config.name}] displayMode changed via live context: ${this.hostContext.displayMode} → ${merged.displayMode}`);
          this.hostContext = merged;
          this.applyHostContext(live);
        }
        return merged;
      }
      if (live) return live;
    }
    return this.hostContext;
  }

  subscribe(listener: StateListener): () => void {
    return this.subscribeToState(listener);
  }

  /**
   * Connect to the ChatGPT host via the standard MCP Apps protocol.
   *
   * Creates the App instance, registers notification handlers, and initiates
   * the protocol handshake. The host responds with hostContext including
   * theme, styles, and widgetState.
   */
  connect(): void {
    if (this.connected) return;
    this.connected = true;

    console.log(`[${this.config.name}] ChatGPT MCP Apps: connect() called`, {
      hasWindowOpenai: !!window.openai,
      isInIframe: window.parent !== window,
    });

    this.app = new App(
      { name: this.config.name, version: this.config.version },
      {},
      { autoResize: true }
    );

    this.setupHandlers();
    this.initiateConnection();
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;

    this.removeMessagePatch();

    if (this.app) {
      this.app.close();
      this.app = null;
    }

    this.bufferedToolInput = null;
    this.bufferedToolResult = null;
    this.hasReceivedToolResult = false;
    this.initialToolResult = null;
    this.triggeredByTool = true;

    this.setState({ isReady: false });
  }

  /**
   * Call a tool on the MCP server via the standard `tools/call` method.
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
      toolName,
    };

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
    const grantedMode = result.mode as DisplayMode;

    // Update local hostContext so UI reflects the change immediately
    // (ChatGPT may not send onhostcontextchanged after display mode changes)
    if (this.hostContext) {
      this.hostContext = { ...this.hostContext, displayMode: grantedMode };
    }
    this.setState({});

    return { mode: grantedMode };
  }

  /**
   * Send a log message to the host's DevConsole.
   * Falls back to browser console before connection.
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

  /**
   * Update the model context for future turns.
   *
   * Sends `ui/update-model-context` notification per MCP Apps spec.
   * Context is available to the model in future turns without
   * triggering immediate response.
   */
  async updateModelContext(content: ContentBlock[]): Promise<void> {
    if (!this.app) return;
    this.app.notification({
      method: "ui/update-model-context",
      params: { content },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
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

    const unsubscribe = this.onEvent(
      event as "tool-input" | "tool-result" | "widget-state-change",
      handler as HostClientEvents["tool-input" | "tool-result" | "widget-state-change"]
    );

    // Replay buffered events to the new subscriber.
    // Events may have arrived before React's useEffect set up subscriptions.
    if (event === "tool-input" && this.bufferedToolInput) {
      const buffered = this.bufferedToolInput;
      this.bufferedToolInput = null;
      (handler as HostClientEvents["tool-input"])(buffered);
    } else if (event === "tool-result" && this.bufferedToolResult) {
      const buffered = this.bufferedToolResult;
      this.bufferedToolResult = null;
      (handler as HostClientEvents["tool-result"])(buffered);
    }

    return unsubscribe;
  }

  // ============================================================================
  // Experimental API
  // ============================================================================

  get exp(): ExpHostApi {
    return {
      setWidgetState: (state: WidgetState | null) => {
        this.setState({ widgetState: state });
        this.emit("widget-state-change", state);
        this.sendNotification("ui/notifications/widget-state-changed", {
          widgetState: state,
        });
      },

      setTitle: (_title: string) => { },

      sendNotification: (method: string, params: unknown) => {
        this.sendNotification(method, params);
      },

      getInstanceId: () => null,

      supportsMultiInstance: () => false,

      getInitialToolResult: () => this.initialToolResult,

      // ChatGPT-specific extensions via window.openai (feature-detected)
      sendFollowUpMessage: async (prompt: string) => {
        if (this.app) {
          this.sendNotification("ui/message", { message: prompt });
        } else if (window.openai?.sendFollowUpMessage) {
          await window.openai.sendFollowUpMessage(prompt);
        }
      },

      requestModal: async (options: { title?: string; params?: Record<string, unknown> }) => {
        if (window.openai?.requestModal) {
          return await window.openai.requestModal(options);
        }
        return null;
      },

      requestClose: async () => {
        if (window.openai?.requestClose) {
          await window.openai.requestClose();
        }
      },
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private sendNotification(method: string, params: unknown): void {
    if (!this.app) {
      console.warn(`[${this.config.name}] Cannot send notification before connection`);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.notification({ method, params } as any);
  }

  private setState(partial: Partial<HostClientState>): void {
    const prev = this.state;
    this.state = { ...this.state, ...partial };
    this.notifyStateChange(this.state, prev);
  }

  private hasSubscribers(event: keyof HostClientEvents): boolean {
    return this.getSubscriberCount(event) > 0;
  }

  /**
   * Set up notification handlers on the App instance.
   *
   * Events are buffered if no subscribers exist yet. When a subscriber
   * is added via on(), buffered events are replayed immediately.
   *
   * For tool-triggered views, isReady is set after tool-result is received.
   * This ensures getInitialToolResult() has data when the app initializes.
   */
  private setupHandlers(): void {
    if (!this.app) return;

    this.app.ontoolinput = (params) => {
      console.debug(`[${this.config.name}] Received tool-input`, { args: params.arguments });
      const args = params.arguments || {};

      if (this.hasSubscribers("tool-input")) {
        this.emit("tool-input", args);
      } else {
        this.bufferedToolInput = args;
        console.debug(`[${this.config.name}] Buffered tool-input (no subscribers yet)`);
      }
    };

    this.app.ontoolresult = (params) => {
      console.log(`[${this.config.name}] ChatGPT MCP Apps: received tool-result`, {
        source: params.source,
        toolName: params.toolName,
        hasStructuredContent: !!params.structuredContent,
        isError: params.isError,
      });

      // ChatGPT may omit toolName in the notification; extract from structuredContent
      const sc = params.structuredContent as Record<string, unknown> | undefined;
      const resolvedToolName = (params.toolName as string | undefined)
        || (sc && typeof sc._toolName === "string" ? sc._toolName : undefined);

      const result: ToolResult = {
        content: this.extractTextContent(params.content),
        structuredContent: sc,
        isError: params.isError,
        source: params.source as "agent" | "ui",
        toolName: resolvedToolName,
      };

      // ChatGPT sends source as undefined/null; treat missing source as "agent"
      const isAgentSource = !params.source || params.source === "agent";
      console.log(`[${this.config.name}] ChatGPT MCP Apps: tool-result gate check`, {
        sourceRaw: params.source,
        sourceType: typeof params.source,
        isAgentSource,
        initialToolResultIsNull: this.initialToolResult === null,
        hasReceivedToolResult: this.hasReceivedToolResult,
        triggeredByTool: this.triggeredByTool,
        isReady: this.state.isReady,
      });
      if (this.initialToolResult === null && isAgentSource) {
        this.initialToolResult = result;
        if (!this.hasReceivedToolResult) {
          this.hasReceivedToolResult = true;
          if (this.triggeredByTool && !this.state.isReady) {
            console.log(`[${this.config.name}] ChatGPT MCP Apps: setting isReady=true (tool-result received)`);
            this.setState({ isReady: true });
          }
        }
      }

      if (this.hasSubscribers("tool-result")) {
        this.emit("tool-result", result);
      } else {
        this.bufferedToolResult = result;
        console.log(`[${this.config.name}] ChatGPT MCP Apps: buffered tool-result (no subscribers yet)`);
      }
    };

    this.app.onhostcontextchanged = (params) => {
      const ctx = params as HostContext;
      console.debug(`[${this.config.name}] Host context changed`, {
        theme: ctx.theme,
        displayMode: ctx.displayMode,
      });

      if (this.hostContext) {
        this.hostContext = { ...this.hostContext, ...ctx };
      } else {
        this.hostContext = ctx;
      }

      this.applyHostContext(ctx);
      this.setState({});
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
   * For user-triggered views: Sets isReady immediately after connection.
   * For tool-triggered views: Waits for tool-result before setting isReady.
   * This ensures getInitialToolResult() has data when the app initializes.
   *
   * Events that arrive before React subscribes are buffered and replayed.
   */
  /**
   * Listener that normalizes ChatGPT's postMessage responses before they
   * reach the ext-apps Zod validation. ChatGPT may send hostContext.toolInfo.id
   * as null, but the MCP Apps schema expects string | number.
   */
  private patchListener: ((event: MessageEvent) => void) | null = null;

  private installMessagePatch(): void {
    this.patchListener = (event: MessageEvent) => {
      try {
        const toolInfo = event.data?.result?.hostContext?.toolInfo;
        if (toolInfo && typeof toolInfo.id !== "string" && typeof toolInfo.id !== "number") {
          toolInfo.id = String(toolInfo.id ?? "");
        }
      } catch {
        // Ignore non-matching messages
      }
    };
    window.addEventListener("message", this.patchListener, true);
  }

  private removeMessagePatch(): void {
    if (this.patchListener) {
      window.removeEventListener("message", this.patchListener, true);
      this.patchListener = null;
    }
  }

  private async initiateConnection(): Promise<void> {
    if (!this.app) return;

    try {
      console.log(`[${this.config.name}] ChatGPT MCP Apps: creating PostMessageTransport...`);

      // Install patch before transport to normalize ChatGPT's responses
      this.installMessagePatch();

      const transport = new PostMessageTransport(window.parent, window.parent);

      console.log(`[${this.config.name}] ChatGPT MCP Apps: calling app.connect() — waiting for host handshake...`);
      await this.app.connect(transport);

      const hostContext = this.app.getHostContext() as HostContext | null;
      console.log(`[${this.config.name}] ChatGPT MCP Apps: handshake complete`, {
        theme: hostContext?.theme,
        userAgent: hostContext?.userAgent,
        triggeredBy: hostContext?.openContext?.triggeredBy,
        hasWidgetState: !!hostContext?.widgetState,
      });

      if (hostContext) {
        this.hostContext = hostContext;
        this.applyHostContext(hostContext);

        // ChatGPT doesn't send openContext.triggeredBy or reliable tool-result
        // notifications, so we never gate isReady on tool-result for ChatGPT.
        const isChatGpt = hostContext.userAgent?.toLowerCase()?.startsWith("chatgpt");
        const triggeredBy = hostContext.openContext?.triggeredBy;

        if (isChatGpt) {
          this.triggeredByTool = false;
        } else {
          this.triggeredByTool = triggeredBy !== "user" && triggeredBy !== "restore";
        }

        console.log(`[${this.config.name}] ChatGPT MCP Apps: triggeredByTool=${this.triggeredByTool}, userAgent=${hostContext.userAgent}`);

        if (hostContext.widgetState) {
          this.setState({ widgetState: hostContext.widgetState });
          this.emit("widget-state-change", hostContext.widgetState);
        }
      }

      // Set isReady immediately unless waiting for tool-result
      if (!this.triggeredByTool) {
        console.log(`[${this.config.name}] ChatGPT MCP Apps: setting isReady=true`);
        this.setState({ isReady: true });
      } else {
        console.log(`[${this.config.name}] ChatGPT MCP Apps: waiting for tool-result before setting isReady`);
      }
    } catch (error: unknown) {
      const zodIssues = error && typeof error === "object" && "issues" in error
        ? (error as { issues: unknown[] }).issues
        : null;
      console.error(`[${this.config.name}] ChatGPT MCP Apps: connection FAILED`, {
        error,
        zodIssues: zodIssues ? JSON.stringify(zodIssues, null, 2) : "N/A",
      });
    }
  }

  private applyHostContext(context: HostContext): void {
    if (context.theme) {
      applyDocumentTheme(context.theme);
      this.emitMcpEvent("theme-change", context.theme);
    }

    if (context.styles?.variables) {
      applyHostStyleVariables(context.styles.variables as Parameters<typeof applyHostStyleVariables>[0]);
    }

    if (context.styles?.css?.fonts) {
      applyHostFonts(context.styles.css.fonts);
    }

    if (context.experimental?.styles?.variables) {
      this.applyExperimentalStyles(context.experimental.styles.variables);
    }
  }

  private applyExperimentalStyles(styles: Record<string, string | undefined>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    }
  }

  private extractTextContent(
    content?: Array<{ type: string; text?: string }>
  ): Array<{ type: string; text: string }> | undefined {
    return content
      ?.filter((item): item is { type: "text"; text: string } => item.type === "text")
      .map((item) => ({ type: item.type, text: item.text }));
  }
}

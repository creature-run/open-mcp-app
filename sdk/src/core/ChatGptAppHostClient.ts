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
 * OpenAI bridge interface exposed by ChatGPT Apps SDK.
 * Available on `window.openai` when running inside ChatGPT.
 */
interface OpenAIBridge {
  toolOutput?: Record<string, unknown>;
  widgetState?: WidgetState;
  setWidgetState?: (state: WidgetState) => void;
  callTool?: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{
    structuredContent?: Record<string, unknown>;
    content?: Array<{ type: string; text?: string }>;
  }>;
  requestDisplayMode?: (args: { mode: string }) => Promise<{ mode: string }>;
}

declare global {
  interface Window {
    openai?: OpenAIBridge;
  }
}

/**
 * ChatGPT Apps host client implementation.
 *
 * Bridges the ChatGPT Apps SDK (`window.openai`) to provide a consistent
 * interface with the MCP Apps host client. Handles initial data processing,
 * globals updates, and widget state synchronization.
 */
export class ChatGptAppHostClient extends Subscribable implements HostClient {
  // ============================================================================
  // Private Properties
  // ============================================================================

  private state: HostClientState = {
    isReady: false,
    environment: "chatgpt",
    widgetState: null,
  };
  private config: HostClientConfig;
  private connected = false;
  private hasProcessedInitialData = false;
  private globalsHandler: ((event: Event) => void) | null = null;
  private lastToolOutputJson: string | null = null;
  private lastWidgetStateJson: string | null = null;

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
   * Connect to the ChatGPT host.
   *
   * Processes initial data from `window.openai` and sets up a listener
   * for subsequent `openai:set_globals` events.
   */
  connect(): void {
    if (this.connected) return;
    this.connected = true;

    this.processInitialData();
    this.setupGlobalsListener();
  }

  /**
   * Disconnect from the host.
   *
   * Removes the globals event listener and cleanup.
   */
  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;

    if (this.globalsHandler) {
      window.removeEventListener("openai:set_globals", this.globalsHandler);
      this.globalsHandler = null;
    }
  }

  /**
   * Call a tool on the MCP server via the ChatGPT bridge.
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Tool result with content and structuredContent
   */
  async callTool<T = Record<string, unknown>>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    const openai = window.openai;

    if (!openai?.callTool) {
      throw new Error("ChatGPT bridge not available");
    }

    const response = await openai.callTool(toolName, args);

    const result: ToolResult<T> = {
      structuredContent: response?.structuredContent as T,
      content: response?.content?.map((c) => ({
        type: c.type,
        text: c.text || "",
      })),
      source: "ui",
    };

    this.emit("tool-result", result as ToolResult);
    return result;
  }

  /**
   * Send a notification to the host.
   *
   * No-op on ChatGPT — notifications are not supported.
   */
  sendNotification(_method: string, _params: unknown): void {
    // No-op on ChatGPT
  }

  /**
   * Set widget state and sync with the ChatGPT host.
   *
   * @param state - New widget state (or null to clear)
   */
  setWidgetState(state: WidgetState | null): void {
    this.setState({ widgetState: state });

    if (window.openai?.setWidgetState) {
      // Pass empty object when clearing state (ChatGPT may not support null)
      window.openai.setWidgetState(state ?? {});
    }

    this.emit("widget-state-change", state);
  }

  /**
   * Set the pip/widget title displayed in the host UI.
   *
   * No-op on ChatGPT — title updates are not supported.
   *
   * @param _title - The new title to display (ignored)
   */
  setTitle(_title: string): void {
    // No-op on ChatGPT
  }

  /**
   * Log a message to the console.
   *
   * ChatGPT doesn't have a DevConsole, so logs go to browser console only.
   * This provides API parity with McpAppHostClient.
   *
   * @param level - Log severity level
   * @param message - Log message
   * @param data - Optional structured data
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
    console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
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
   * Process initial data from `window.openai`.
   *
   * Called once on connect to handle any tool output or widget state
   * that was set before the client connected.
   */
  private processInitialData(): void {
    if (this.hasProcessedInitialData) return;

    const openai = window.openai;
    if (!openai) {
      console.warn("[SDK] window.openai not available");
      return;
    }

    this.hasProcessedInitialData = true;
    this.setState({ isReady: true });

    if (openai.toolOutput) {
      this.emit("tool-input", openai.toolOutput);
      this.emit("tool-result", { structuredContent: openai.toolOutput });
    }

    if (openai.widgetState) {
      this.setState({ widgetState: openai.widgetState });
      this.emit("widget-state-change", openai.widgetState);
    }
  }

  /**
   * Set up listener for `openai:set_globals` events.
   *
   * ChatGPT dispatches this event when tool output or widget state
   * changes after initial load. Uses JSON comparison to prevent
   * infinite loops from unchanged data.
   */
  private setupGlobalsListener(): void {
    this.globalsHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        globals?: {
          toolOutput?: Record<string, unknown>;
          widgetState?: WidgetState;
        };
      }>;
      const globals = customEvent.detail?.globals;

      if (globals?.toolOutput) {
        const toolOutputJson = JSON.stringify(globals.toolOutput);
        if (toolOutputJson !== this.lastToolOutputJson) {
          this.lastToolOutputJson = toolOutputJson;
          this.emit("tool-input", globals.toolOutput);
          this.emit("tool-result", { structuredContent: globals.toolOutput });
        }
      }

      if (globals?.widgetState !== undefined) {
        const widgetStateJson = JSON.stringify(globals.widgetState);
        if (widgetStateJson !== this.lastWidgetStateJson) {
          this.lastWidgetStateJson = widgetStateJson;
          this.setState({ widgetState: globals.widgetState });
          this.emit("widget-state-change", globals.widgetState);
        }
      }
    };

    window.addEventListener("openai:set_globals", this.globalsHandler, { passive: true });
  }

  /**
   * Request a display mode change from the ChatGPT host.
   *
   * @param params - Display mode to request
   * @returns The resulting display mode
   */
  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    const openai = window.openai;

    if (openai?.requestDisplayMode) {
      const result = await openai.requestDisplayMode({ mode: params.mode });
      return { mode: result.mode as DisplayMode };
    }

    return { mode: params.mode };
  }
}

import { Subscribable } from "./Subscribable.js";
import type {
  DisplayMode,
  BaseHostClient,
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
 * ChatGPT Apps base host client implementation.
 *
 * Bridges the ChatGPT Apps SDK (`window.openai`) to provide a spec-compliant interface.
 * Handles initial data processing, globals updates, and widget state synchronization.
 */
export class ChatGptBaseHostClient extends Subscribable implements BaseHostClient {
  // ============================================================================
  // Private Properties
  // ============================================================================

  private state: HostClientState = {
    isReady: false,
    environment: "chatgpt",
    widgetState: null,
  };
  protected config: HostClientConfig;
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
   * Set widget state and sync with the ChatGPT host.
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
   * Log a message to the console.
   *
   * ChatGPT doesn't have a DevConsole, so logs go to browser console only.
   */
  log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log";
    console[consoleMethod](`[${this.config.name}]`, message, data ?? "");
  }

  /**
   * Request a display mode change from the ChatGPT host.
   */
  async requestDisplayMode(params: { mode: DisplayMode }): Promise<{ mode: DisplayMode }> {
    const openai = window.openai;

    if (openai?.requestDisplayMode) {
      const result = await openai.requestDisplayMode({ mode: params.mode });
      return { mode: result.mode as DisplayMode };
    }

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
}

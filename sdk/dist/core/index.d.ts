export { applyDocumentTheme, applyHostFonts, applyHostStyleVariables, getDocumentTheme } from '@modelcontextprotocol/ext-apps';

/**
 * Core types for the MCP SDK.
 * These are framework-agnostic and shared between vanilla JS and React.
 */
/**
 * Environment types for host detection.
 */
type Environment = "chatgpt" | "mcp-apps" | "standalone";
/**
 * Display modes for UI resources.
 * - "inline": Embedded within the conversation flow
 * - "pip": Picture-in-picture floating panel
 * - "fullscreen": Full-screen overlay
 */
type DisplayMode = "inline" | "pip" | "fullscreen";
/**
 * Log severity levels matching MCP protocol LoggingLevel.
 * These are displayed in the host's DevConsole with appropriate colors.
 */
type LogLevel = "debug" | "info" | "notice" | "warning" | "error";
/**
 * Structured widget state format (ChatGPT-compatible).
 * Allows separating model-visible content from private UI state.
 */
interface StructuredWidgetState {
    /** Content visible to the AI model on follow-up turns */
    modelContent?: string | Record<string, unknown> | null;
    /** UI-only state, hidden from model */
    privateContent?: Record<string, unknown> | null;
    /** File IDs for images the model can see */
    imageIds?: string[];
}
/**
 * Widget state can be structured (with modelContent/privateContent)
 * or a simple key-value object.
 */
type WidgetState = StructuredWidgetState | Record<string, unknown>;
/**
 * Tool call result structure.
 */
interface ToolResult<T = Record<string, unknown>> {
    content?: Array<{
        type: string;
        text: string;
    }>;
    structuredContent?: T;
    isError?: boolean;
    source?: "agent" | "ui";
}
/**
 * Host context sent from MCP Apps host.
 * Follows MCP Apps spec with Creature extensions via [key: string]: unknown.
 */
interface HostContext {
    theme?: "light" | "dark";
    styles?: {
        variables?: Record<string, string>;
    };
    displayMode?: DisplayMode;
    availableDisplayModes?: DisplayMode[];
    viewport?: {
        width: number;
        height: number;
    };
    platform?: string;
    /**
     * Widget state restored from previous widget instance.
     * Creature extension - passed via hostContext on ui/initialize.
     */
    widgetState?: WidgetState;
}
/**
 * Configuration for creating a host client.
 */
interface HostClientConfig {
    /** Name of the client (for protocol handshake) */
    name: string;
    /** Version of the client */
    version: string;
}
/**
 * State managed by the host client.
 */
interface HostClientState {
    /** Whether the host connection is ready */
    isReady: boolean;
    /** The detected environment */
    environment: Environment;
    /** Current widget state */
    widgetState: WidgetState | null;
}
/**
 * Event handlers that can be registered on the host client.
 */
interface HostClientEvents {
    /** Called when tool input is received (before execution) */
    "tool-input": (args: Record<string, unknown>) => void;
    /** Called when tool result is received */
    "tool-result": (result: ToolResult) => void;
    /** Called when theme changes (MCP Apps only) */
    "theme-change": (theme: "light" | "dark") => void;
    /** Called when host requests teardown (MCP Apps only) */
    teardown: () => Promise<void> | void;
    /** Called when widget state changes (restored or updated) */
    "widget-state-change": (widgetState: WidgetState | null) => void;
}
/**
 * Listener for state changes.
 */
type StateListener = (state: HostClientState, prevState: HostClientState) => void;
/**
 * Host client interface.
 * Implemented by McpAppHostClient and ChatGptAppHostClient.
 */
interface HostClient {
    /** Get current state */
    getState(): HostClientState;
    /** Subscribe to state changes. Returns unsubscribe function. */
    subscribe(listener: StateListener): () => void;
    /** Call a tool on the MCP server */
    callTool<T = Record<string, unknown>>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;
    /** Send a notification to the host (MCP Apps only, no-op on ChatGPT) */
    sendNotification(method: string, params: unknown): void;
    /** Set widget state */
    setWidgetState(state: WidgetState | null): void;
    /**
     * Request a display mode change from the host.
     *
     * The host may refuse or coerce the request (e.g., "pip" → "fullscreen" on mobile).
     * Always check `availableDisplayModes` in host context before calling, and handle
     * the returned mode differing from the requested mode.
     *
     * @param params - Object containing the requested display mode
     * @returns Promise resolving to the actual display mode granted by the host
     */
    requestDisplayMode(params: {
        mode: DisplayMode;
    }): Promise<{
        mode: DisplayMode;
    }>;
    /**
     * Send a log message to the host's DevConsole.
     *
     * Logs are sent via the MCP protocol's `notifications/message` notification
     * and displayed in the host's unified log viewer alongside server logs.
     *
     * @param level - Log severity level
     * @param message - Log message
     * @param data - Optional structured data to include
     */
    log(level: LogLevel, message: string, data?: Record<string, unknown>): void;
    /** Register an event handler. Returns unsubscribe function. */
    on<K extends keyof HostClientEvents>(event: K, handler: HostClientEvents[K]): () => void;
    /** Start listening for host messages */
    connect(): void;
    /** Stop listening for host messages */
    disconnect(): void;
}
/**
 * WebSocket connection status.
 */
type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";
/**
 * Configuration for creating a WebSocket client.
 */
interface WebSocketClientConfig<TReceive = unknown> {
    /** Called when a message is received */
    onMessage?: (message: TReceive) => void;
    /** Called when connection status changes */
    onStatusChange?: (status: WebSocketStatus, error?: string) => void;
    /** Whether to auto-reconnect on disconnect (default: true) */
    reconnect?: boolean;
    /** Base interval for reconnection attempts in ms (default: 1000) */
    reconnectInterval?: number;
}
/**
 * WebSocket client interface.
 */
interface WebSocketClient<TSend = unknown, TReceive = unknown> {
    /** Current connection status */
    readonly status: WebSocketStatus;
    /** Error message if status is "error" */
    readonly error: string | undefined;
    /** Connect to the WebSocket server */
    connect(): void;
    /** Disconnect from the WebSocket server */
    disconnect(): void;
    /** Send a message to the server */
    send(message: TSend): void;
}

declare abstract class Subscribable {
    private stateListeners;
    private eventHandlers;
    subscribe(listener: StateListener): () => void;
    on<K extends keyof HostClientEvents>(event: K, handler: HostClientEvents[K]): () => void;
    protected notifyStateChange(state: HostClientState, prevState: HostClientState): void;
    protected emit<K extends keyof HostClientEvents>(event: K, ...args: Parameters<HostClientEvents[K]>): void;
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
}

/**
 * MCP Apps host client implementation.
 *
 * Wraps the official MCP Apps SDK `App` class to provide a consistent interface
 * with the ChatGPT host client. Handles the protocol handshake, tool calls,
 * notifications, and automatic style/theme application.
 */
declare class McpAppHostClient extends Subscribable implements HostClient {
    private state;
    private config;
    private app;
    private connected;
    constructor(config: HostClientConfig);
    /**
     * Get the current client state.
     */
    getState(): HostClientState;
    /**
     * Connect to the MCP Apps host.
     *
     * Creates the App instance, registers notification handlers, and initiates
     * the protocol handshake. The host will receive `ui/initialize` and respond
     * with host context including theme, styles, and widgetState.
     */
    connect(): void;
    /**
     * Disconnect from the host.
     *
     * Cleans up the App instance and resets state.
     */
    disconnect(): void;
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
    callTool<T = Record<string, unknown>>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;
    /**
     * Send a notification to the host.
     *
     * Sends a notification via the ext-apps SDK transport. Can be used for both
     * spec-compliant and custom (Creature-specific) notifications.
     *
     * @param method - Notification method name
     * @param params - Notification parameters
     */
    sendNotification(method: string, params: unknown): void;
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
    setWidgetState(state: WidgetState | null): void;
    requestDisplayMode(params: {
        mode: DisplayMode;
    }): Promise<{
        mode: DisplayMode;
    }>;
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
    log(level: LogLevel, message: string, data?: Record<string, unknown>): void;
    /**
     * Update internal state and notify listeners.
     */
    private setState;
    /**
     * Set up notification handlers on the App instance.
     *
     * Maps the official SDK's callback pattern to our event emitter pattern,
     * allowing consumers to use `.on("tool-result", ...)` etc.
     */
    private setupHandlers;
    /**
     * Initiate connection using PostMessageTransport.
     *
     * The SDK's App.connect() handles the protocol handshake correctly:
     * the guest (App) sends `ui/initialize` to the host.
     */
    private initiateConnection;
    /**
     * Apply theme, styles, and fonts from host context.
     * Also applies Creature-specific extension styles if present.
     */
    private applyHostContext;
    /**
     * Apply Creature-specific CSS variables to the document root.
     * These are host extensions sent outside the spec-validated styles.variables path.
     */
    private applyCreatureStyles;
    /**
     * Extract text content from SDK result content array.
     * Filters to only include text items since our ToolResult type expects text.
     */
    private extractTextContent;
}

/**
 * OpenAI bridge interface exposed by ChatGPT Apps SDK.
 * Available on `window.openai` when running inside ChatGPT.
 */
interface OpenAIBridge {
    toolOutput?: Record<string, unknown>;
    widgetState?: WidgetState;
    setWidgetState?: (state: WidgetState) => void;
    callTool?: (name: string, args: Record<string, unknown>) => Promise<{
        structuredContent?: Record<string, unknown>;
        content?: Array<{
            type: string;
            text?: string;
        }>;
    }>;
    requestDisplayMode?: (args: {
        mode: string;
    }) => Promise<{
        mode: string;
    }>;
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
declare class ChatGptAppHostClient extends Subscribable implements HostClient {
    private state;
    private config;
    private connected;
    private hasProcessedInitialData;
    private globalsHandler;
    constructor(config: HostClientConfig);
    /**
     * Get the current client state.
     */
    getState(): HostClientState;
    /**
     * Connect to the ChatGPT host.
     *
     * Processes initial data from `window.openai` and sets up a listener
     * for subsequent `openai:set_globals` events.
     */
    connect(): void;
    /**
     * Disconnect from the host.
     *
     * Removes the globals event listener.
     */
    disconnect(): void;
    /**
     * Call a tool on the MCP server via the ChatGPT bridge.
     *
     * @param toolName - Name of the tool to call
     * @param args - Arguments to pass to the tool
     * @returns Tool result with content and structuredContent
     */
    callTool<T = Record<string, unknown>>(toolName: string, args: Record<string, unknown>): Promise<ToolResult<T>>;
    /**
     * Send a notification to the host.
     *
     * No-op on ChatGPT — notifications are not supported.
     */
    sendNotification(_method: string, _params: unknown): void;
    /**
     * Set widget state and sync with the ChatGPT host.
     *
     * @param state - New widget state (or null to clear)
     */
    setWidgetState(state: WidgetState | null): void;
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
    log(level: LogLevel, message: string, data?: Record<string, unknown>): void;
    /**
     * Update internal state and notify listeners.
     */
    private setState;
    /**
     * Process initial data from `window.openai`.
     *
     * Called once on connect to handle any tool output or widget state
     * that was set before the client connected.
     */
    private processInitialData;
    /**
     * Set up listener for `openai:set_globals` events.
     *
     * ChatGPT dispatches this event when tool output or widget state
     * changes after initial load.
     */
    private setupGlobalsListener;
    /**
     * Request a display mode change from the ChatGPT host.
     *
     * @param params - Display mode to request
     * @returns The resulting display mode
     */
    requestDisplayMode(params: {
        mode: DisplayMode;
    }): Promise<{
        mode: DisplayMode;
    }>;
}

/**
 * Detect the current host environment.
 *
 * Used to auto-select the appropriate host client implementation:
 * - "chatgpt": Running inside ChatGPT's widget system
 * - "mcp-apps": Running inside an MCP Apps host (iframe with parent)
 * - "standalone": Running outside any host environment
 *
 * @returns The detected environment
 */
declare function detectEnvironment(): Environment;

/**
 * Create a WebSocket client with automatic reconnection.
 *
 * @param url - WebSocket server URL
 * @param config - Client configuration
 * @returns WebSocket client instance
 */
declare function createWebSocket<TSend = unknown, TReceive = unknown>(url: string, config?: WebSocketClientConfig<TReceive>): WebSocketClient<TSend, TReceive>;

declare function createHost(config: HostClientConfig): HostClient;

export { ChatGptAppHostClient, type DisplayMode, type Environment, type HostClient, type HostClientConfig, type HostClientEvents, type HostClientState, type HostContext, type LogLevel, McpAppHostClient, type StateListener, type StructuredWidgetState, type ToolResult, type WebSocketClient, type WebSocketClientConfig, type WebSocketStatus, type WidgetState, createHost, createWebSocket, detectEnvironment };

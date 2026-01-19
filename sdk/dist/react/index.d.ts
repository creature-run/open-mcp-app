import { ToolResult, WidgetState, Environment, DisplayMode, WebSocketStatus } from '../core/index.js';
export { ChatGptAppHostClient, HostClient, HostClientConfig, HostClientEvents, HostClientState, HostContext, LogLevel, McpAppHostClient, StructuredWidgetState, WebSocketClient, WebSocketClientConfig, createHost, createWebSocket, detectEnvironment } from '../core/index.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { applyDocumentTheme, applyHostFonts, applyHostStyleVariables, getDocumentTheme } from '@modelcontextprotocol/ext-apps';

interface UseHostConfig {
    name: string;
    version: string;
    onToolInput?: (args: Record<string, unknown>) => void;
    onToolResult?: (result: ToolResult) => void;
    onThemeChange?: (theme: "light" | "dark") => void;
    onTeardown?: () => Promise<void>;
    /** Called when widget state changes (restored from host or updated) */
    onWidgetStateChange?: (widgetState: WidgetState | null) => void;
}
/**
 * Logger interface with convenience methods for each log level.
 *
 * Provides both a default `log(message, data?)` method (logs at "info" level)
 * and explicit level methods: `debug()`, `info()`, `notice()`, `warn()`, `error()`.
 */
interface Logger {
    /**
     * Log a message at "info" level (default).
     * @param message - Log message
     * @param data - Optional structured data
     */
    (message: string, data?: Record<string, unknown>): void;
    /**
     * Log at "debug" level. Gray in DevConsole, typically hidden by default.
     */
    debug: (message: string, data?: Record<string, unknown>) => void;
    /**
     * Log at "info" level. Normal text color in DevConsole.
     */
    info: (message: string, data?: Record<string, unknown>) => void;
    /**
     * Log at "notice" level. Blue in DevConsole, for notable events.
     */
    notice: (message: string, data?: Record<string, unknown>) => void;
    /**
     * Log at "warning" level. Yellow in DevConsole.
     */
    warn: (message: string, data?: Record<string, unknown>) => void;
    /**
     * Log at "error" level. Red in DevConsole.
     */
    error: (message: string, data?: Record<string, unknown>) => void;
}
interface UseHostReturn {
    isReady: boolean;
    callTool: <T = Record<string, unknown>>(toolName: string, args: Record<string, unknown>) => Promise<ToolResult<T>>;
    sendNotification: (method: string, params: unknown) => void;
    environment: Environment;
    widgetState: WidgetState | null;
    setWidgetState: (state: WidgetState | null) => void;
    requestDisplayMode: (params: {
        mode: DisplayMode;
    }) => Promise<{
        mode: DisplayMode;
    }>;
    /**
     * Logger for sending messages to the host's DevConsole.
     *
     * @example
     * ```tsx
     * const { log } = useHost({ name: "my-app", version: "1.0.0" });
     *
     * // Default level (info)
     * log("User clicked button");
     *
     * // With data
     * log("Processing item", { itemId: 123 });
     *
     * // Specific levels
     * log.debug("Verbose debugging info");
     * log.info("General information");
     * log.notice("Notable event");
     * log.warn("Something looks off");
     * log.error("Something went wrong", { error: err.message });
     * ```
     */
    log: Logger;
}
interface UseToolResultReturn<T> {
    /** Structured data from tool result */
    data: T | null;
    /** Instance ID for this widget */
    instanceId: string | null;
    /** Title for PIP tab */
    title: string | null;
    /** Whether this is an error result */
    isError: boolean;
    /** Text content for AI context */
    text: string | null;
    /** Callback to handle tool result */
    onToolResult: (result: ToolResult) => void;
    /** Reset all state */
    reset: () => void;
}
interface UseWebSocketConfig<TReceive = unknown> {
    onMessage?: (message: TReceive) => void;
    enabled?: boolean;
}
interface UseWebSocketReturn<TSend = unknown> {
    status: WebSocketStatus;
    error: string | undefined;
    send: (message: TSend) => void;
}
interface CreatureIconProps {
    /** Whether the app is in dark mode */
    isDarkMode: boolean;
    /** Whether to show the eyes (default: true) */
    showEyes?: boolean;
    /** Whether to enable eye blinking animation (default: false) */
    enableBlink?: boolean;
    /** Width of the icon in pixels */
    width?: number;
    /** Height of the icon in pixels */
    height?: number;
    /** Optional className for additional styling */
    className?: string;
}

/**
 * React hook for connecting to an MCP Apps host.
 *
 * Creates a host client instance and manages its lifecycle. Automatically
 * connects on mount and disconnects on unmount. Uses refs for callbacks
 * to prevent reconnection loops when consumers pass inline functions.
 *
 * @param config - Configuration including app info and event handlers
 * @returns Current state and methods for interacting with the host
 *
 * @example
 * ```tsx
 * const { isReady, callTool, log } = useHost({
 *   name: "my-app",
 *   version: "1.0.0",
 *   onToolResult: (result) => setData(result.structuredContent),
 * });
 *
 * // Logging
 * log("User action"); // default info level
 * log.debug("Verbose info");
 * log.error("Something failed", { error: err.message });
 * ```
 */
declare function useHost(config: UseHostConfig): UseHostReturn;

/**
 * Hook to access tool result data.
 * Extracts data, instanceId, title, and error state from tool results.
 */
declare function useToolResult<T = Record<string, unknown>>(): UseToolResultReturn<T>;

declare function useWebSocket<TSend = unknown, TReceive = unknown>(url: string | undefined, config?: UseWebSocketConfig<TReceive>): UseWebSocketReturn<TSend>;

/**
 * CreatureIcon Component
 *
 * The Creature mascot icon with theme-aware colors.
 * Uses the main creature shape with optional eyes, adapting colors for dark/light mode.
 * Supports optional eye blinking animation at random intervals.
 */
declare function CreatureIcon({ isDarkMode, showEyes, enableBlink, width, height, className, }: CreatureIconProps): react_jsx_runtime.JSX.Element;

export { CreatureIcon, type CreatureIconProps, DisplayMode, Environment, type Logger, ToolResult, type UseHostConfig, type UseHostReturn, type UseToolResultReturn, type UseWebSocketConfig, type UseWebSocketReturn, WebSocketStatus, WidgetState, useHost, useToolResult, useWebSocket };

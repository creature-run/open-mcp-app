import { useSyncExternalStore, useEffect, useRef, useMemo, useState, useCallback } from "react";
import { createHost, detectEnvironment } from "../core/index.js";
import type { UnifiedHostClient, Environment, ToolResult, WidgetState } from "../core/index.js";
import type { UseHostConfig, UseHostReturn, Logger, ToolCallState, ToolCallTuple, ToolCallFunction } from "./types.js";
import { useHostClientOptional } from "./HostContext.js";

export { detectEnvironment };
export type { Environment };

/**
 * Initial state for a tool call.
 */
const INITIAL_TOOL_STATE: ToolCallState = {
  status: "idle",
  data: null,
  result: null,
  error: null,
  isError: false,
  text: null,
  title: null,
  instanceId: null,
};

/**
 * Extract metadata from a tool result's structuredContent.
 */
const extractResultMetadata = <T>(result: ToolResult<T>): {
  data: T | null;
  title: string | null;
  instanceId: string | null;
  text: string | null;
} => {
  const structured = result.structuredContent as (T & { title?: string; instanceId?: string }) | undefined;
  let data: T | null = null;
  let title: string | null = null;
  let instanceId: string | null = null;

  if (structured) {
    const { title: resultTitle, instanceId: resultInstanceId, ...rest } = structured;
    data = rest as T;
    if (resultTitle) title = resultTitle;
    if (resultInstanceId) instanceId = resultInstanceId;
  }

  const text = result.content?.[0]?.text ?? null;

  return { data, title, instanceId, text };
};

/**
 * React hook for connecting to an MCP Apps host.
 *
 * Can be used in two ways:
 *
 * 1. **With HostProvider** (recommended): Call `useHost()` with no arguments
 *    inside a component wrapped by `<HostProvider>`. The client is shared
 *    via context, and connection is managed by the provider.
 *
 * 2. **Standalone**: Pass config to create and manage your own client.
 *    The hook handles connection/disconnection automatically.
 *
 * @param config - Optional configuration. If omitted, uses HostProvider context.
 * @returns Current state and methods for interacting with the host
 *
 * @example With HostProvider (recommended)
 * ```tsx
 * // App.tsx
 * function App() {
 *   return (
 *     <HostProvider name="my-app" version="1.0.0">
 *       <MyWidget />
 *     </HostProvider>
 *   );
 * }
 *
 * // MyWidget.tsx
 * function MyWidget() {
 *   const { callTool, isReady, log, exp_widgetState } = useHost();
 *   const [widgetState, setWidgetState] = exp_widgetState();
 *   const [listTodos, listTodosData] = callTool("todos_list");
 *
 *   useEffect(() => {
 *     if (isReady) listTodos();
 *   }, [isReady, listTodos]);
 * }
 * ```
 *
 * @example Standalone (creates own client)
 * ```tsx
 * function MyApp() {
 *   const { isReady, callTool, log } = useHost({
 *     name: "my-app",
 *     version: "1.0.0",
 *   });
 * }
 * ```
 */
export function useHost(config?: UseHostConfig): UseHostReturn {
  // Check if we're inside a HostProvider
  const contextClient = useHostClientOptional();

  // Determine if we should use context or create our own client
  const useContext = !config && contextClient !== null;

  const clientRef = useRef<UnifiedHostClient | null>(null);

  if (!useContext) {
    // Standalone mode: create our own client
    if (!config) {
      throw new Error(
        "useHost() requires either a HostProvider wrapper or config argument. " +
        "Either wrap your app with <HostProvider name=\"...\" version=\"...\"> " +
        "or pass { name, version } to useHost()."
      );
    }
    if (!clientRef.current) {
      clientRef.current = createHost({ name: config.name, version: config.version });
    }
  }

  // Use context client if available, otherwise our own
  const client = useContext ? contextClient! : clientRef.current!;

  // ============================================================================
  // Tool Call State Management
  // ============================================================================

  /**
   * Map of tool name -> current state for that tool.
   * Using useState to trigger re-renders when tool states change.
   */
  const [toolStates, setToolStates] = useState<Map<string, ToolCallState>>(
    () => new Map()
  );

  /**
   * Ref to store stable run functions for each tool.
   * This prevents creating new function identities on every render.
   */
  const toolFunctionsRef = useRef<Map<string, ToolCallFunction>>(new Map());

  /**
   * Update the state for a specific tool.
   */
  const updateToolState = useCallback(
    <T>(toolName: string, newState: Partial<ToolCallState<T>>) => {
      setToolStates((prev) => {
        const current = (prev.get(toolName) ?? INITIAL_TOOL_STATE) as ToolCallState<T>;
        const updated = { ...current, ...newState };
        const next = new Map(prev);
        next.set(toolName, updated as ToolCallState);
        return next;
      });
    },
    []
  );

  /**
   * Get or create a stable tool call function for the given tool name.
   */
  const getOrCreateToolFunction = useCallback(
    <T>(toolName: string): ToolCallFunction<T> => {
      const existing = toolFunctionsRef.current.get(toolName);
      if (existing) {
        return existing as ToolCallFunction<T>;
      }

      const runFn: ToolCallFunction<T> = async (args: Record<string, unknown> = {}) => {
        // Set loading state
        updateToolState<T>(toolName, {
          status: "loading",
          error: null,
        });

        try {
          const result = await client.callTool<T>(toolName, args);
          const { data, title, instanceId, text } = extractResultMetadata<T>(result);

          // Update state with success
          updateToolState<T>(toolName, {
            status: "success",
            data,
            result,
            error: null,
            isError: result.isError ?? false,
            text,
            title,
            instanceId,
          });

          return result;
        } catch (err) {
          // Update state with error
          updateToolState<T>(toolName, {
            status: "error",
            error: err,
            isError: true,
          });

          throw err;
        }
      };

      toolFunctionsRef.current.set(toolName, runFn as ToolCallFunction);
      return runFn;
    },
    [client, updateToolState]
  );

  /**
   * Factory function that returns a tuple of [runFn, state] for a tool.
   */
  const callTool = useCallback(
    <T = Record<string, unknown>>(toolName: string): ToolCallTuple<T> => {
      const runFn = getOrCreateToolFunction<T>(toolName);
      const currentState = (toolStates.get(toolName) ?? INITIAL_TOOL_STATE) as ToolCallState<T>;
      return [runFn, currentState];
    },
    [getOrCreateToolFunction, toolStates]
  );

  // ============================================================================
  // Logger
  // ============================================================================

  /**
   * Create a logger function with convenience methods.
   * The base function logs at "info" level by default.
   */
  const log = useMemo(() => {
    const logFn = (message: string, data?: Record<string, unknown>) => {
      client.log("info", message, data);
    };

    // Attach convenience methods for each log level
    logFn.debug = (message: string, data?: Record<string, unknown>) => {
      client.log("debug", message, data);
    };
    logFn.info = (message: string, data?: Record<string, unknown>) => {
      client.log("info", message, data);
    };
    logFn.notice = (message: string, data?: Record<string, unknown>) => {
      client.log("notice", message, data);
    };
    logFn.warn = (message: string, data?: Record<string, unknown>) => {
      client.log("warning", message, data);
    };
    logFn.error = (message: string, data?: Record<string, unknown>) => {
      client.log("error", message, data);
    };

    return logFn as Logger;
  }, [client]);

  // ============================================================================
  // Other Methods
  // ============================================================================

  const requestDisplayMode = useMemo(
    () => client.requestDisplayMode.bind(client),
    [client]
  );

  /**
   * Wrap exp APIs for stable references.
   */
  const exp = useMemo(
    () => ({
      setWidgetState: client.exp.setWidgetState.bind(client.exp),
      setTitle: client.exp.setTitle.bind(client.exp),
      updateModelContext: client.exp.updateModelContext.bind(client.exp),
      sendNotification: client.exp.sendNotification.bind(client.exp),
      getInstanceId: client.exp.getInstanceId.bind(client.exp),
      supportsMultiInstance: client.exp.supportsMultiInstance.bind(client.exp),
      getInitialToolResult: client.exp.getInitialToolResult.bind(client.exp),
      sendFollowUpMessage: client.exp.sendFollowUpMessage.bind(client.exp),
      requestModal: client.exp.requestModal.bind(client.exp),
      requestClose: client.exp.requestClose.bind(client.exp),
    }),
    [client]
  );

  // ============================================================================
  // Widget State Tuple
  // ============================================================================

  const state = useSyncExternalStore(
    (onStoreChange) => client.subscribe(onStoreChange),
    () => client.getState(),
    () => client.getState()
  );

  /**
   * Stable setter for widget state.
   * Using useCallback to ensure stable identity across renders.
   */
  const setWidgetState = useCallback(
    <T extends WidgetState = WidgetState>(newState: T | null) => {
      client.exp.setWidgetState(newState);
    },
    [client]
  );

  /**
   * Returns a useState-like tuple for widget state.
   * The setter is stable and won't cause infinite render loops.
   */
  const exp_widgetState = useCallback(
    <T extends WidgetState = WidgetState>(): [T | null, (s: T | null) => void] => {
      const currentState = state.widgetState as T | null;
      return [currentState, setWidgetState as (s: T | null) => void];
    },
    [state.widgetState, setWidgetState]
  );

  /**
   * Subscribe to tool results from external sources (e.g., agent calls).
   * Returns an unsubscribe function.
   */
  const onToolResult = useCallback(
    (callback: (result: ToolResult) => void): (() => void) => {
      return client.on("tool-result", callback);
    },
    [client]
  );

  // ============================================================================
  // Lifecycle & Event Handlers
  // ============================================================================

  /**
   * Store callbacks in refs to prevent reconnection loops.
   * Consumers often pass inline functions which would change identity on every render,
   * but we don't want that to trigger reconnection.
   */
  const callbacksRef = useRef({
    onToolInput: config?.onToolInput,
    onToolResult: config?.onToolResult,
    onThemeChange: config?.onThemeChange,
    onTeardown: config?.onTeardown,
    onWidgetStateChange: config?.onWidgetStateChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onToolInput: config?.onToolInput,
      onToolResult: config?.onToolResult,
      onThemeChange: config?.onThemeChange,
      onTeardown: config?.onTeardown,
      onWidgetStateChange: config?.onWidgetStateChange,
    };
  });

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Subscribe to events (works for both context and standalone mode)
    unsubs.push(
      client.on("tool-input", (args) => callbacksRef.current.onToolInput?.(args))
    );
    unsubs.push(
      client.on("tool-result", (result) => callbacksRef.current.onToolResult?.(result))
    );
    unsubs.push(
      client.on("theme-change", (theme) => callbacksRef.current.onThemeChange?.(theme))
    );
    unsubs.push(
      client.on("teardown", () => callbacksRef.current.onTeardown?.())
    );
    unsubs.push(
      client.on("widget-state-change", (widgetState) =>
        callbacksRef.current.onWidgetStateChange?.(widgetState)
      )
    );

    // Only manage connection in standalone mode (not when using HostProvider)
    if (!useContext) {
      client.connect();
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      if (!useContext) {
        client.disconnect();
      }
    };
  }, [client, useContext]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    isReady: state.isReady,
    environment: state.environment,
    widgetState: state.widgetState,
    callTool,
    requestDisplayMode,
    log,
    hostContext: client.getHostContext(),
    // Experimental APIs (non-spec extensions)
    exp,
    exp_widgetState,
    // Tool result subscription
    onToolResult,
  };
};

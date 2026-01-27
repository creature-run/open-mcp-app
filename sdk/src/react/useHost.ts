import { useSyncExternalStore, useEffect, useRef, useMemo, useState } from "react";
import { createHost, detectEnvironment } from "../core/index.js";
import type { UnifiedHostClient, Environment, HostContext, AdapterKind } from "../core/index.js";
import type { UseHostConfig, UseHostReturn, Logger } from "./types.js";

export { detectEnvironment };
export type { Environment };

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
export function useHost(config: UseHostConfig): UseHostReturn {
  const clientRef = useRef<UnifiedHostClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = createHost({ name: config.name, version: config.version });
  }

  const client = clientRef.current;

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

  const boundMethods = useMemo(
    () => ({
      callTool: client.callTool.bind(client),
      sendNotification: client.sendNotification.bind(client),
      setWidgetState: client.setWidgetState.bind(client),
      requestDisplayMode: client.requestDisplayMode.bind(client),
    }),
    [client]
  );

  const state = useSyncExternalStore(
    (onStoreChange) => client.subscribe(onStoreChange),
    () => client.getState(),
    () => client.getState()
  );

  /**
   * Store callbacks in refs to prevent reconnection loops.
   * Consumers often pass inline functions which would change identity on every render,
   * but we don't want that to trigger reconnection.
   */
  const callbacksRef = useRef({
    onToolInput: config.onToolInput,
    onToolResult: config.onToolResult,
    onThemeChange: config.onThemeChange,
    onTeardown: config.onTeardown,
    onWidgetStateChange: config.onWidgetStateChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onToolInput: config.onToolInput,
      onToolResult: config.onToolResult,
      onThemeChange: config.onThemeChange,
      onTeardown: config.onTeardown,
      onWidgetStateChange: config.onWidgetStateChange,
    };
  });

  useEffect(() => {
    const unsubs: Array<() => void> = [];

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

    client.connect();

    return () => {
      unsubs.forEach((unsub) => unsub());
      client.disconnect();
    };
  }, [client]);

  return {
    isReady: state.isReady,
    environment: state.environment,
    widgetState: state.widgetState,
    callTool: boundMethods.callTool,
    sendNotification: boundMethods.sendNotification,
    setWidgetState: boundMethods.setWidgetState,
    requestDisplayMode: boundMethods.requestDisplayMode,
    log,
    // Host detection properties (may change after connection for MCP Apps)
    adapterKind: client.adapterKind,
    isCreature: client.isCreature,
    hostContext: client.getHostContext(),
  };
}

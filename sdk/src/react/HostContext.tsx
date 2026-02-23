/**
 * Host Context and Provider
 *
 * Provides the host client to child components via React context.
 * This enables experimental hooks like `useWidgetState` to access
 * the host without explicit prop drilling.
 */

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { createHost } from "../core/index.js";
import type { UnifiedHostClient, LogLevel } from "../core/index.js";

// ============================================================================
// Context
// ============================================================================

const HostContext = createContext<UnifiedHostClient | null>(null);

/**
 * Get the host client from context.
 *
 * @throws Error if used outside of HostProvider
 */
export function useHostClient(): UnifiedHostClient {
  const client = useContext(HostContext);
  if (!client) {
    throw new Error(
      "useHostClient must be used within a HostProvider. " +
      "Wrap your app with <HostProvider name=\"...\" version=\"...\">."
    );
  }
  return client;
}

/**
 * Get the host client from context, or null if not in a provider.
 * Useful for optional host features.
 */
export function useHostClientOptional(): UnifiedHostClient | null {
  return useContext(HostContext);
}

// ============================================================================
// Provider
// ============================================================================

export interface HostProviderProps {
  /** App name for the host client */
  name: string;
  /** App version for the host client */
  version: string;
  /** Child components */
  children: ReactNode;
  /**
   * Called when tool input is received.
   * Note: For tool results, use onToolResult in individual components.
   */
  onToolInput?: (args: Record<string, unknown>) => void;
  /** Called when theme changes (MCP Apps only) */
  onThemeChange?: (theme: "light" | "dark") => void;
  /** Called when host requests teardown (MCP Apps only) */
  onTeardown?: () => Promise<void> | void;
  /**
   * Capture browser `console.*` calls and `window.onerror`/`unhandledrejection`
   * events, routing them through the SDK's `log()` as `notifications/message`.
   *
   * Filters out `console.debug` by default (MCP transport noise).
   * Batches events and flushes every 2 seconds or on page unload.
   *
   * @default false
   */
  captureConsole?: boolean;
}

/**
 * Provides the host client to child components.
 *
 * Creates a single host client instance that is shared across all children.
 * The client connects on mount and disconnects on unmount.
 *
 * @example
 * ```tsx
 * import { HostProvider } from 'open-mcp-app/react';
 *
 * function App() {
 *   return (
 *     <HostProvider name="my-app" version="1.0.0">
 *       <MyWidget />
 *     </HostProvider>
 *   );
 * }
 * ```
 */
// ============================================================================
// Console Capture
// ============================================================================

const CONSOLE_LEVEL_MAP: Record<string, LogLevel> = {
  log: "info",
  info: "info",
  warn: "warning",
  error: "error",
};

const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER = 50;

/**
 * Intercepts browser console calls and error events, batching them
 * and flushing through the SDK's client.log() as notifications/message.
 *
 * Skips console.debug to avoid capturing MCP transport noise.
 */
function setupConsoleCapture(client: UnifiedHostClient): () => void {
  const originals: Partial<Record<string, (...args: unknown[]) => void>> = {};
  let buffer: Array<{ level: LogLevel; message: string }> = [];
  let destroyed = false;

  const flush = () => {
    if (buffer.length === 0 || !client.getState().isReady) return;
    const batch = buffer;
    buffer = [];
    for (const entry of batch) {
      try { client.log(entry.level, entry.message); } catch { /* never break */ }
    }
  };

  const enqueue = (level: LogLevel, message: string) => {
    if (destroyed) return;
    buffer.push({ level, message });
    if (buffer.length >= MAX_BUFFER) flush();
  };

  // Intercept console methods (skip debug — transport noise)
  if (typeof console !== "undefined") {
    for (const method of Object.keys(CONSOLE_LEVEL_MAP)) {
      const original = (console as unknown as Record<string, unknown>)[method];
      if (typeof original !== "function") continue;
      originals[method] = original as (...args: unknown[]) => void;

      (console as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
        (original as (...a: unknown[]) => void).call(console, ...args);
        const level = CONSOLE_LEVEL_MAP[method] ?? "info";
        const message = args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" ");
        enqueue(level, message);
      };
    }
  }

  // Global error handlers
  let onError: ((e: ErrorEvent) => void) | null = null;
  let onRejection: ((e: PromiseRejectionEvent) => void) | null = null;

  if (typeof window !== "undefined") {
    onError = (event: ErrorEvent) => {
      enqueue("error", event.message || "Unknown error");
    };
    onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      enqueue("error", reason instanceof Error ? reason.message : String(reason));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
  }

  const timer = setInterval(flush, FLUSH_INTERVAL_MS);

  return () => {
    if (destroyed) return;
    destroyed = true;
    clearInterval(timer);
    flush();
    for (const [method, original] of Object.entries(originals)) {
      if (original) (console as unknown as Record<string, unknown>)[method] = original;
    }
    if (typeof window !== "undefined") {
      if (onError) window.removeEventListener("error", onError);
      if (onRejection) window.removeEventListener("unhandledrejection", onRejection);
    }
  };
}

// ============================================================================
// Provider Component
// ============================================================================

export function HostProvider({
  name,
  version,
  children,
  onToolInput,
  onThemeChange,
  onTeardown,
  captureConsole,
}: HostProviderProps) {
  const clientRef = useRef<UnifiedHostClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = createHost({ name, version });
  }

  const client = clientRef.current;

  // Store callbacks in refs to prevent reconnection on callback changes
  const callbacksRef = useRef({ onToolInput, onThemeChange, onTeardown });
  useEffect(() => {
    callbacksRef.current = { onToolInput, onThemeChange, onTeardown };
  });

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    if (callbacksRef.current.onToolInput) {
      unsubs.push(
        client.on("tool-input", (args) => callbacksRef.current.onToolInput?.(args))
      );
    }

    unsubs.push(
      client.on("theme-change", (theme) => callbacksRef.current.onThemeChange?.(theme))
    );

    unsubs.push(
      client.on("teardown", () => callbacksRef.current.onTeardown?.())
    );

    client.connect();

    return () => {
      unsubs.forEach((unsub) => unsub());
      client.disconnect();
    };
  }, [client]);

  // Console capture — intercept browser console and route through SDK log()
  useEffect(() => {
    if (!captureConsole) return;
    return setupConsoleCapture(client);
  }, [client, captureConsole]);

  return <HostContext.Provider value={client}>{children}</HostContext.Provider>;
}

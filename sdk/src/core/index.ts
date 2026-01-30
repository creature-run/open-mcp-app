/**
 * Core Host Client Module
 *
 * Provides the unified host client factory and all related types.
 * This is the main entry point for client-side SDK usage.
 */

import { ChatGptHostClient } from "./clients/ChatGptHostClient.js";
import { McpAppsHostClient } from "./clients/McpAppsHostClient.js";
import { StandaloneHostClient } from "./clients/StandaloneHostClient.js";
import type { UnifiedHostClient, Environment, HostClientConfig } from "./types.js";

// ============================================================================
// Environment Detection
// ============================================================================

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
export const detectEnvironment = (): Environment => {
  if (typeof window === "undefined") {
    return "standalone";
  }

  if ("openai" in window && (window as { openai?: unknown }).openai) {
    return "chatgpt";
  }

  if (window.parent !== window) {
    return "mcp-apps";
  }

  return "standalone";
};

// ============================================================================
// Host Client Factory
// ============================================================================

/**
 * Create a host client for the detected environment.
 *
 * Automatically selects the appropriate client based on runtime detection:
 * - ChatGPT: Uses ChatGptHostClient (detects window.openai)
 * - MCP Apps: Uses McpAppsHostClient (detects iframe with parent)
 * - Standalone: Uses StandaloneHostClient for development/testing
 *
 * @param config - Configuration for the host client
 * @returns The appropriate host client for the environment
 *
 * @example
 * ```typescript
 * const host = createHost({ name: "my-app", version: "1.0.0" });
 * host.connect();
 *
 * // Call tools
 * const result = await host.callTool("get_todos", {});
 *
 * // Use experimental features (graceful degradation)
 * host.exp.setTitle("My Widget");
 * ```
 */
export const createHost = (config: HostClientConfig): UnifiedHostClient => {
  // 1. ChatGPT (most specific - has window.openai)
  if (ChatGptHostClient.detect()) {
    return ChatGptHostClient.create(config);
  }

  // 2. MCP Apps (iframe-based host)
  if (McpAppsHostClient.detect()) {
    return McpAppsHostClient.create(config);
  }

  // 3. Standalone fallback
  return StandaloneHostClient.create(config);
};

/**
 * Create a host client asynchronously, waiting for connection.
 *
 * Unlike createHost(), this function waits for the connection to establish
 * and hostContext to be received before returning.
 *
 * @param config - Configuration for the host client
 * @returns Promise that resolves to the configured host client after connection
 *
 * @example
 * ```typescript
 * const host = await createHostAsync({ name: "my-app", version: "1.0.0" });
 * // host is now ready to use
 * ```
 */
export const createHostAsync = async (config: HostClientConfig): Promise<UnifiedHostClient> => {
  const host = createHost(config);

  // For ChatGPT and Standalone, connection is immediate
  if (host.environment !== "mcp-apps") {
    host.connect();
    return host;
  }

  // For MCP Apps, wait for hostContext to be available
  return new Promise((resolve) => {
    const unsubscribe = host.subscribe((state) => {
      if (state.isReady) {
        unsubscribe();
        resolve(host);
      }
    });
    host.connect();
  });
};

// ============================================================================
// Re-exports: Types
// ============================================================================

export type {
  // Environment & Logging
  Environment,
  DisplayMode,
  LogLevel,
  // Widget State
  StructuredWidgetState,
  WidgetState,
  // Tool Results
  ToolResult,
  // Host Context
  HostContext,
  // Content Blocks
  ContentBlock,
  TextContentBlock,
  ImageContentBlock,
  // Host Client
  HostClientConfig,
  HostClientState,
  HostClientEvents,
  StateListener,
  UnifiedHostClient,
  ExpHostApi,
  // WebSocket
  WebSocketStatus,
  WebSocketClientConfig,
  WebSocketClient,
} from "./types.js";

// ============================================================================
// Re-exports: Host Clients (for advanced/explicit usage)
// ============================================================================

export {
  McpAppsHostClient,
  ChatGptHostClient,
  StandaloneHostClient,
} from "./clients/index.js";

// ============================================================================
// Re-exports: Utilities from MCP Apps SDK
// ============================================================================

/**
 * Re-export style utilities from the official MCP Apps SDK.
 *
 * These provide spec-compliant theme and style application. Consumers can use
 * these directly or rely on the automatic application by the host clients.
 */
export {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  getDocumentTheme,
} from "@modelcontextprotocol/ext-apps";

// ============================================================================
// Re-exports: Styles
// ============================================================================

export {
  getMcpAppDefaultStyles,
  getChatGptDefaultStyles,
  detectTheme,
  applyStyles,
  initDefaultStyles,
  MCP_APPS_LIGHT_DEFAULTS,
  MCP_APPS_DARK_DEFAULTS,
  MCP_APPS_SHARED_DEFAULTS,
  CHATGPT_LIGHT_DEFAULTS,
  CHATGPT_DARK_DEFAULTS,
  CHATGPT_SHARED_DEFAULTS,
} from "./styles.js";

export type { Theme, InitStylesOptions } from "./styles.js";

// ============================================================================
// Re-exports: WebSocket
// ============================================================================

export { createWebSocket } from "./websocket.js";

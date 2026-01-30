/**
 * Core Host Client Module
 *
 * Provides the unified host client factory and all related types.
 * This is the main entry point for client-side SDK usage.
 */

import { ChatGptAdapter } from "./providers/chatgpt/ChatGptAdapter.js";
import { CreatureAdapter } from "./providers/creature/CreatureAdapter.js";
import { StandaloneAdapter } from "./providers/standalone/StandaloneAdapter.js";
import { UpgradingMcpAppsClient } from "./providers/mcp-apps/UpgradingMcpAppsClient.js";
import type { UnifiedHostClient } from "./providers/types.js";
import type { HostClientConfig, Environment } from "./base/types.js";

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
export function detectEnvironment(): Environment {
  if (typeof window === "undefined") {
    return "standalone";
  }

  if ("openai" in window && (window as unknown as { openai?: unknown }).openai) {
    return "chatgpt";
  }

  if (window.parent !== window) {
    return "mcp-apps";
  }

  return "standalone";
}

// ============================================================================
// Host Client Factory
// ============================================================================

import { McpAppsAdapter } from "./providers/mcp-apps/McpAppsAdapter.js";

/**
 * Create a host client for the detected environment.
 *
 * Automatically selects the appropriate adapter based on runtime detection:
 * - ChatGPT: Uses ChatGptAdapter (detects window.openai)
 * - MCP Apps: Uses UpgradingMcpAppsClient (determines Creature vs generic after connection)
 * - Standalone: Uses StandaloneAdapter for development/testing
 *
 * For MCP Apps hosts, the returned client uses spec-compliant host identification
 * via hostContext.userAgent. The adapterKind and isCreature properties will
 * reflect the actual host after connection.
 *
 * @param config - Configuration for the host client
 * @returns The appropriate host client adapter for the environment
 */
export function createHost(config: HostClientConfig): UnifiedHostClient {
  // 1. ChatGPT (most specific - has window.openai)
  if (ChatGptAdapter.detect()) {
    return ChatGptAdapter.create(config);
  }

  // 2. MCP Apps (iframe-based host)
  // Uses UpgradingMcpAppsClient for spec-compliant host detection via userAgent
  if (UpgradingMcpAppsClient.detect()) {
    return UpgradingMcpAppsClient.create(config);
  }

  // 3. Standalone fallback
  return StandaloneAdapter.create(config);
}

/**
 * Create a host client asynchronously, waiting for host identification.
 *
 * Unlike createHost(), this function waits for the connection to establish
 * and hostContext to be received before returning. This guarantees that
 * adapterKind and isCreature are accurate when the promise resolves.
 *
 * Use this when you need to know the exact host type before proceeding.
 *
 * @param config - Configuration for the host client
 * @returns Promise that resolves to the configured host client after connection
 *
 * @example
 * ```typescript
 * const host = await createHostAsync({ name: "my-app", version: "1.0.0" });
 * if (host.isCreature) {
 *   // Creature-specific initialization
 * }
 * ```
 */
export async function createHostAsync(config: HostClientConfig): Promise<UnifiedHostClient> {
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
}

// ============================================================================
// Re-exports: Base Types & Classes
// ============================================================================

// Base types (spec-compliant interface definitions)
export type {
  Environment,
  DisplayMode,
  LogLevel,
  StructuredWidgetState,
  WidgetState,
  ToolResult,
  HostContext,
  HostClientConfig,
  HostClientState,
  BaseHostClientEvents,
  McpAppsHostClientEvents,
  StateListener,
  BaseHostClient,
  WebSocketStatus,
  WebSocketClientConfig,
  WebSocketClient,
  // Host identity
  HostIdentity,
} from "./base/index.js";

// Host identity utilities (for spec-compliant host detection via userAgent)
export {
  parseHostUserAgent,
  getHostIdentity,
  isHost,
  KNOWN_HOSTS,
} from "./base/index.js";

// Base classes (for advanced/custom usage)
export {
  McpAppsBaseHostClient,
  ChatGptBaseHostClient,
  StandaloneBaseHostClient,
} from "./base/index.js";

// ============================================================================
// Re-exports: Adapters
// ============================================================================

// Adapter types
export type {
  AdapterKind,
  HostAdapter,
  UnifiedHostClient,
  UnifiedHostClientEvents,
  ExperimentalHostApi,
} from "./providers/index.js";

// Adapter classes (for explicit adapter selection)
export {
  McpAppsAdapter,
  UpgradingMcpAppsClient,
  CreatureAdapter,
  ChatGptAdapter,
  StandaloneAdapter,
} from "./providers/index.js";

// ============================================================================
// Re-exports: Utilities
// ============================================================================

/**
 * Re-export style utilities from the official MCP Apps SDK.
 *
 * These provide spec-compliant theme and style application. Consumers can use
 * these directly or rely on the automatic application by the adapters.
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
  initStyles,
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

/**
 * Core Host Client Module
 *
 * Provides the unified host client factory and all related types.
 * This is the main entry point for client-side SDK usage.
 */

import { ChatGptAdapter } from "./providers/chatgpt/ChatGptAdapter.js";
import { CreatureAdapter } from "./providers/creature/CreatureAdapter.js";
import { StandaloneAdapter } from "./providers/standalone/StandaloneAdapter.js";
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

/**
 * Create a host client for the detected environment.
 *
 * Automatically selects the appropriate adapter based on runtime detection:
 * - ChatGPT: Uses ChatGptAdapter with window.openai bridge
 * - MCP Apps: Uses CreatureAdapter (compatible with Creature and generic MCP hosts)
 * - Standalone: Uses StandaloneAdapter for development/testing
 *
 * @param config - Configuration for the host client
 * @returns The appropriate host client adapter for the environment
 */
export function createHost(config: HostClientConfig): UnifiedHostClient {
  const environment = detectEnvironment();

  if (environment === "chatgpt") {
    return ChatGptAdapter.create(config);
  }

  if (environment === "mcp-apps") {
    // Use CreatureAdapter which is compatible with both Creature and generic MCP hosts
    // It detects Creature-specific features via hostContext after connection
    return CreatureAdapter.create(config);
  }

  return StandaloneAdapter.create(config);
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
} from "./providers/index.js";

// Adapter classes (for explicit adapter selection)
export {
  McpAppsAdapter,
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

// ============================================================================
// Backward Compatibility
// ============================================================================

// Import types needed for aliases
import type { UnifiedHostClient as _UnifiedHostClient, UnifiedHostClientEvents as _UnifiedHostClientEvents } from "./providers/types.js";

/**
 * @deprecated Use UnifiedHostClient instead
 */
export type HostClient = _UnifiedHostClient;

/**
 * @deprecated Use UnifiedHostClientEvents instead
 */
export type HostClientEvents = _UnifiedHostClientEvents;

/**
 * Legacy export - McpAppHostClient is now CreatureAdapter
 * @deprecated Use CreatureAdapter instead
 */
export { CreatureAdapter as McpAppHostClient } from "./providers/index.js";

/**
 * Legacy export - ChatGptAppHostClient is now ChatGptAdapter
 * @deprecated Use ChatGptAdapter instead
 */
export { ChatGptAdapter as ChatGptAppHostClient } from "./providers/index.js";

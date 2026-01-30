/**
 * Base Host Client Module
 *
 * Contains spec-compliant base implementations for MCP Apps and ChatGPT Apps.
 * These clients implement only the cross-platform compatible features.
 */

export { Subscribable, McpAppsSubscribable } from "./Subscribable.js";
export { McpAppsBaseHostClient } from "./McpAppsBaseHostClient.js";
export { ChatGptBaseHostClient } from "./ChatGptBaseHostClient.js";
export { StandaloneBaseHostClient } from "./StandaloneBaseHostClient.js";

// Host identity utilities
export {
  parseHostUserAgent,
  getHostIdentity,
  isHost,
  KNOWN_HOSTS,
} from "./hostIdentity.js";
export type { HostIdentity } from "./hostIdentity.js";

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
  // Host Client
  HostClientConfig,
  HostClientState,
  BaseHostClientEvents,
  McpAppsHostClientEvents,
  StateListener,
  BaseHostClient,
  // WebSocket
  WebSocketStatus,
  WebSocketClientConfig,
  WebSocketClient,
} from "./types.js";

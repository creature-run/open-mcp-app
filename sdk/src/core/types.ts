/**
 * Core Types
 *
 * Re-exports base types and provider types.
 */

// Re-export all base types
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
} from "./base/types.js";

// Re-export provider types
export type {
  UnifiedHostClient,
  UnifiedHostClientEvents,
  ExperimentalHostApi,
  AdapterKind,
  HostAdapter,
  AdapterFactory,
} from "./providers/types.js";

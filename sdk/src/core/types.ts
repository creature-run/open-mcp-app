/**
 * Core Types
 *
 * Re-exports base types and adds backward-compatible aliases.
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
  AdapterKind,
  HostAdapter,
  AdapterFactory,
} from "./providers/types.js";

// ============================================================================
// Backward Compatibility Aliases
// ============================================================================

/**
 * @deprecated Use BaseHostClient instead
 */
export type { BaseHostClient as HostClient } from "./base/types.js";

/**
 * @deprecated Use UnifiedHostClientEvents instead
 */
export type { UnifiedHostClientEvents as HostClientEvents } from "./providers/types.js";

export { useHost, detectEnvironment } from "./useHost.js";
export { useToolResult } from "./useToolResult.js";
export { useWebSocket } from "./useWebSocket.js";
export { CreatureIcon } from "./CreatureIcon.js";

export type {
  DisplayMode,
  UseHostConfig,
  UseHostReturn,
  Logger,
  UseToolResultReturn,
  UseWebSocketConfig,
  UseWebSocketReturn,
  CreatureIconProps,
  LogLevel,
  ToolResult,
  Environment,
  HostContext,
  WidgetState,
  StructuredWidgetState,
  WebSocketStatus,
} from "./types.js";

// Adapter-based exports
export {
  createHost,
  createHostAsync,
  // Adapters
  CreatureAdapter,
  ChatGptAdapter,
  McpAppsAdapter,
  UpgradingMcpAppsClient,
  StandaloneAdapter,
  // Host identity utilities
  parseHostUserAgent,
  getHostIdentity,
  isHost,
  KNOWN_HOSTS,
  // Style utilities
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  getDocumentTheme,
  createWebSocket,
} from "../core/index.js";

export type {
  // Unified types
  UnifiedHostClient,
  UnifiedHostClientEvents,
  AdapterKind,
  HostAdapter,
  HostIdentity,
  // Base types
  HostClientConfig,
  HostClientState,
  BaseHostClient,
  BaseHostClientEvents,
  WebSocketClient,
  WebSocketClientConfig,
} from "../core/index.js";

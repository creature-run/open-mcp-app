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

// New adapter-based exports
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
  // Legacy aliases (deprecated)
  McpAppHostClient,
  ChatGptAppHostClient,
} from "../core/index.js";

export type {
  // New types
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
  // Legacy aliases (deprecated)
  HostClient,
  HostClientEvents,
} from "../core/index.js";

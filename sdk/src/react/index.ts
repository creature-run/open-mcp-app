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

export {
  createHost,
  McpAppHostClient,
  ChatGptAppHostClient,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  getDocumentTheme,
  createWebSocket,
} from "../core/index.js";

export type {
  HostClient,
  HostClientConfig,
  HostClientState,
  HostClientEvents,
  WebSocketClient,
  WebSocketClientConfig,
} from "../core/index.js";

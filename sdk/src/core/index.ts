import { McpAppHostClient } from "./McpAppHostClient.js";
import { ChatGptAppHostClient } from "./ChatGptAppHostClient.js";
import { detectEnvironment } from "./utils.js";
import type { HostClient, HostClientConfig } from "./types.js";

export function createHost(config: HostClientConfig): HostClient {
  const environment = detectEnvironment();

  if (environment === "chatgpt") {
    return new ChatGptAppHostClient(config);
  }

  return new McpAppHostClient(config);
}

export { McpAppHostClient } from "./McpAppHostClient.js";

export { ChatGptAppHostClient } from "./ChatGptAppHostClient.js";

export {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  detectEnvironment,
  getDocumentTheme,
} from "./utils.js";

export type {
  DisplayMode,
  Environment,
  LogLevel,
  StructuredWidgetState,
  WidgetState,
  ToolResult,
  HostContext,
  HostClientConfig,
  HostClientState,
  HostClientEvents,
  HostClient,
  StateListener,
  WebSocketStatus,
  WebSocketClientConfig,
  WebSocketClient,
} from "./types.js";

export { createWebSocket } from "./websocket.js";

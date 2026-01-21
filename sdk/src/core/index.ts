import { McpAppHostClient } from "./McpAppHostClient.js";
import { ChatGptAppHostClient } from "./ChatGptAppHostClient.js";
import { detectEnvironment } from "./utils.js";
import type { HostClient, HostClientConfig } from "./types.js";

/**
 * Create a host client for the detected environment.
 * Automatically selects McpAppHostClient or ChatGptAppHostClient based on runtime detection.
 *
 * @param config - Configuration for the host client
 * @returns The appropriate host client for the environment
 */
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

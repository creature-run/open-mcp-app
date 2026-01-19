export { createApp, App } from "./app.js";
export { loadHtml, htmlLoader, svgToDataUri, isHtmlContent } from "./utils.js";
export type {
  AppConfig,
  ResourceConfig,
  ToolConfig,
  ToolResult,
  ToolHandler,
  ToolContext,
  InstanceDestroyContext,
  DisplayMode,
  ToolVisibility,
  IconConfig,
  TransportType,
  TransportSessionInfo,
  WebSocketConnection,
  // Adapter types
  StateAdapter,
  RealtimeAdapter,
  AdapterOptions,
  VercelMcpOptions,
  AwsLambdaOptions,
} from "./types.js";
export { MIME_TYPES } from "./types.js";

export { wrapServer } from "./middleware.js";

// Auth utilities for retrieving identity from Creature-issued tokens
export { getIdentity, CreatureIdentityError } from "./auth.js";
export type {
  CreatureIdentity,
  CreatureUser,
  CreatureOrganization,
  CreatureProject,
  CreatureSession,
} from "./auth.js";

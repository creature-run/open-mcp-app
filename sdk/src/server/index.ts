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
} from "./types.js";
export { MIME_TYPES } from "./types.js";

export { wrapServer } from "./middleware.js";

// Experimental APIs (Creature-specific features)
// These APIs provide sandboxed storage access when running inside Creature.
export {
  // Directory & environment
  experimental_getWritableDirectory,
  experimental_getProjectId,
  experimental_getServerName,
  experimental_isCreatureHost,
  // Sandboxed file I/O (async)
  experimental_readFile,
  experimental_writeFile,
  experimental_deleteFile,
  experimental_exists,
  experimental_mkdir,
  experimental_readdir,
  experimental_rmdir,
  // Sandboxed file I/O (sync)
  experimental_readFileSync,
  experimental_writeFileSync,
  experimental_deleteFileSync,
  experimental_existsSync,
  experimental_mkdirSync,
  experimental_readdirSync,
  experimental_rmdirSync,
  // KV Store (async)
  experimental_kvIsAvailable,
  experimental_kvGet,
  experimental_kvSet,
  experimental_kvDelete,
  experimental_kvList,
  // KV Store (sync)
  experimental_kvGetSync,
  experimental_kvSetSync,
  experimental_kvDeleteSync,
  experimental_kvListSync,
  // Blob Store (async)
  experimental_blobIsAvailable,
  experimental_blobPut,
  experimental_blobGet,
  experimental_blobDelete,
  experimental_blobList,
  // Blob Store (sync)
  experimental_blobPutSync,
  experimental_blobGetSync,
  experimental_blobDeleteSync,
  experimental_blobListSync,
} from "./experimental.js";

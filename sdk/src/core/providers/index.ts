/**
 * Provider Adapters Module
 *
 * Exports all host adapters and related types.
 */

// Adapters
export { McpAppsAdapter } from "./mcp-apps/McpAppsAdapter.js";
export { UpgradingMcpAppsClient } from "./mcp-apps/UpgradingMcpAppsClient.js";
export { CreatureAdapter } from "./creature/CreatureAdapter.js";
export { ChatGptAdapter } from "./chatgpt/ChatGptAdapter.js";
export { StandaloneAdapter } from "./standalone/StandaloneAdapter.js";

// Types
export type {
  AdapterKind,
  AdapterFactory,
  HostAdapter,
  UnifiedHostClient,
  UnifiedHostClientEvents,
} from "./types.js";

import type { Environment } from "./types.js";

/**
 * Detect the current host environment.
 *
 * Used to auto-select the appropriate host client implementation:
 * - "chatgpt": Running inside ChatGPT's widget system
 * - "mcp-apps": Running inside an MCP Apps host (iframe with parent)
 * - "standalone": Running outside any host environment
 *
 * @returns The detected environment
 */
export function detectEnvironment(): Environment {
  if (typeof window === "undefined") {
    return "standalone";
  }

  if ("openai" in window && (window as unknown as { openai?: unknown }).openai) {
    return "chatgpt";
  }

  if (window.parent !== window) {
    return "mcp-apps";
  }

  return "standalone";
}

/**
 * Re-export style utilities from the official MCP Apps SDK.
 *
 * These provide spec-compliant theme and style application. Consumers can use
 * these directly or rely on the automatic application by McpAppHostClient.
 */
export {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  getDocumentTheme,
} from "@modelcontextprotocol/ext-apps";

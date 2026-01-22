/**
 * Notes MCP App
 *
 * Main app definition. Wires together:
 * - App configuration
 * - UI resources
 * - Tools (registered from /tools)
 *
 * The app runs as an Express server at /mcp endpoint.
 */

import { createApp } from "@creature-ai/sdk/server";
import { registerNotesTool } from "./tools/notes.js";
import { MCP_NAME, NOTE_UI_URI } from "./lib/types.js";
import { ICON_SVG, ICON_ALT } from "./lib/icon.js";

// =============================================================================
// Configuration
// =============================================================================

const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "3004", 10);

// =============================================================================
// App Definition
// =============================================================================

const app = createApp({
  name: MCP_NAME,
  version: "0.1.0",
  port: PORT,
  auth: { creatureManaged: true },
  instructions: `CRITICAL - Tab Behavior:
- action:"create" → NEVER pass instanceId.
- action:"save" → ALWAYS pass instanceId of the tab showing that note.
- action:"open" → ONLY pass instanceId if user explicitly wants to replace current tab's content.
- MUST use "read" before "save" to avoid overwriting user edits.`,
});

// =============================================================================
// UI Resources
// =============================================================================

app.resource({
  name: "Note Editor",
  uri: NOTE_UI_URI,
  description: "Markdown note editor with live preview",
  displayModes: ["pip", "inline"],
  html: "../../dist/ui/main.html",
  icon: { svg: ICON_SVG, alt: ICON_ALT },
  multiInstance: true,
});

// =============================================================================
// Tools
// =============================================================================

registerNotesTool(app);

// =============================================================================
// OAuth Discovery (for ChatGPT and other OAuth clients)
// =============================================================================

app.serveOAuthDiscovery({
  path: "/.well-known/oauth-authorization-server",
  issuer: "https://creature.run",
  authorization_endpoint: "https://creature.run/oauth/authorize",
  token_endpoint: "https://api.creature.run/apps/v1/oauth/token",
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
});

// =============================================================================
// Start Server
// =============================================================================

app.start();

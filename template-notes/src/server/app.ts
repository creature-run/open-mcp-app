/**
 * Notes MCP App
 *
 * Main app definition. Wires together:
 * - App configuration
 * - UI resources
 * - Tools (registered from /tools)
 *
 * Supports both local development (file paths) and serverless (bundled HTML).
 */

import { createApp, type App } from "@creature-ai/sdk/server";
import { registerNotesTool } from "./tools/notes.js";
import { MCP_NAME, NOTE_UI_URI, type AppOptions } from "./lib/types.js";
import { ICON_SVG, ICON_ALT } from "./lib/icon.js";

// =============================================================================
// Configuration
// =============================================================================

const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "3004", 10);

// =============================================================================
// App Factory
// =============================================================================

/**
 * Create the Notes MCP App.
 * 
 * @param options.html - Optional bundled HTML for serverless deployments.
 *                       If not provided, loads from file path (local dev).
 * 
 * @example
 * // Local development
 * const app = createNotesApp();
 * app.start();
 * 
 * @example
 * // Serverless (Vercel)
 * import { main } from "../../dist/ui/bundle.js";
 * const app = createNotesApp({ html: main });
 * export const mcpConfig = app.toVercelMcp();
 */
export const createNotesApp = (options: AppOptions = {}): App => {
  const app = createApp({
    name: MCP_NAME,
    version: "0.1.0",
    port: PORT,
    auth: { creatureManaged: true },
    instructions: `This MCP manages markdown notes with the 'notes' tool.

Actions:
- action:"list" - Display all notes in a searchable list
- action:"open" + noteId - Open existing note in editor  
- action:"create" - Create new note (optional title/content)
- action:"read" + noteId - Get note content for processing
- action:"save" + noteId + title + content - Update existing note
- action:"delete" + noteId - Remove a note

Key behavior: When editing, use action:"read" first to get current content, then action:"save". This prevents overwriting user edits.`,
  });

  // ==========================================================================
  // UI Resources
  // ==========================================================================

  app.resource({
    name: "Note Editor",
    uri: NOTE_UI_URI,
    description: "Markdown note editor with live preview",
    displayModes: ["pip", "inline"],
    // Use bundled HTML if provided (serverless), otherwise file path (local)
    // Local dev: Vite builds to dist/ui/main.html
    html: options.html || "../../dist/ui/main.html",
    icon: { svg: ICON_SVG, alt: ICON_ALT },
    multiInstance: true,
  });

  // ==========================================================================
  // Tools
  // ==========================================================================

  registerNotesTool(app);

  // ==========================================================================
  // OAuth Discovery (for ChatGPT and other OAuth clients)
  // ==========================================================================

  // ChatGPT expects OAuth discovery at server root, not under /mcp path
  // - Local dev: /.well-known/oauth-authorization-server
  // - Vercel: Needs rewrite from /.well-known/* or dedicated function
  const oauthPath = "/.well-known/oauth-authorization-server";

  app.serveOAuthDiscovery({
    path: oauthPath,
    issuer: "https://creature.run",
    authorization_endpoint: "https://creature.run/oauth/authorize",
    token_endpoint: "https://api.creature.run/apps/v1/oauth/token",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
  });

  return app;
};

// =============================================================================
// Default Export for Local Development
// =============================================================================

/**
 * Default app instance using file path for HTML.
 * Used by dev.ts for local development.
 */
export const app = createNotesApp();

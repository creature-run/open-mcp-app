/**
 * Todos MCP App
 *
 * Main app definition. Wires together:
 * - App configuration with Creature auth
 * - UI resources
 * - Tools (registered from /tools)
 *
 * Supports both local development (file paths) and serverless (bundled HTML).
 */

import { createApp, type App } from "@creature-ai/sdk/server";
import { registerTodosUiTool } from "./tools/todos_ui.js";
import { registerTodosApiTool } from "./tools/todos_api.js";
import { MCP_NAME, TODOS_UI_URI, type AppOptions } from "./lib/types.js";
import { ICON_SVG, ICON_ALT } from "./lib/icon.js";

// =============================================================================
// Configuration
// =============================================================================

const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "3005", 10);

// =============================================================================
// App Factory
// =============================================================================

/**
 * Create the Todos MCP App.
 *
 * @param options.html - Optional bundled HTML for serverless deployments.
 *                       If not provided, loads from file path (local dev).
 *
 * @example
 * // Local development
 * const app = createTodosApp();
 * app.start();
 *
 * @example
 * // Serverless (Vercel)
 * import { main } from "../../dist/ui/bundle.js";
 * const app = createTodosApp({ html: main });
 * export const mcpConfig = app.toVercelMcp();
 */
export const createTodosApp = (options: AppOptions = {}): App => {
  const app = createApp({
    name: MCP_NAME,
    version: "0.1.0",
    port: PORT,
    auth: { creatureManaged: true },
    instructions: `This MCP manages a todo list with two tools:

todos_ui (shows UI):
- action:"list" - Display all todos in the interactive list

todos_api (no UI, data operations):
- action:"add" + text - Create a new todo item
- action:"toggle" + id - Mark todo as complete/incomplete
- action:"remove" + id - Delete a todo item

When the user wants to see their todos, use todos_ui action:"list" to open the interactive pip.`,
  });

  // ==========================================================================
  // UI Resources
  // ==========================================================================

  app.resource({
    name: "Todo List",
    uri: TODOS_UI_URI,
    description: "Interactive todo list with add, toggle, and delete",
    displayModes: ["pip", "inline"],
    // Use bundled HTML if provided (serverless), otherwise file path (local)
    // Local dev: Vite builds to dist/ui/main.html
    html: options.html || "../../dist/ui/main.html",
    icon: { svg: ICON_SVG, alt: ICON_ALT },
  });

  // ==========================================================================
  // Tools
  // ==========================================================================

  registerTodosUiTool(app);
  registerTodosApiTool(app);

  // ==========================================================================
  // OAuth Discovery (for ChatGPT and other OAuth clients)
  // ==========================================================================

  // ChatGPT expects OAuth discovery at server root, not under /mcp path
  // - Local dev: /.well-known/oauth-authorization-server
  // - Vercel: Needs rewrite from /.well-known/* or dedicated function
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

  return app;
};

// =============================================================================
// Default Export for Local Development
// =============================================================================

/**
 * Default app instance using file path for HTML.
 * Used by dev.ts for local development.
 */
export const app = createTodosApp();

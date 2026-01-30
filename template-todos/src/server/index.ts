/**
 * Todos MCP App
 *
 * Main app definition. Wires together:
 * - App configuration
 * - UI resources
 * - Tools (registered from /tools)
 *
 * The app runs as an Express server at /mcp endpoint.
 */

import { createApp } from "open-mcp-app/server";
import { registerTodosTools } from "./tools/todos.js";
import { MCP_NAME, TODOS_UI_URI } from "./lib/types.js";
import { ICON_SVG, ICON_ALT } from "./lib/icon.js";

// =============================================================================
// Configuration
// =============================================================================

const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "3005", 10);

// =============================================================================
// App Definition
// =============================================================================

const app = createApp({
  name: MCP_NAME,
  version: "0.1.0",
  port: PORT,
  auth: { creatureManaged: true },
  instructions: `This MCP manages a todo list with separate tools:

- todos_list - Display all todos in the interactive list
- todos_add { text } - Create a new todo item
- todos_toggle { id } - Mark todo as complete/incomplete
- todos_remove { id } - Delete a todo item

Use todos_list to open the interactive pip when the user wants to see their todos.`,
});

// =============================================================================
// UI Resources
// =============================================================================

app.resource({
  name: "Todo List",
  uri: TODOS_UI_URI,
  description: "Interactive todo list with add, toggle, and delete",
  displayModes: ["pip", "inline"],
  html: "../../dist/ui/main.html",
  icon: { svg: ICON_SVG, alt: ICON_ALT },
});

// =============================================================================
// Tools
// =============================================================================

registerTodosTools(app);

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

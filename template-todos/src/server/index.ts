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
  instructions: `Todo list manager with batch operations. All tools support multiple items per call.

Tools:
- todos_list: Display all todos in the interactive list UI
- todos_add { items: ["task 1", "task 2", ...] }: Create one or more todos
- todos_toggle { ids: ["id1", "id2", ...] }: Toggle completed status for one or more todos
- todos_remove { ids: ["id1", "id2", ...] }: Delete one or more todos

Use todos_list to open the interactive pip when the user wants to see or manage their todos.`,
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
// Start Server
// =============================================================================

app.start();

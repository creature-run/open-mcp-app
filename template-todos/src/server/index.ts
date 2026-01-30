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
// Start Server
// =============================================================================

app.start();

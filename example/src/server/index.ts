/**
 * Items MCP App Server
 *
 * A minimal, pattern-focused example that demonstrates the SDK.
 * Generic "Items" model that can be adapted for any use case.
 */

import { createApp } from "open-mcp-app/server";
import { registerItemTools } from "./tools/items.js";
import { APP_ICON } from "./lib/icon.js";

/**
 * View configuration for the UI.
 * Maps URL patterns to tool names for automatic view routing.
 */
const VIEWS = {
  "/": ["items_list", "items_create", "items_search", "items_reset"],
  "/item/:itemId": ["items_get", "items_update", "items_delete"],
};

/**
 * Server port configuration.
 */
const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "3000");

/**
 * Create the MCP App.
 */
const app = createApp({
  name: "items",
  version: "0.1.0",
  port: PORT,
  instructions: `This MCP manages items with a visual UI.

IMPORTANT: The user can see the item list in the UI widget. Do NOT repeat item 
contents in your responses. Keep responses brief.

CRITICAL: Item IDs are random strings (e.g., "abc123xyz"), NOT sequential numbers.
- items_create returns the new item's ID in the response - save it for later use
- If you need to update/delete items and don't have IDs, call items_list first
- The widget state includes item IDs - check modelContent before guessing

Tools:
- items_list: Opens the visual list. Returns all items with their IDs.
- items_create { title, content? }: Add item. Returns the created item's ID.
- items_update { id, title?, content?, completed? }: Modify item. ID required.
- items_delete { id }: Remove item. ID required.
- items_search { query }: Find items matching query.
- items_reset { confirm: true }: Delete ALL items.`,
});

/**
 * Register the UI resource.
 *
 * One resource handles all views - the views config maps tools to logical screens.
 */
app.resource({
  name: "Items",
  uri: "ui://items/main",
  description: "Interactive item list and detail views",
  displayModes: ["pip", "inline"],
  html: "items/ui/index.html",
  icon: { svg: APP_ICON, alt: "Items" },
  views: VIEWS,
});

/**
 * Register all item tools.
 */
registerItemTools({ app });

/**
 * Start the server.
 */
app.start();

console.log(`Items MCP App running on port ${PORT}`);

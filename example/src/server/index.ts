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
  "/": ["items_list", "items_create", "items_search", "items_seed", "items_reset"],
  "/item/:itemId": ["items_get", "items_update", "items_delete"],
};

/**
 * Create the MCP App.
 */
const app = createApp({
  name: "items",
  version: "0.1.0",
  port: parseInt(process.env.MCP_PORT || process.env.PORT || "3000"),
  instructions: `This MCP manages items with a visual UI.

IMPORTANT: The user can see the item list in the UI widget. Do NOT repeat item 
contents in your responses. Keep responses brief:
- "Added 'Buy groceries' to your list" (not the full list)
- "Marked 3 items complete" (not which ones)
- "Found 5 items matching 'work'" (not listing them)

Tools:
- items_list: Opens the visual list. Use when user wants to see/manage items.
- items_create { title, content? }: Add a new item. Returns confirmation.
- items_update { id, title?, content?, completed? }: Modify an item.
- items_delete { id }: Remove an item. Confirm before deleting.
- items_search { query }: Find items. Results shown in UI.
- items_seed: Generate demo data. Use when user wants test items.
- items_reset { confirm: true }: Delete ALL items. Requires explicit confirmation.

The widget state shows currentView, totalItems, and lastAction - reference these 
instead of re-listing items.`,
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
  html: "../../dist/ui/index.html",
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

console.log(`Items MCP App running on port ${app.port}`);

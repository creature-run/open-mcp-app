/**
 * Notes MCP App
 *
 * Main app definition. Wires together:
 * - App configuration
 * - UI resources (editor and list views)
 * - Tools (registered from /tools)
 *
 * The app runs as an Express server at /mcp endpoint.
 */

import { createApp } from "open-mcp-app/server";
import { registerNotesTools } from "./tools/notes.js";
import { MCP_NAME, NOTES_UI_URI } from "./lib/types.js";
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
  instructions: `This MCP manages notes with separate tools:

- notes_list - Display all notes in a searchable list
- notes_create - Create a new note (always opens new window)
- notes_open { noteId } - Open an existing note for editing
- notes_save { noteId, title, content } - Save changes to a note (no UI change)
- notes_delete { noteId } - Delete a note (no UI change)

Each note opens in its own editor window. The list view shows all notes.`,
});

// =============================================================================
// UI Resources
// =============================================================================

/**
 * Notes UI resource.
 * 
 * Uses pipRules to control pip routing:
 * - notes_list: single pip (default), reused for all list calls
 * - notes_open/:noteId: one pip per noteId value
 * - notes_create: always creates a new pip
 */
app.resource({
  name: "Notes",
  uri: NOTES_UI_URI,
  description: "Markdown notes app with list and editor views",
  displayModes: ["pip"],
  html: "../../dist/ui/main.html",
  icon: { svg: ICON_SVG, alt: ICON_ALT },
  experimental: {
    /**
     * Pip routing rules.
     * 
     * Routes are matched in order of specificity:
     * - "notes_open/:noteId": One pip per noteId value (reused when same noteId)
     * - "notes_create": Always creates a new pip for new notes
     * - "notes_list": Single list pip, reused (default behavior)
     * 
     * The :noteId syntax extracts the value from tool input args.noteId
     * and uses it as a routing key (e.g., "notes_open:abc123").
     */
    pipRules: {
      "notes_open/:noteId": "single",  // One pip per noteId, reuse when same note
      "notes_create": "new",           // Always new pip for create
      // notes_list: defaults to "single" - one list pip, reused
    },
  },
});

// =============================================================================
// Tools
// =============================================================================

registerNotesTools(app);

// =============================================================================
// Start Server
// =============================================================================

app.start();

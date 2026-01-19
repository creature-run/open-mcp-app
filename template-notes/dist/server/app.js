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
import { createApp } from "@creature-ai/sdk/server";
import { registerNoteTool } from "./tools/note.js";
import { MCP_NAME, NOTE_UI_URI } from "./types.js";
import { ICON_SVG, ICON_ALT } from "./icon.js";
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
export const createNotesApp = (options = {}) => {
    const app = createApp({
        name: MCP_NAME,
        version: "0.1.0",
        port: PORT,
        path: "/mcp",
        auth: { creatureManaged: true },
        instructions: `This MCP manages markdown notes. Key behaviors:
- When editing an existing note, ALWAYS use action:"read" first to get current content, then apply changes with action:"save". This prevents overwriting user edits made in the UI.
- Use action:"open" to create new notes or open existing ones in the editor.
- Use action:"list" to discover existing notes and their IDs.`,
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
    registerNoteTool(app);
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

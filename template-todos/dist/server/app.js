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
import { createApp } from "@creature-ai/sdk/server";
import { registerTodoTool } from "./tools/todo.js";
import { MCP_NAME, TODOS_UI_URI } from "./types.js";
import { ICON_SVG, ICON_ALT } from "./icon.js";
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
export const createTodosApp = (options = {}) => {
    const app = createApp({
        name: MCP_NAME,
        version: "0.1.0",
        port: PORT,
        auth: { creatureManaged: true },
        instructions: `This MCP manages a todo list. Key behaviors:
- Use action:"list" to view all todos and open the todo list UI.
- Use action:"add" to create new todo items.
- Use action:"toggle" to mark todos as complete/incomplete by ID.
- Use action:"remove" to delete todos by ID.
- When the user wants to see their todos, use action:"list" to open the interactive pip.`,
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
    registerTodoTool(app);
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

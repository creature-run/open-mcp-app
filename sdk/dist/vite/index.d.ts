import { Plugin } from 'vite';

/**
 * HMR Client Script
 *
 * This script is injected into MCP App HTML during development mode.
 * It connects to Vite's HMR WebSocket and notifies the parent frame
 * when a full reload is needed.
 *
 * The parent frame (Creature host) will then:
 * 1. Save current widget state
 * 2. Re-fetch fresh HTML from the MCP server
 * 3. Reload the iframe with new content
 * 4. Restore widget state
 */
/**
 * Generate the HMR client script as a string.
 * The port is injected at generation time.
 */
declare function generateHmrClientScript(port: number): string;
/**
 * Generate a script tag with the HMR client code.
 */
declare function generateHmrClientScriptTag(port: number): string;

interface CreaturePluginOptions {
    uiDir?: string;
    outDir?: string;
    hmrPort?: number;
    /**
     * Generate a JS module exporting bundled HTML for serverless deployments.
     * When enabled, creates `dist/ui/bundle.js` with named exports for each page.
     *
     * @example
     * // In server code:
     * import { main } from "./dist/ui/bundle.js";
     * app.resource({ html: main });
     *
     * @default false
     */
    generateBundle?: boolean;
}
interface HmrConfig {
    port: number;
}
/**
 * Vite plugin for Creature MCP Apps.
 *
 * Just write page.tsx files - no HTML or entry files needed.
 *
 * ```
 * src/ui/
 * ├── page.tsx         → dist/ui/main.html
 * ├── inline/page.tsx  → dist/ui/inline.html
 * └── _components/     → ignored
 * ```
 *
 * When using vite-plugin-singlefile, multiple pages are built automatically
 * via sequential builds (singlefile requires single entry per build).
 */
declare function creature(options?: CreaturePluginOptions): Plugin;

export { type CreaturePluginOptions, type HmrConfig, creature, creature as default, generateHmrClientScript, generateHmrClientScriptTag };

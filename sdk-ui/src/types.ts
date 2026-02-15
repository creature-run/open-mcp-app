/**
 * Shared types for open-mcp-app-ui.
 *
 * Re-exports the DisplayMode type from the SDK so consumers
 * don't need to import from two packages for basic usage.
 */

/** Display modes supported by MCP Apps hosts. */
export type DisplayMode = "inline" | "pip" | "fullscreen";

/** Sizes used across form controls and typography. */
export type Size = "sm" | "md" | "lg";

/** Semantic color variants matching the MCP Apps spec color groups. */
export type SemanticVariant = "info" | "danger" | "success" | "warning";

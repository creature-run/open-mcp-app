/**
 * Type Definitions
 *
 * All shared types for the Notes MCP.
 */

// =============================================================================
// Constants
// =============================================================================

export const MCP_NAME = "mcp-template-notes";

/**
 * URI for the notes UI resource.
 * 
 * With pipRules, a single resource handles all views (list and editor).
 * The pip routing is controlled by pipRules based on tool name and args,
 * not by separate resource URIs.
 */
export const NOTES_UI_URI = `ui://${MCP_NAME}/notes`;

/**
 * @deprecated Use NOTES_UI_URI instead. Kept for reference.
 */
export const NOTE_EDITOR_URI = NOTES_UI_URI;

/**
 * @deprecated Use NOTES_UI_URI instead. Kept for reference.
 */
export const NOTES_LIST_URI = NOTES_UI_URI;

// =============================================================================
// Data Types
// =============================================================================

/**
 * A note document stored in the data layer.
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary of a note for list views.
 */
export interface NoteSummary {
  id: string;
  title: string;
  updatedAt: string;
}

// =============================================================================
// Instance State
// =============================================================================

/**
 * Per-instance state stored by the SDK.
 * Associates a UI widget instance with its note or view type.
 */
export interface NoteInstanceState {
  noteId?: string;
  view: "editor" | "list";
}

// =============================================================================
// Tool Types
// =============================================================================

// Re-export ToolContext from SDK - includes instanceId, setState, getState, etc.
export type { ToolContext, ToolResult } from "open-mcp-app/server";

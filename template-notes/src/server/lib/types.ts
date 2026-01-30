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
 * URI for the note editor view (single note editing).
 */
export const NOTE_EDITOR_URI = `ui://${MCP_NAME}/editor`;

/**
 * URI for the notes list view (all notes).
 */
export const NOTES_LIST_URI = `ui://${MCP_NAME}/list`;

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

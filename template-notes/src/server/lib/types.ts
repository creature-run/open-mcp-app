/**
 * Type Definitions
 *
 * All shared types for the Notes MCP.
 */

// =============================================================================
// Constants
// =============================================================================

export const MCP_NAME = "mcp-template-notes";
export const NOTE_UI_URI = `ui://${MCP_NAME}/note`;

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

// =============================================================================
// Instance State
// =============================================================================

/**
 * Per-instance state stored by the SDK.
 * Associates a UI widget instance with its note.
 */
export interface NoteInstanceState {
  noteId: string;
}

// =============================================================================
// Tool Types
// =============================================================================

// Re-export ToolContext from SDK - includes instanceId, setState, getState, etc.
export type { ToolContext, ToolResult } from "open-mcp-app/server";

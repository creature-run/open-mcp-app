/**
 * Type Definitions
 *
 * All shared types for the Todos MCP.
 */

// =============================================================================
// Constants
// =============================================================================

export const MCP_NAME = "mcp-template-todos";
export const TODOS_UI_URI = `ui://${MCP_NAME}/todos`;

// =============================================================================
// Data Types
// =============================================================================

/**
 * A todo item stored in the data layer.
 */
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Tool Types
// =============================================================================

// Re-export ToolContext from SDK - includes instanceId, setState, getState, etc.
export type { ToolContext, ToolResult } from "@creature-ai/sdk/server";

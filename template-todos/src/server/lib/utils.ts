/**
 * Tool Utilities
 *
 * Shared helper functions used by todo tools.
 * Handles ID generation, authentication, and store creation.
 *
 * Cross-Platform Support:
 * - Creature (MCP Apps): Uses creatureToken for user identity and cloud storage
 * - ChatGPT Apps: Uses OAuth token (via creatureToken) for identity
 * - Generic MCP Apps: Falls back to local/anonymous storage (instanceId-scoped)
 */

import { getIdentity } from "open-mcp-app/server";
import { createDataStore, type DataScope, type DataStore } from "./data.js";
import type { Todo, ToolContext, ToolResult } from "./types.js";

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generate a unique todo ID.
 * Format: todo_<timestamp>_<random>
 */
export const generateTodoId = () =>
  `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// =============================================================================
// Data Helpers
// =============================================================================

/**
 * Get all todos from a store, sorted by creation date (newest first).
 */
export const getAllTodos = async (store: DataStore<Todo>): Promise<Todo[]> => {
  const all = await store.list();
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get summary counts for todos.
 */
export const getTodoCounts = (todos: Todo[]) => ({
  total: todos.length,
  open: todos.filter((t) => !t.completed).length,
  completed: todos.filter((t) => t.completed).length,
});

// =============================================================================
// Authentication & Scope
// =============================================================================

/**
 * Extract scope from authentication context.
 *
 * Supports multiple authentication modes:
 * 1. Creature with project: Returns { orgId, projectId } for cloud storage
 * 2. ChatGPT/OAuth: Returns { orgId } for org-level cloud storage
 * 3. Anonymous/Local: Returns { localId } for local/session storage
 *
 * @param creatureToken - Token from Creature or OAuth bearer token
 * @param instanceId - Instance ID for fallback local scope
 * @returns DataScope for store creation
 */
export const extractScope = async (
  creatureToken?: string,
  instanceId?: string
): Promise<DataScope> => {
  // If we have a token, try to get identity for cloud storage
  if (creatureToken) {
    try {
      const identity = await getIdentity(creatureToken);

      if (identity.organization) {
        return {
          orgId: identity.organization.id,
          projectId: identity.project?.id,
        };
      }
    } catch (err) {
      // Token invalid or API unavailable - fall through to local mode
      console.warn("[Todos] Failed to get identity, using local storage:", err);
    }
  }

  // Fall back to local/anonymous mode using a stable local ID
  // This allows the app to work in generic MCP Apps hosts without auth
  return {
    localId: instanceId || "anonymous",
  };
};

/**
 * Create a scoped todo store based on scope.
 */
export const createTodoStore = (scope: DataScope): DataStore<Todo> => {
  return createDataStore<Todo>({
    collection: "mcps_todos_todos",
    scope,
  });
};

/**
 * Handle authentication and return store.
 * Wraps tool handlers with auth logic to reduce boilerplate.
 *
 * Unlike previous versions, this no longer fails if auth is unavailable.
 * Instead, it falls back to local storage mode for generic MCP Apps hosts.
 */
export const withAuth = async (
  context: ToolContext,
  handler: (store: DataStore<Todo>) => Promise<ToolResult>
): Promise<ToolResult> => {
  const scope = await extractScope(context.creatureToken, context.instanceId);
  const store = createTodoStore(scope);
  return handler(store);
};

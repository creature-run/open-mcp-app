/**
 * Tool Utilities
 *
 * Shared helper functions used by todo tools.
 * Handles ID generation, authentication, and store creation.
 */

import { getIdentity } from "@creature-ai/sdk/server";
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
// Authentication
// =============================================================================

/**
 * Extract scope from Creature identity token.
 * Returns orgId and optionally projectId for data isolation.
 *
 * - Creature with project: Returns { orgId, projectId }
 * - ChatGPT/OAuth: Returns { orgId } only (org-level data via personal org)
 *
 * Throws if token is missing or invalid.
 */
export const extractScope = async (creatureToken?: string): Promise<DataScope> => {
  if (!creatureToken) {
    throw new Error("Authentication required: No Creature token provided");
  }

  const identity = await getIdentity(creatureToken);

  if (!identity.organization) {
    throw new Error("Authentication required: No organization context");
  }

  return {
    orgId: identity.organization.id,
    projectId: identity.project?.id,
  };
};

/**
 * Create a scoped todo store based on identity.
 */
export const createTodoStore = (scope: DataScope): DataStore<Todo> => {
  return createDataStore<Todo>({
    collection: "mcps_todos_todos",
    scope,
  });
};

/**
 * Handle authentication and return store, or return error result.
 * Wraps tool handlers with auth logic to reduce boilerplate.
 */
export const withAuth = async (
  context: ToolContext,
  handler: (store: DataStore<Todo>) => Promise<ToolResult>
): Promise<ToolResult> => {
  let scope: DataScope;
  try {
    scope = await extractScope(context.creatureToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return {
      data: { error: message },
      text: message,
      isError: true,
    };
  }

  const store = createTodoStore(scope);
  return handler(store);
};

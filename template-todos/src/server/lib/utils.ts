/**
 * Tool Utilities
 *
 * Shared helper functions used by todo tools.
 * Handles ID generation and store creation.
 *
 * Data is scoped by instanceId for isolation.
 */

import { createDataStore, type DataStore } from "./data.js";
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
// Store Creation
// =============================================================================

/**
 * Create a todo store scoped by localId.
 */
export const createTodoStore = (localId: string): DataStore<Todo> => {
  return createDataStore<Todo>({
    collection: "todos",
    localId,
  });
};

/**
 * Wrap tool handlers with store creation.
 * Creates a store scoped by instanceId for data isolation.
 */
export const withStore = async (
  context: ToolContext,
  handler: (store: DataStore<Todo>) => Promise<ToolResult>
): Promise<ToolResult> => {
  const store = createTodoStore(context.instanceId || "default");
  return handler(store);
};

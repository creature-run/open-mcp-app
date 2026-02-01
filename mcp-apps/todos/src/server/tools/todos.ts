/**
 * Todos Tools
 *
 * Separate tools for each todo operation. All tools route to the same UI.
 * Each tool supports batch operations (multiple items per call).
 *
 * Tools:
 * - todos_list: Show all todos in interactive list
 * - todos_add: Create one or more todo items
 * - todos_toggle: Toggle one or more todos' completed status
 * - todos_remove: Delete one or more todo items
 * - todos_search: Full-text search across todos (uses SQLite FTS5)
 *
 * Todos are stored globally within a project and persist across sessions.
 */

import { z } from "zod";
import type { App } from "open-mcp-app/server";
import type { DataStore } from "../lib/data.js";
import {
  TODOS_UI_URI,
  type Todo,
  type ToolContext,
  type ToolResult,
} from "../lib/types.js";
import {
  generateTodoId,
  getAllTodos,
  getTodoCounts,
  searchTodos,
  withStore,
} from "../lib/utils.js";
import type { SearchResult } from "../lib/data.js";

// =============================================================================
// Input Schemas
// =============================================================================

const TodosListSchema = z.object({});

const TodosAddSchema = z.object({
  items: z.array(z.string()).describe("Array of todo texts to add"),
});

const TodosToggleSchema = z.object({
  ids: z.array(z.string()).describe("Array of todo IDs to toggle"),
});

const TodosRemoveSchema = z.object({
  ids: z.array(z.string()).describe("Array of todo IDs to remove"),
});

const TodosSearchSchema = z.object({
  query: z.string().describe("Search query to find matching todos"),
  limit: z.number().optional().describe("Maximum number of results (default 20)"),
});

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * List all todos.
 */
const handleList = async (store: DataStore<Todo>): Promise<ToolResult> => {
  const todos = await getAllTodos(store);
  const { total, open } = getTodoCounts(todos);

  if (total === 0) {
    return {
      data: { todos: [] },
      title: "Todos (0)",
      text: "No todos yet. Use todos_add to create one.",
    };
  }

  return {
    data: { todos },
    title: `Todos (${open})`,
    text: `${total} todo(s), ${open} remaining`,
  };
};

/**
 * Add one or more todo items.
 */
const handleAdd = async (
  items: string[],
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const now = new Date().toISOString();
  const addedTodos: Todo[] = [];

  for (const text of items) {
    const todo: Todo = {
      id: generateTodoId(),
      text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await store.set(todo.id, todo);
    addedTodos.push(todo);
  }

  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  const itemCount = addedTodos.length;
  const textSummary = itemCount === 1
    ? `Added todo: ${addedTodos[0].text}`
    : `Added ${itemCount} todos`;

  return {
    data: { success: true, added: addedTodos, todos },
    text: textSummary,
    title: `Todos (${open})`,
  };
};

/**
 * Toggle one or more todos' completed status.
 */
const handleToggle = async (
  ids: string[],
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const now = new Date().toISOString();
  const toggled: Todo[] = [];
  const notFound: string[] = [];

  for (const id of ids) {
    const todo = await store.get(id);
    if (!todo) {
      notFound.push(id);
      continue;
    }

    todo.completed = !todo.completed;
    todo.updatedAt = now;
    await store.set(id, todo);
    toggled.push(todo);
  }

  if (toggled.length === 0 && notFound.length > 0) {
    return {
      data: { error: "No todos found", notFound },
      text: `No todos found for IDs: ${notFound.join(", ")}`,
      isError: true,
    };
  }

  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  let textSummary: string;
  if (toggled.length === 1) {
    const status = toggled[0].completed ? "completed" : "uncompleted";
    textSummary = `Marked "${toggled[0].text}" as ${status}`;
  } else {
    textSummary = `Toggled ${toggled.length} todos`;
  }

  if (notFound.length > 0) {
    textSummary += ` (${notFound.length} not found)`;
  }

  return {
    data: { success: true, toggled, notFound, todos },
    text: textSummary,
    title: `Todos (${open})`,
  };
};

/**
 * Remove one or more todo items.
 */
const handleRemove = async (
  ids: string[],
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const deleted: { id: string; text: string }[] = [];
  const notFound: string[] = [];

  for (const id of ids) {
    const todo = await store.get(id);
    if (!todo) {
      notFound.push(id);
      continue;
    }

    deleted.push({ id, text: todo.text });
    await store.delete(id);
  }

  if (deleted.length === 0 && notFound.length > 0) {
    return {
      data: { error: "No todos found", notFound },
      text: `No todos found for IDs: ${notFound.join(", ")}`,
      isError: true,
    };
  }

  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  let textSummary: string;
  if (deleted.length === 1) {
    textSummary = `Removed todo: ${deleted[0].text}`;
  } else {
    textSummary = `Removed ${deleted.length} todos`;
  }

  if (notFound.length > 0) {
    textSummary += ` (${notFound.length} not found)`;
  }

  return {
    data: { success: true, deleted, notFound, todos },
    text: textSummary,
    title: `Todos (${open})`,
  };
};

/**
 * Search todos using full-text search.
 */
const handleSearch = async (
  query: string,
  limit: number | undefined,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const results = await searchTodos(store, query, limit ?? 20);

  if (results.length === 0) {
    return {
      data: { query, matches: [] },
      text: `No todos found matching "${query}"`,
    };
  }

  // Format results with snippets
  const matches = results.map((r: SearchResult<Todo>) => ({
    id: r.item.id,
    text: r.item.text,
    completed: r.item.completed,
    snippet: r.snippet,
    score: r.score,
  }));

  // Get full todo list for display
  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  return {
    data: { query, matches, todos },
    text: `Found ${results.length} todo(s) matching "${query}"`,
    title: `Todos (${open})`,
  };
};

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Register all todos tools.
 *
 * Separate tools for each operation. Results are routed to the pip
 * for UI updates.
 */
export const registerTodosTools = (app: App) => {
  // List todos
  app.tool(
    "todos_list",
    {
      description: "List all todos and display them in the interactive todo list UI",
      input: TodosListSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (_input: z.infer<typeof TodosListSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleList(store));
    }
  );

  // Add todos
  app.tool(
    "todos_add",
    {
      description: "Add one or more todo items to the list",
      input: TodosAddSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof TodosAddSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleAdd(input.items, store));
    }
  );

  // Toggle todos
  app.tool(
    "todos_toggle",
    {
      description: "Toggle one or more todos' completed status",
      input: TodosToggleSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof TodosToggleSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleToggle(input.ids, store));
    }
  );

  // Remove todos
  app.tool(
    "todos_remove",
    {
      description: "Remove one or more todo items from the list",
      input: TodosRemoveSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof TodosRemoveSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleRemove(input.ids, store));
    }
  );

  // Search todos (full-text search)
  app.tool(
    "todos_search",
    {
      description: "Search todos using full-text search. Finds todos containing the search query and returns matching snippets with relevance scores.",
      input: TodosSearchSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof TodosSearchSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleSearch(input.query, input.limit, store));
    }
  );
};

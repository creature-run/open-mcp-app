/**
 * Todos Tools
 *
 * Separate tools for each todo operation. All tools route to the same UI.
 *
 * Tools:
 * - todos_list: Show all todos in interactive list
 * - todos_add: Create a new todo item
 * - todos_toggle: Toggle a todo's completed status
 * - todos_remove: Delete a todo item
 *
 * Todos are scoped by instanceId.
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
  withAuth,
} from "../lib/utils.js";

// =============================================================================
// Input Schemas
// =============================================================================

const TodosListSchema = z.object({});

const TodosAddSchema = z.object({
  text: z.string().describe("The todo text to add"),
});

const TodosToggleSchema = z.object({
  id: z.string().describe("The ID of the todo to toggle"),
});

const TodosRemoveSchema = z.object({
  id: z.string().describe("The ID of the todo to remove"),
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
 * Add a new todo item.
 */
const handleAdd = async (
  text: string,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const now = new Date().toISOString();
  const todo: Todo = {
    id: generateTodoId(),
    text,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  await store.set(todo.id, todo);

  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  return {
    data: { success: true, todo, todos },
    text: `Added todo: ${text}`,
    title: `Todos (${open})`,
  };
};

/**
 * Toggle a todo's completed status.
 */
const handleToggle = async (
  id: string,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const todo = await store.get(id);
  if (!todo) {
    return {
      data: { error: "Todo not found" },
      text: "Todo not found",
      isError: true,
    };
  }

  todo.completed = !todo.completed;
  todo.updatedAt = new Date().toISOString();
  await store.set(id, todo);

  const status = todo.completed ? "completed" : "uncompleted";
  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  return {
    data: { success: true, todo, todos },
    text: `Marked "${todo.text}" as ${status}`,
    title: `Todos (${open})`,
  };
};

/**
 * Remove a todo item.
 */
const handleRemove = async (
  id: string,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  const todo = await store.get(id);
  if (!todo) {
    return {
      data: { error: "Todo not found" },
      text: "Todo not found",
      isError: true,
    };
  }

  const todoText = todo.text;
  await store.delete(id);

  const todos = await getAllTodos(store);
  const { open } = getTodoCounts(todos);

  return {
    data: { success: true, deletedId: id, todos },
    text: `Removed todo: ${todoText}`,
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
      defaultDisplayMode: "pip",
    },
    async (_input: z.infer<typeof TodosListSchema>, context: ToolContext) => {
      return withAuth(context, async (store) => handleList(store));
    }
  );

  // Add todo
  app.tool(
    "todos_add",
    {
      description: "Add a new todo item to the list",
      input: TodosAddSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input: z.infer<typeof TodosAddSchema>, context: ToolContext) => {
      return withAuth(context, async (store) => handleAdd(input.text, store));
    }
  );

  // Toggle todo
  app.tool(
    "todos_toggle",
    {
      description: "Toggle a todo's completed status",
      input: TodosToggleSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input: z.infer<typeof TodosToggleSchema>, context: ToolContext) => {
      return withAuth(context, async (store) => handleToggle(input.id, store));
    }
  );

  // Remove todo
  app.tool(
    "todos_remove",
    {
      description: "Remove a todo item from the list",
      input: TodosRemoveSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input: z.infer<typeof TodosRemoveSchema>, context: ToolContext) => {
      return withAuth(context, async (store) => handleRemove(input.id, store));
    }
  );
};

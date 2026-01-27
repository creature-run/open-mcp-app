/**
 * Todos Tool
 *
 * Single tool for all todo operations. All actions route to the same UI.
 *
 * Actions:
 * - list: Show all todos in interactive list
 * - add: Create a new todo item
 * - toggle: Toggle a todo's completed status
 * - remove: Delete a todo item
 *
 * Todos are scoped by orgId and projectId from Creature identity.
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
// Input Schema
// =============================================================================

const TodosSchema = z.object({
  action: z
    .enum(["list", "add", "toggle", "remove"])
    .describe("Action to perform on todos"),
  text: z
    .string()
    .optional()
    .describe("Todo text - required for 'add' action"),
  id: z
    .string()
    .optional()
    .describe("Todo ID - required for 'toggle' and 'remove' actions"),
});

type TodosInput = z.infer<typeof TodosSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'list' action - show all todos.
 */
const handleList = async (store: DataStore<Todo>): Promise<ToolResult> => {
  const todos = await getAllTodos(store);
  const { total, open } = getTodoCounts(todos);

  if (total === 0) {
    return {
      data: { todos: [] },
      title: "Todos (0)",
      text: "No todos yet. Use action 'add' with text to create one.",
    };
  }

  return {
    data: { todos },
    title: `Todos (${open})`,
    text: `${total} todo(s), ${open} remaining`,
  };
};

/**
 * Handle 'add' action - create a new todo item.
 */
const handleAdd = async (
  { text }: TodosInput,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  if (!text) {
    return {
      data: { error: "text is required for 'add' action" },
      text: "text is required for 'add' action",
      isError: true,
    };
  }

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
 * Handle 'toggle' action - toggle a todo's completed status.
 */
const handleToggle = async (
  { id }: TodosInput,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  if (!id) {
    return {
      data: { error: "id is required for 'toggle' action" },
      text: "id is required for 'toggle' action",
      isError: true,
    };
  }

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
 * Handle 'remove' action - delete a todo item.
 */
const handleRemove = async (
  { id }: TodosInput,
  store: DataStore<Todo>
): Promise<ToolResult> => {
  if (!id) {
    return {
      data: { error: "id is required for 'remove' action" },
      text: "id is required for 'remove' action",
      isError: true,
    };
  }

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
 * Register the todos tool.
 *
 * Single tool for all todo operations. Results are routed to the pip
 * for UI updates.
 */
export const registerTodosTool = (app: App) => {
  app.tool(
    "todos",
    {
      description: `Manage todos. Actions:
- list: Show all todos in interactive list
- add: Create a new todo (requires text)
- toggle: Toggle completed status (requires id)
- remove: Delete a todo (requires id)`,
      input: TodosSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input: TodosInput, context: ToolContext) => {
      return withAuth(context, async (store) => {
        switch (input.action) {
          case "list":
            return handleList(store);
          case "add":
            return handleAdd(input, store);
          case "toggle":
            return handleToggle(input, store);
          case "remove":
            return handleRemove(input, store);
          default:
            return {
              data: { error: `Unknown action: ${input.action}` },
              text: `Unknown action: ${input.action}`,
              isError: true,
            };
        }
      });
    }
  );
};

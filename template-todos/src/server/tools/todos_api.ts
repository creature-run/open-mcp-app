/**
 * todos_api Tool
 *
 * Data operations tool for programmatic todo access.
 * No UI is shown - this is for AI/backend operations.
 *
 * Actions:
 * - add: Create a new todo item
 * - toggle: Toggle a todo's completed status
 * - remove: Delete a todo item
 *
 * Todos are scoped by orgId and projectId from Creature identity.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import type { DataStore } from "../lib/data.js";
import type { Todo, ToolContext, ToolResult } from "../lib/types.js";
import {
  generateTodoId,
  getAllTodos,
  getTodoCounts,
  withAuth,
} from "../lib/utils.js";

// =============================================================================
// Input Schema
// =============================================================================

const TodosApiSchema = z.object({
  action: z
    .enum(["add", "toggle", "remove"])
    .describe("Action: 'add' creates new, 'toggle' completes/uncompletes, 'remove' deletes"),
  text: z
    .string()
    .optional()
    .describe("Todo text - required for 'add' action"),
  id: z
    .string()
    .optional()
    .describe("Todo ID - required for 'toggle' and 'remove' actions"),
});

type TodosApiInput = z.infer<typeof TodosApiSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'add' action - create a new todo item.
 */
const handleAdd = async (
  { text }: TodosApiInput,
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
  { id }: TodosApiInput,
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
  { id }: TodosApiInput,
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
 * Register the todos_api tool.
 *
 * This tool performs data operations without showing UI.
 * Use for: adding todos, toggling completion, removing todos.
 */
export const registerTodosApiTool = (app: App) => {
  app.tool(
    "todos_api",
    {
      description: `Data operations on todos (no UI shown). Actions:
- add: Create a new todo item (requires text)
- toggle: Toggle completed status (requires id)
- remove: Delete a todo item (requires id)`,
      input: TodosApiSchema,
      // No UI configured - this tool doesn't show a widget
      visibility: ["model", "app"],
    },
    async (input: TodosApiInput, context: ToolContext) => {
      return withAuth(context, async (store) => {
        switch (input.action) {
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

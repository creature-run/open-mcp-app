/**
 * Todo Tool
 *
 * Handles all todo operations: list, add, toggle, remove.
 * This is the main tool exposed by the Todos MCP.
 *
 * Todos are scoped by orgId and projectId from Creature identity.
 * Each org+project combination has its own isolated set of todos.
 *
 * This is a SINGLETON MCP (multiInstance: false) - the host enforces
 * that only one pip exists for this resource, regardless of instanceId.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import { getIdentity } from "@creature-ai/sdk/server";
import { createDataStore, type DataScope, type DataStore } from "../data.js";
import { TODOS_UI_URI, type Todo, type ToolContext, type ToolResult } from "../types.js";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a unique todo ID.
 */
const generateTodoId = () =>
  `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Get all todos from a store, sorted by creation date (newest first).
 */
const getAllTodos = async (store: DataStore<Todo>) => {
  const all = await store.list();
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Extract scope from Creature identity token.
 * Returns orgId and optionally projectId for data isolation.
 * 
 * - Creature with project: Returns { orgId, projectId }
 * - ChatGPT/OAuth: Returns { orgId } only (org-level data via personal org)
 * 
 * Throws if token is missing or invalid.
 */
const extractScope = async (creatureToken?: string): Promise<DataScope> => {
  console.log(`[Todos] extractScope called with creatureToken: ${creatureToken ? 'present' : 'undefined'}`);

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
const createTodoStore = (scope: DataScope): DataStore<Todo> => {
  return createDataStore<Todo>({
    collection: "mcps_todos_todos",
    scope,
  });
};

// =============================================================================
// Input Schema
// =============================================================================

/**
 * Input schema for the consolidated `todo` tool.
 *
 * Uses a flat object with action enum instead of discriminated union.
 * This produces cleaner JSON schema that models can understand better -
 * the action field is clearly marked as required in the schema.
 *
 * Action-specific parameters are optional; the handler validates
 * that required params for each action are present.
 */
const TodoActionSchema = z.object({
  action: z
    .enum(["list", "add", "toggle", "remove"])
    .describe("Action: list (show all), add (create new), toggle (complete/uncomplete), remove (delete)"),
  text: z.string().optional().describe("Todo text (required for add)"),
  id: z.string().optional().describe("Todo ID (required for toggle/remove)"),
});

type TodoAction = z.infer<typeof TodoActionSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Context passed to action handlers.
 * Extends ToolContext with the scoped todo store.
 */
interface ActionContext extends ToolContext {
  store: DataStore<Todo>;
}

/**
 * List all todos and show the interactive UI.
 */
const handleList = async (
  _input: TodoAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  const allTodos = await getAllTodos(store);
  const openCount = allTodos.filter((t) => !t.completed).length;

  if (allTodos.length === 0) {
    return {
      data: { todos: [] },
      title: "Todos (0)",
      text: "No todos yet. Add one with action: 'add'.",
    };
  }

  return {
    data: { todos: allTodos },
    title: `Todos (${openCount})`,
    text: `${allTodos.length} todo(s), ${openCount} remaining`,
  };
};

/**
 * Add a new todo item.
 */
const handleAdd = async (
  { text }: TodoAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!text) {
    return {
      data: { error: "text is required" },
      text: "text is required for add",
      isError: true,
      noWidget: true,
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

  const allTodos = await getAllTodos(store);
  const openCount = allTodos.filter((t) => !t.completed).length;

  return {
    data: { success: true, todo, todos: allTodos },
    text: `Added todo: ${text}`,
    title: `Todos (${openCount})`,
  };
};

/**
 * Toggle a todo's completed status.
 */
const handleToggle = async (
  { id }: TodoAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!id) {
    return {
      data: { error: "id is required" },
      text: "id is required for toggle",
      isError: true,
      noWidget: true,
    };
  }

  const todo = await store.get(id);
  if (!todo) {
    return {
      data: { success: false },
      text: "Todo not found",
      isError: true,
      noWidget: true,
    };
  }

  todo.completed = !todo.completed;
  todo.updatedAt = new Date().toISOString();
  await store.set(id, todo);

  const status = todo.completed ? "completed" : "uncompleted";
  const allTodos = await getAllTodos(store);
  const openCount = allTodos.filter((t) => !t.completed).length;

  return {
    data: { success: true, todo, todos: allTodos },
    text: `Marked "${todo.text}" as ${status}`,
    title: `Todos (${openCount})`,
  };
};

/**
 * Remove a todo item.
 */
const handleRemove = async (
  { id }: TodoAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!id) {
    return {
      data: { error: "id is required" },
      text: "id is required for remove",
      isError: true,
      noWidget: true,
    };
  }

  const todo = await store.get(id);
  if (!todo) {
    return {
      data: { success: false },
      text: "Todo not found",
      isError: true,
      noWidget: true,
    };
  }

  const todoText = todo.text;
  await store.delete(id);

  const allTodos = await getAllTodos(store);
  const openCount = allTodos.filter((t) => !t.completed).length;

  return {
    data: { success: true, deletedId: id, todos: allTodos },
    text: `Removed todo: ${todoText}`,
    title: `Todos (${openCount})`,
  };
};

/**
 * Maps action names to their handlers.
 */
const actionHandlers: Record<
  TodoAction["action"],
  (input: TodoAction, ctx: ActionContext) => Promise<ToolResult>
> = {
  list: handleList,
  add: handleAdd,
  toggle: handleToggle,
  remove: handleRemove,
};

// =============================================================================
// Register Tool
// =============================================================================

/**
 * Register the todo tool with the app.
 */
export const registerTodoTool = (app: App) => {
  app.tool(
    "todo",
    {
      description: `Manage todos. Actions:
- list: List all todos and open the interactive todo list UI.
- add: Create a new todo item with the given text.
- toggle: Toggle a todo's completed status by ID.
- remove: Delete a todo item by ID.`,
      input: TodoActionSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (input: TodoAction, context: ToolContext) => {
      const handler = actionHandlers[input.action];
      if (!handler) {
        return {
          data: { error: `Unknown action: ${input.action}` },
          text: `Unknown action: ${input.action}`,
          isError: true,
        };
      }

      // Extract scope from Creature identity - throws if not authenticated
      let scope: DataScope;
      try {
        scope = await extractScope(context.creatureToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        return {
          data: { error: message },
          text: message,
          isError: true,
          noWidget: true,
        };
      }

      const store = createTodoStore(scope);

      // Extend context with the scoped store
      const actionContext: ActionContext = { ...context, store };

      return handler(input, actionContext);
    }
  );
};

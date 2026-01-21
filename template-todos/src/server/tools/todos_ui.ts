/**
 * todos_ui Tool
 *
 * UI-facing tool that launches the Todos interface.
 * Use this when you want to show the user their todo list.
 *
 * Actions:
 * - list: Show all todos in the interactive UI
 *
 * Todos are scoped by orgId and projectId from Creature identity.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import { TODOS_UI_URI, type ToolContext, type ToolResult } from "../lib/types.js";
import { getAllTodos, getTodoCounts, withAuth } from "../lib/utils.js";

// =============================================================================
// Input Schema
// =============================================================================

const TodosUiSchema = z.object({
  action: z
    .enum(["list"])
    .describe("Action: 'list' shows all todos in the interactive UI"),
});

type TodosUiInput = z.infer<typeof TodosUiSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'list' action - show all todos in UI.
 */
const handleList = async (context: ToolContext): Promise<ToolResult> => {
  return withAuth(context, async (store) => {
    const todos = await getAllTodos(store);
    const { total, open } = getTodoCounts(todos);

    if (total === 0) {
      return {
        data: { todos: [] },
        title: "Todos (0)",
        text: "No todos yet. Add one with todos_api action: 'add'.",
      };
    }

    return {
      data: { todos },
      title: `Todos (${open})`,
      text: `${total} todo(s), ${open} remaining`,
    };
  });
};

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Register the todos_ui tool.
 *
 * This tool launches the Todos UI for user interaction.
 * Use for: showing the interactive todo list.
 */
export const registerTodosUiTool = (app: App) => {
  app.tool(
    "todos_ui",
    {
      description: `Launch the Todos UI. Action:
- list: Show all todos in the interactive todo list`,
      input: TodosUiSchema,
      ui: TODOS_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
      defaultDisplayMode: "pip",
    },
    async (_input: TodosUiInput, context: ToolContext) => {
      // Only one action for now, but structured for future expansion
      return handleList(context);
    }
  );
};

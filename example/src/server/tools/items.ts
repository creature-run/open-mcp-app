/**
 * Item Tools
 *
 * All tool handlers for the Items MCP App.
 * Demonstrates various visibility patterns and proper response formats.
 */

import { z } from "zod";
import type { App } from "open-mcp-app/server";
import {
  getAllItems,
  getItem,
  saveItem,
  deleteItem,
  searchItems,
  deleteAllItems,
} from "../lib/data.js";
import { createItem, updateItem } from "../lib/utils.js";

/** UI resource URI - all tools reference this */
const ITEMS_UI = "ui://items/main";

/**
 * Register all item tools on the app.
 */
export const registerItemTools = ({ app }: { app: App }): void => {
  /**
   * items_list - List all items
   *
   * Visibility: model + app
   * - AI calls to open the list view
   * - UI calls to refresh data
   */
  app.tool(
    "items_list",
    {
      description: "List all items. Opens the visual item list.",
      input: z.object({}),
      ui: ITEMS_UI,
      visibility: ["model", "app"],
      displayModes: ["pip", "inline"],
    },
    async () => {
      const items = await getAllItems();
      const completed = items.filter((i) => i.completed).length;

      // Include item IDs in text so AI can reference them for updates/deletes
      const itemList = items
        .map((i) => `- "${i.title}" (id: ${i.id})${i.completed ? " ✓" : ""}`)
        .join("\n");

      return {
        data: { items },
        text: `${items.length} items (${completed} completed)${items.length > 0 ? `:\n${itemList}` : ""}`,
      };
    }
  );

  /**
   * items_create - Create a new item
   *
   * Visibility: model + app
   * - AI creates via chat command
   * - UI creates via form submission
   */
  app.tool(
    "items_create",
    {
      description: "Create a new item.",
      input: z.object({
        title: z.string().describe("Item title"),
        content: z.string().optional().describe("Optional item content/notes"),
      }),
      ui: ITEMS_UI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
    },
    async ({ title, content }) => {
      const item = createItem({ title, content });
      await saveItem({ item });
      const items = await getAllItems();

      return {
        data: { items },
        text: `Created "${title}" (id: ${item.id})`,
      };
    }
  );

  /**
   * items_get - Get a single item
   *
   * Visibility: app only
   * - Internal UI operation for loading detail view
   * - AI doesn't need to fetch individual items
   */
  app.tool(
    "items_get",
    {
      description: "Get a single item by ID. Used internally by UI.",
      input: z.object({
        id: z.string().describe("Item ID"),
      }),
      ui: ITEMS_UI,
      visibility: ["app"],
      displayModes: ["pip"],
    },
    async ({ id }) => {
      const item = await getItem({ id });

      if (!item) {
        return {
          data: { error: "Item not found" },
          text: "Item not found",
          isError: true,
        };
      }

      return {
        data: { item, view: "detail" },
        text: `Loaded "${item.title}"`,
      };
    }
  );

  /**
   * items_update - Update an item
   *
   * Visibility: model + app
   * - AI updates via chat command
   * - UI updates via form or toggle
   */
  app.tool(
    "items_update",
    {
      description: "Update an existing item.",
      input: z.object({
        id: z.string().describe("Item ID"),
        title: z.string().optional().describe("New title"),
        content: z.string().optional().describe("New content"),
        completed: z.boolean().optional().describe("Completion status"),
      }),
      ui: ITEMS_UI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
    },
    async ({ id, title, content, completed }) => {
      const existing = await getItem({ id });

      if (!existing) {
        return {
          data: { error: "Item not found" },
          text: "Item not found",
          isError: true,
        };
      }

      // Only include defined values to avoid overwriting with undefined
      const updates: Partial<Pick<typeof existing, "title" | "content" | "completed">> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (completed !== undefined) updates.completed = completed;

      const updated = updateItem({ item: existing, updates });
      await saveItem({ item: updated });
      const items = await getAllItems();

      // Build a helpful response
      const changes: string[] = [];
      if (title !== undefined) changes.push("renamed");
      if (content !== undefined) changes.push("updated content");
      if (completed !== undefined) {
        changes.push(completed ? "marked complete" : "marked incomplete");
      }

      return {
        data: { items, item: updated },
        text: `${changes.join(", ")} "${updated.title}"`,
      };
    }
  );

  /**
   * items_delete - Delete an item
   *
   * Visibility: model + app
   * - AI deletes via chat command
   * - UI deletes via button
   */
  app.tool(
    "items_delete",
    {
      description: "Delete an item.",
      input: z.object({
        id: z.string().describe("Item ID"),
      }),
      ui: ITEMS_UI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
    },
    async ({ id }) => {
      const existing = await getItem({ id });

      if (!existing) {
        return {
          data: { error: "Item not found" },
          text: "Item not found",
          isError: true,
        };
      }

      await deleteItem({ id });
      const items = await getAllItems();

      return {
        data: { items },
        text: `Deleted "${existing.title}"`,
      };
    }
  );

  /**
   * items_search - Search items
   *
   * Visibility: model + app
   * - AI searches via chat query
   * - UI searches via search bar
   */
  app.tool(
    "items_search",
    {
      description: "Search items by title or content.",
      input: z.object({
        query: z.string().describe("Search query"),
      }),
      ui: ITEMS_UI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
    },
    async ({ query }) => {
      const items = await searchItems({ query });

      // Include item IDs in text so AI can reference them for updates/deletes
      const itemList = items
        .map((i) => `- "${i.title}" (id: ${i.id})`)
        .join("\n");

      return {
        data: { items, searchQuery: query },
        text: `Found ${items.length} items matching "${query}"${items.length > 0 ? `:\n${itemList}` : ""}`,
      };
    }
  );

  /**
   * items_reset - Delete all items
   *
   * Visibility: model only
   * - Destructive operation, AI only
   * - Requires explicit confirmation
   */
  app.tool(
    "items_reset",
    {
      description:
        "Delete ALL items. Requires confirm: true. Use with caution - this cannot be undone.",
      input: z.object({
        confirm: z.boolean().describe("Must be true to confirm deletion"),
      }),
      ui: ITEMS_UI,
      visibility: ["model"],
      displayModes: ["pip"],
    },
    async ({ confirm }) => {
      if (!confirm) {
        return {
          data: { error: "Reset not confirmed" },
          text: "Reset cancelled. Pass confirm: true to delete all items.",
          isError: true,
        };
      }

      const count = await deleteAllItems();
      const items = await getAllItems();

      return {
        data: { items },
        text: `Deleted ${count} items`,
      };
    }
  );
};

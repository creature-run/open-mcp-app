/**
 * notes_api Tool
 *
 * Data operations tool for programmatic note access.
 * No UI is shown - this is for AI/backend operations.
 *
 * Actions:
 * - read: Get note content for AI processing
 * - save: Update existing note
 * - delete: Remove a note
 *
 * Notes are scoped by orgId and projectId from Creature identity.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import type { DataStore } from "../lib/data.js";
import type { Note, ToolContext, ToolResult } from "../lib/types.js";
import { withAuth } from "../lib/utils.js";

// =============================================================================
// Input Schema
// =============================================================================

const NotesApiSchema = z.object({
  action: z
    .enum(["read", "save", "delete"])
    .describe("Action: 'read' gets content, 'save' updates note, 'delete' removes note"),
  noteId: z
    .string()
    .describe("Note ID - required for all actions"),
  title: z
    .string()
    .optional()
    .describe("Note title - required for 'save' action"),
  content: z
    .string()
    .optional()
    .describe("Note content (markdown) - required for 'save' action"),
});

type NotesApiInput = z.infer<typeof NotesApiSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'read' action - get note content for AI.
 */
const handleRead = async (
  { noteId }: NotesApiInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  const note = await store.get(noteId);
  if (!note) {
    return {
      data: { error: "Note not found" },
      text: "Note not found",
      isError: true,
    };
  }

  return {
    data: { note },
    text: `Note "${note.title}":\n\n${note.content}`,
  };
};

/**
 * Handle 'save' action - update existing note.
 */
const handleSave = async (
  { noteId, title, content }: NotesApiInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  if (!title) {
    return {
      data: { error: "title is required for 'save' action" },
      text: "title is required for 'save' action",
      isError: true,
    };
  }
  if (content === undefined) {
    return {
      data: { error: "content is required for 'save' action" },
      text: "content is required for 'save' action",
      isError: true,
    };
  }

  const note = await store.get(noteId);
  if (!note) {
    return {
      data: { error: "Note not found" },
      text: "Note not found",
      isError: true,
    };
  }

  note.title = title;
  note.content = content;
  note.updatedAt = new Date().toISOString();
  await store.set(noteId, note);

  return {
    data: { success: true, note },
    text: `Saved note: ${note.title}`,
  };
};

/**
 * Handle 'delete' action - remove note.
 */
const handleDelete = async (
  { noteId }: NotesApiInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  const note = await store.get(noteId);
  if (!note) {
    return {
      data: { error: "Note not found" },
      text: "Note not found",
      isError: true,
    };
  }

  const title = note.title;
  await store.delete(noteId);

  return {
    data: { success: true, deletedId: noteId },
    text: `Deleted note: ${title}`,
  };
};

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Register the notes_api tool.
 * 
 * This tool performs data operations without showing UI.
 * Use for: reading note content, saving changes, deleting notes.
 */
export const registerNotesApiTool = (app: App) => {
  app.tool(
    "notes_api",
    {
      description: `Data operations on notes (no UI shown). Actions:
- read: Get note content for processing (requires noteId)
- save: Update existing note (requires noteId, title, content)
- delete: Remove a note (requires noteId)`,
      input: NotesApiSchema,
      // No UI configured - this tool doesn't show a widget
      visibility: ["model", "app"],
    },
    async (input: NotesApiInput, context: ToolContext) => {
      return withAuth(context, async (store) => {
        switch (input.action) {
          case "read":
            return handleRead(input, store);
          case "save":
            return handleSave(input, store);
          case "delete":
            return handleDelete(input, store);
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

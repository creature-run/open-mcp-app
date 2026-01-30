/**
 * Notes Tool
 *
 * Single tool for all note operations. All actions route to the same UI.
 *
 * Actions:
 * - list: Show searchable list of all notes
 * - open: Open existing note in editor
 * - create: Create new note in editor
 * - read: Get note content (for AI processing)
 * - save: Update existing note
 * - delete: Remove a note
 *
 * Notes are scoped by orgId and projectId from Creature identity.
 */

import { z } from "zod";
import type { App } from "open-mcp-app/server";
import type { DataStore } from "../lib/data.js";
import {
  NOTE_UI_URI,
  type Note,
  type NoteInstanceState,
  type ToolContext,
  type ToolResult,
} from "../lib/types.js";
import { generateNoteId, getAllNotes, withAuth } from "../lib/utils.js";

// =============================================================================
// Input Schema
// =============================================================================

const NotesSchema = z.object({
  action: z
    .enum(["list", "open", "create", "read", "save", "delete"])
    .describe("Action to perform on notes"),
  noteId: z
    .string()
    .optional()
    .describe("Note ID - required for open, read, save, delete"),
  title: z
    .string()
    .optional()
    .describe("Note title - optional for create, required for save"),
  content: z
    .string()
    .optional()
    .describe("Note content (markdown) - optional for create, required for save"),
  instanceId: z
    .string()
    .optional()
    .describe("PIP Tab instance ID. NEVER pass for 'create'. IF you already have a PIP tab open for one or mulitple noteIds,ALWAYS pass the instanceId of the PIP tab for that noteId into the 'read', 'save', 'open', 'delete' actions to target existing tab showing that note."),
});

type NotesInput = z.infer<typeof NotesSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'list' action - show all notes.
 */
const handleList = async (
  store: DataStore<Note>,
  setState: ToolContext["setState"]
): Promise<ToolResult> => {
  const allNotes = await getAllNotes(store);

  setState<NoteInstanceState & { view: string }>({ noteId: "", view: "list" });

  if (allNotes.length === 0) {
    return {
      data: { notes: [], view: "list" },
      text: "No notes yet. Use action 'create' to make one.",
      title: "All Notes",
    };
  }

  const summary = allNotes.map((n) => `- ${n.title} (${n.id})`).join("\n");

  return {
    data: {
      notes: allNotes.map((n) => ({
        id: n.id,
        title: n.title,
        updatedAt: n.updatedAt,
      })),
      view: "list",
    },
    text: `${allNotes.length} note(s):\n${summary}`,
    title: "All Notes",
  };
};

/**
 * Handle 'open' action - open existing note in editor.
 */
const handleOpen = async (
  { noteId }: NotesInput,
  store: DataStore<Note>,
  setState: ToolContext["setState"]
): Promise<ToolResult> => {
  if (!noteId) {
    return {
      data: { error: "noteId is required for 'open' action" },
      text: "noteId is required for 'open' action",
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

  setState<NoteInstanceState & { view: string }>({ noteId: note.id, view: "editor" });

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Opened note: ${note.title}`,
  };
};

/**
 * Handle 'create' action - create new note and open in editor.
 */
const handleCreate = async (
  { title, content }: NotesInput,
  store: DataStore<Note>,
  setState: ToolContext["setState"]
): Promise<ToolResult> => {
  const note: Note = {
    id: generateNoteId(),
    title: title || "Untitled",
    content: content || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.set(note.id, note);
  setState<NoteInstanceState & { view: string }>({ noteId: note.id, view: "editor" });

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Created note: ${note.title}`,
  };
};

/**
 * Handle 'read' action - get note content for AI.
 */
const handleRead = async (
  { noteId }: NotesInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  if (!noteId) {
    return {
      data: { error: "noteId is required for 'read' action" },
      text: "noteId is required for 'read' action",
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

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Note "${note.title}":\n\n${note.content}`,
  };
};

/**
 * Handle 'save' action - update existing note.
 */
const handleSave = async (
  { noteId, title, content }: NotesInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  if (!noteId) {
    return {
      data: { error: "noteId is required for 'save' action" },
      text: "noteId is required for 'save' action",
      isError: true,
    };
  }
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
    data: { success: true, note, view: "editor" },
    title: note.title,
    text: `Saved note: ${note.title}`,
  };
};

/**
 * Handle 'delete' action - remove note.
 */
const handleDelete = async (
  { noteId }: NotesInput,
  store: DataStore<Note>
): Promise<ToolResult> => {
  if (!noteId) {
    return {
      data: { error: "noteId is required for 'delete' action" },
      text: "noteId is required for 'delete' action",
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

  const title = note.title;
  await store.delete(noteId);

  // After delete, show list view
  const allNotes = await getAllNotes(store);

  return {
    data: { success: true, deletedId: noteId, notes: allNotes, view: "list" },
    title: "All Notes",
    text: `Deleted note: ${title}`,
  };
};

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Register the notes tool.
 *
 * Single tool for all note operations. Results are routed to the pip
 * for UI updates.
 */
export const registerNotesTool = (app: App) => {
  app.tool(
    "notes",
    {
      description: `Manage notes. Actions:
- list: Show all notes
- open: Open note in editor (requires noteId)
- create: Create new note (optional title/content)
    - NEVER pass instanceId for 'create' action
- read: Get note content for processing (requires noteId)
- save: Update note (requires noteId, title, content)
- delete: Remove note (requires noteId)`,
      input: NotesSchema,
      ui: NOTE_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      defaultDisplayMode: "pip",
    },
    async (input: NotesInput, context: ToolContext) => {
      return withAuth(context, async (store) => {
        switch (input.action) {
          case "list":
            return handleList(store, context.setState);
          case "open":
            return handleOpen(input, store, context.setState);
          case "create":
            return handleCreate(input, store, context.setState);
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

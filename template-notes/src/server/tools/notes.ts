/**
 * Notes Tools
 *
 * Separate tools for each note operation:
 * - notes_list: Show searchable list of all notes
 * - notes_create: Create new note (always new pip)
 * - notes_open: Open existing note in editor
 * - notes_save: Update existing note
 * - notes_delete: Remove a note
 *
 * View Routing (via views on resource):
 * - "/" → notes_list (single instance for root)
 * - "/editor" → notes_create (creates new, gets noteId from response)
 * - "/editor/:noteId" → notes_open, notes_save, notes_delete (one per noteId)
 */

import { z } from "zod";
import type { App } from "open-mcp-app/server";
import type { DataStore } from "../lib/data.js";
import {
  NOTES_UI_URI,
  type Note,
  type NoteSummary,
  type NoteInstanceState,
  type ToolContext,
  type ToolResult,
} from "../lib/types.js";
import { generateNoteId, getAllNotes, withStore } from "../lib/utils.js";

// =============================================================================
// Input Schemas
// =============================================================================

const NotesListSchema = z.object({});

const NotesCreateSchema = z.object({
  title: z.string().optional().describe("Initial title for the note"),
  content: z.string().optional().describe("Initial content (markdown)"),
});

const NotesOpenSchema = z.object({
  noteId: z.string().describe("The ID of the note to open"),
});

const NotesSaveSchema = z.object({
  noteId: z.string().describe("The ID of the note to save"),
  title: z.string().describe("The note title"),
  content: z.string().describe("The note content (markdown)"),
});

const NotesDeleteSchema = z.object({
  noteId: z.string().describe("The ID of the note to delete"),
});

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * List all notes.
 * Returns summary data for the list view.
 */
const handleList = async (
  store: DataStore<Note>,
  setState: ToolContext["setState"]
): Promise<ToolResult> => {
  const allNotes = await getAllNotes(store);

  setState<NoteInstanceState>({ view: "list" });

  const summaries: NoteSummary[] = allNotes.map((n) => ({
    id: n.id,
    title: n.title,
    updatedAt: n.updatedAt,
  }));

  if (allNotes.length === 0) {
    return {
      data: { notes: [], view: "list" },
      text: "No notes yet. Use notes_create to make one.",
      title: "All Notes",
    };
  }

  const summary = allNotes.map((n) => `- ${n.title} (${n.id})`).join("\n");

  return {
    data: { notes: summaries, view: "list" },
    text: `${allNotes.length} note(s):\n${summary}`,
    title: "All Notes",
  };
};

/**
 * Create a new note.
 * Always creates a new instance.
 */
const handleCreate = async (
  { title, content }: z.infer<typeof NotesCreateSchema>,
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
  setState<NoteInstanceState>({ noteId: note.id, view: "editor" });

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Created note: ${note.title}`,
  };
};

/**
 * Open an existing note.
 * Creates a new window only if the note isn't already open.
 */
const handleOpen = async (
  { noteId }: z.infer<typeof NotesOpenSchema>,
  store: DataStore<Note>,
  setState: ToolContext["setState"]
): Promise<ToolResult> => {
  const note = await store.get(noteId);
  if (!note) {
    return {
      data: { error: "Note not found" },
      text: "Note not found",
      isError: true,
    };
  }

  setState<NoteInstanceState>({ noteId: note.id, view: "editor" });

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Opened note: ${note.title}`,
  };
};

/**
 * Save changes to a note.
 * Routes result to existing editor pip for that noteId.
 */
const handleSave = async (
  { noteId, title, content }: z.infer<typeof NotesSaveSchema>,
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

  note.title = title;
  note.content = content;
  note.updatedAt = new Date().toISOString();
  await store.set(noteId, note);

  return {
    data: { note, view: "editor" },
    title: note.title,
    text: `Saved note: ${note.title}`,
  };
};

/**
 * Delete a note.
 * Does NOT open or change windows.
 */
const handleDelete = async (
  { noteId }: z.infer<typeof NotesDeleteSchema>,
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
 * Register all notes tools.
 *
 * Pip routing is handled by the views config on the resource. The control plane
 * finds the correct pip by matching path parameters (e.g., noteId) from tool args.
 */
export const registerNotesTools = (app: App) => {
  /**
   * List all notes in a searchable view.
   * Uses singleton instance - only one list view at a time.
   */
  app.tool(
    "notes_list",
    {
      description: "Show all notes in a searchable list view",
      input: NotesListSchema,
      ui: NOTES_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (_input: z.infer<typeof NotesListSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleList(store, context.setState));
    }
  );

  /**
   * Create a new note.
   * Always creates a new editor instance.
   */
  app.tool(
    "notes_create",
    {
      description: "Create a new note and open it in an editor",
      input: NotesCreateSchema,
      ui: NOTES_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof NotesCreateSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleCreate(input, store, context.setState));
    }
  );

  /**
   * Open an existing note.
   * Opens in a new editor window.
   */
  app.tool(
    "notes_open",
    {
      description: "Open an existing note in an editor",
      input: NotesOpenSchema,
      ui: NOTES_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input: z.infer<typeof NotesOpenSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleOpen(input, store, context.setState));
    }
  );

  /**
   * Save changes to a note.
   * Routes result to existing editor pip for that noteId.
   */
  app.tool(
    "notes_save",
    {
      description: "Save changes to an existing note",
      input: NotesSaveSchema,
      ui: NOTES_UI_URI,
      visibility: ["model", "app"],
    },
    async (input: z.infer<typeof NotesSaveSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleSave(input, store));
    }
  );

  /**
   * Delete a note.
   * No UI - doesn't open or change windows.
   */
  app.tool(
    "notes_delete",
    {
      description: "Delete a note",
      input: NotesDeleteSchema,
      visibility: ["model", "app"],
    },
    async (input: z.infer<typeof NotesDeleteSchema>, context: ToolContext) => {
      return withStore(context, async (store) => handleDelete(input, store));
    }
  );
};

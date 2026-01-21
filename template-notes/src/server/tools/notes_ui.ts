/**
 * notes_ui Tool
 *
 * UI-facing tool that launches the Notes interface.
 * Use this when you want to show the user a visual interface.
 *
 * Actions:
 * - list: Show searchable list of all notes
 * - open: Open existing note in editor
 * - create: Create new note in editor
 *
 * Notes are scoped by orgId and projectId from Creature identity.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import type { DataStore } from "../lib/data.js";
import {
  NOTE_UI_URI,
  type Note,
  type NoteInstanceState,
  type ToolContext,
  type ToolResult,
} from "../lib/types.js";
import {
  generateNoteId,
  getAllNotes,
  withAuth,
} from "../lib/utils.js";

// =============================================================================
// Input Schema
// =============================================================================

const NotesUiSchema = z.object({
  action: z
    .enum(["list", "open", "create"])
    .describe("Action: 'list' shows all notes, 'open' opens existing note, 'create' starts new note"),
  noteId: z
    .string()
    .optional()
    .describe("Note ID - required for 'open' action"),
  title: z
    .string()
    .optional()
    .describe("Initial title for 'create' action"),
  content: z
    .string()
    .optional()
    .describe("Initial content (markdown) for 'create' action"),
});

type NotesUiInput = z.infer<typeof NotesUiSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle 'list' action - show all notes in UI.
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
  { noteId }: NotesUiInput,
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
  { title, content }: NotesUiInput,
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

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Register the notes_ui tool.
 * 
 * This tool launches the Notes UI for user interaction.
 * Use for: showing note list, opening notes for editing, creating new notes.
 */
export const registerNotesUiTool = (app: App) => {
  app.tool(
    "notes_ui",
    {
      description: `Launch the Notes UI. Actions:
- list: Show searchable list of all notes
- open: Open existing note in editor (requires noteId)
- create: Create new note in editor (optional title/content)`,
      input: NotesUiSchema,
      ui: NOTE_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      defaultDisplayMode: "pip",
    },
    async (input: NotesUiInput, context: ToolContext) => {
      return withAuth(context, async (store) => {
        switch (input.action) {
          case "list":
            return handleList(store, context.setState);
          case "open":
            return handleOpen(input, store, context.setState);
          case "create":
            return handleCreate(input, store, context.setState);
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

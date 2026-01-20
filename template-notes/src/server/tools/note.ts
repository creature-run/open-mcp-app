/**
 * Note Tool
 *
 * Handles all note operations: open, read, save, list, delete.
 * This is the main tool exposed by the Notes MCP.
 *
 * Notes are scoped by orgId and projectId from Creature identity.
 * Each org+project combination has its own isolated set of notes.
 */

import { z } from "zod";
import type { App } from "@creature-ai/sdk/server";
import { getIdentity } from "@creature-ai/sdk/server";
import { createDataStore, type DataScope, type DataStore } from "../data.js";
import { NOTE_UI_URI, type Note, type NoteInstanceState, type ToolContext, type ToolResult } from "../types.js";

// =============================================================================
// Helpers
// =============================================================================

const generateNoteId = () =>
  `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Get all notes from a store, sorted by most recently updated.
 */
const getAllNotes = async (store: DataStore<Note>) => {
  const all = await store.list();
  return all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
  console.log(`[Notes] extractScope called with creatureToken: ${creatureToken ? 'present' : 'undefined'}`);
  
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
 * Create a scoped note store based on identity.
 */
const createNoteStore = (scope: DataScope): DataStore<Note> => {
  return createDataStore<Note>({
    collection: "mcps_notes_notes",
    scope,
  });
};

// =============================================================================
// Input Schema
// =============================================================================

const NoteActionSchema = z.object({
  action: z
    .enum(["open", "read", "save", "list", "delete"])
    .describe("Action: open (create/open), read (get content), save (update), list (all), delete"),
  noteId: z.string().optional().describe("Note ID - required for read/save/delete, optional for open (omit to create new)"),
  title: z.string().optional().describe("Note title - provide with open to set initial title, required for save"),
  content: z.string().optional().describe("Note content (markdown) - provide with open to set initial content, required for save"),
  instanceId: z.string().optional().describe("Widget instance ID - pass to target an existing open note widget"),
});

type NoteAction = z.infer<typeof NoteActionSchema>;

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Context passed to action handlers.
 * Extends ToolContext with the scoped note store.
 */
interface ActionContext extends ToolContext {
  store: DataStore<Note>;
}

const handleOpen = async (
  { noteId, title, content }: NoteAction,
  { setState, store }: ActionContext
): Promise<ToolResult> => {
  // Open existing note
  if (noteId) {
    const note = await store.get(noteId);
    if (!note) {
      return { data: { error: "Note not found" }, text: "Note not found", isError: true };
    }
    setState<NoteInstanceState>({ noteId: note.id });
    return { data: { note }, title: note.title, text: `Opened note: ${note.title}` };
  }

  // Create new note
  const note: Note = {
    id: generateNoteId(),
    title: title || "Untitled",
    content: content || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.set(note.id, note);
  setState<NoteInstanceState>({ noteId: note.id });

  return { data: { note }, title: note.title, text: `Created note: ${note.title}` };
};

const handleRead = async (
  { noteId }: NoteAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!noteId) {
    return { data: { error: "noteId is required" }, text: "noteId is required for read", isError: true, noWidget: true };
  }

  const note = await store.get(noteId);
  if (!note) {
    return { data: { error: "Note not found" }, text: "Note not found", isError: true, noWidget: true };
  }

  return {
    data: { note },
    text: `Note "${note.title}":\n\n${note.content}`,
    noWidget: true, // Read-only, don't create PIP
  };
};

const handleSave = async (
  { noteId, title, content }: NoteAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!noteId) {
    return { data: { error: "noteId is required" }, text: "noteId is required for save", isError: true, noWidget: true };
  }
  if (!title) {
    return { data: { error: "title is required" }, text: "title is required for save", isError: true, noWidget: true };
  }
  if (content === undefined) {
    return { data: { error: "content is required" }, text: "content is required for save", isError: true, noWidget: true };
  }

  const note = await store.get(noteId);
  if (!note) {
    return { data: { success: false, error: "Note not found" }, text: "Note not found", isError: true, noWidget: true };
  }

  note.title = title;
  note.content = content;
  note.updatedAt = new Date().toISOString();
  await store.set(noteId, note);

  // Save updates existing note, doesn't create new PIP
  // The existing PIP receives the update via WebSocket/state
  return { data: { success: true, note }, title: note.title, text: `Saved note: ${note.title}`, noWidget: true };
};

const handleList = async (
  _input: NoteAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  const allNotes = await getAllNotes(store);

  if (allNotes.length === 0) {
    return { data: { notes: [] }, text: "No notes yet. Create one with action: 'open'.", noWidget: true };
  }

  const summary = allNotes.map((n) => `- ${n.title} (${n.id})`).join("\n");

  return {
    data: {
      notes: allNotes.map((n) => ({
        id: n.id,
        title: n.title,
        updatedAt: n.updatedAt,
      })),
    },
    text: `${allNotes.length} note(s):\n${summary}`,
    noWidget: true, // List is read-only, don't create PIP
  };
};

const handleDelete = async (
  { noteId }: NoteAction,
  { store }: ActionContext
): Promise<ToolResult> => {
  if (!noteId) {
    return { data: { error: "noteId is required" }, text: "noteId is required for delete", isError: true, noWidget: true };
  }

  const note = await store.get(noteId);
  if (!note) {
    return { data: { success: false }, text: "Note not found", isError: true, noWidget: true };
  }

  const title = note.title;
  await store.delete(noteId);

  return { data: { success: true, deletedId: noteId }, text: `Deleted note: ${title}`, noWidget: true };
};

const actionHandlers: Record<
  NoteAction["action"],
  (input: NoteAction, ctx: ActionContext) => Promise<ToolResult>
> = {
  open: handleOpen,
  read: handleRead,
  save: handleSave,
  list: handleList,
  delete: handleDelete,
};

// =============================================================================
// Register Tool
// =============================================================================

/**
 * Register the note tool with the app.
 */
export const registerNoteTool = (app: App) => {
  app.tool(
    "note",
    {
      description: `Manage notes. Actions:
- open: Open/create note with editor UI. Pass noteId to open existing, OR pass title+content to create new with initial values.
- read: Get note content WITHOUT opening UI. Use before editing to avoid overwriting user changes.
- save: Update existing note. Requires noteId, title, content. Use read first if user may have edited in UI.
- list: List all notes with IDs and titles.
- delete: Remove a note by ID.`,
      input: NoteActionSchema,
      ui: NOTE_UI_URI,
      visibility: ["model", "app"],
      displayModes: ["pip"],
      defaultDisplayMode: "pip",
    },
    async (input: NoteAction, context: ToolContext) => {
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

      const store = createNoteStore(scope);

      // Extend context with the scoped store
      const actionContext: ActionContext = { ...context, store };

      return handler(input, actionContext);
    }
  );
};

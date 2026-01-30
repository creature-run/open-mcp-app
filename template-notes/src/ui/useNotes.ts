/**
 * useNotes Hook
 *
 * Encapsulates all notes state management, tool calls, and side effects.
 * Separates data/logic concerns from rendering in NotesApp.
 *
 * Responsibilities:
 * - State management (view, note, notes, saving status)
 * - Tool call setup and execution
 * - Processing tool results from agent and UI
 * - Widget state persistence and restoration
 * - Initial data fetching
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { useHost } from "open-mcp-app/react";
import type { MilkdownEditorRef } from "./MilkdownEditor";
import type { Note, NoteSummary, NoteData, NoteWidgetState, ViewType } from "./types";

/**
 * Return type for the useNotes hook.
 * Provides everything needed to render the notes UI.
 */
export interface UseNotesReturn {
  /** Current view mode */
  view: ViewType;
  /** Currently loaded note (for editor view) */
  note: Note | null;
  /** List of note summaries (for list view) */
  notes: NoteSummary[];
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Ref to Milkdown editor for imperative updates */
  editorRef: React.RefObject<MilkdownEditorRef | null>;
  /** Save a note with new title and content */
  saveNote: (noteId: string, title: string, content: string) => Promise<void>;
  /** Open a note by ID */
  openNote: (noteId: string) => Promise<void>;
  /** Create a new note */
  createNote: () => Promise<void>;
  /** Refresh the notes list (for polling) */
  refreshList: () => Promise<void>;
}

/**
 * Custom hook for notes state management and tool interactions.
 *
 * Handles all the complexity of:
 * - Managing view state (list vs editor)
 * - Setting up tool callers
 * - Processing tool results from both agent and UI sources
 * - Widget state persistence for session continuity
 * - Initial data fetching with proper race condition handling
 */
export const useNotes = (): UseNotesReturn => {
  // View and data state
  const [view, setView] = useState<ViewType>("list");
  const [note, setNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for tracking state across renders
  const instanceIdRef = useRef<string | null>(null);
  const hasLoggedReady = useRef(false);
  const hasInitiallyFetched = useRef(false);
  const lastSavedContentRef = useRef<string | null>(null);
  const hasRestoredState = useRef(false);

  /** Ref to the Milkdown editor for imperative content updates */
  const editorRef = useRef<MilkdownEditorRef>(null);

  // Get host APIs from context
  const {
    callTool,
    isReady,
    log,
    exp_widgetState,
    onToolResult,
    environment: hostEnvironment,
  } = useHost();

  // Widget state for persistence
  const [widgetState, setWidgetState] = exp_widgetState<NoteWidgetState>();

  // Tool callers
  const [listTool, listState] = callTool<NoteData>("notes_list");
  const [createTool] = callTool<NoteData>("notes_create");
  const [openTool, openState] = callTool<NoteData>("notes_open");
  const [saveTool] = callTool<NoteData>("notes_save");

  /**
   * Process incoming note data from any source (agent or UI tool calls).
   * Updates view, notes list, or note editor based on the data shape.
   */
  const processNoteData = useCallback(
    (data: NoteData | null) => {
      if (!data) return;

      // Track instanceId for routing
      if (data.instanceId) {
        instanceIdRef.current = data.instanceId;
      }

      // List view data - switch to list and update notes
      if (data.view === "list" && data.notes) {
        setView("list");
        setNotes(data.notes);
        log.debug("List view updated", { count: data.notes.length });
        return;
      }

      // Editor view data - switch to editor and load note
      if (data.note) {
        setView("editor");
        const noteData = data.note;
        const isNewNote = note?.id !== noteData.id;

        if (isNewNote) {
          setNote(noteData);
          lastSavedContentRef.current = noteData.content;
          log.debug("Note loaded", { id: noteData.id, title: noteData.title });
        } else {
          // Same note - check for external update
          const isExternalUpdate = noteData.content !== lastSavedContentRef.current;
          if (isExternalUpdate) {
            setNote(noteData);
            editorRef.current?.setContent(noteData.content);
            lastSavedContentRef.current = noteData.content;
            log.debug("Note updated externally", { id: noteData.id });
          } else {
            // Our own save result - just update metadata
            setNote(noteData);
          }
        }
      }
    },
    [log, note?.id]
  );

  // ===========================================================================
  // Action Callbacks
  // ===========================================================================

  /**
   * Save a note via tool call.
   */
  const saveNote = useCallback(
    async (noteId: string, newTitle: string, newContent: string) => {
      setIsSaving(true);
      lastSavedContentRef.current = newContent;
      try {
        await saveTool({
          noteId,
          title: newTitle,
          content: newContent,
        });
        setLastSaved(new Date());
        log.debug("Note saved", { noteId, title: newTitle });
      } catch (err) {
        log.error("Failed to save note", { error: String(err) });
      } finally {
        setIsSaving(false);
      }
    },
    [saveTool, log]
  );

  /**
   * Open a note by ID via tool call.
   */
  const openNote = useCallback(
    async (noteId: string) => {
      try {
        await openTool({ noteId });
        log.debug("Opening note", { noteId });
      } catch (err) {
        log.error("Failed to open note", { error: String(err) });
      }
    },
    [openTool, log]
  );

  /**
   * Create a new note via tool call.
   */
  const createNote = useCallback(async () => {
    try {
      await createTool({});
      log.debug("Creating new note");
    } catch (err) {
      log.error("Failed to create note", { error: String(err) });
    }
  }, [createTool, log]);

  /**
   * Refresh the notes list (for polling).
   * Silent - no logging to keep console clean.
   */
  const refreshList = useCallback(async () => {
    try {
      await listTool({});
    } catch {
      // Silent failure for polling
    }
  }, [listTool]);

  // ===========================================================================
  // Effects
  // ===========================================================================

  /**
   * Log when connection is ready.
   */
  useEffect(() => {
    if (isReady && !hasLoggedReady.current) {
      hasLoggedReady.current = true;
      log.info("Notes app connected", { environment: hostEnvironment });
    }
  }, [isReady, log, hostEnvironment]);

  /**
   * Fetch initial data when ready and in list view.
   *
   * Only fetches if the current view is "list" when isReady becomes true.
   * This prevents overwriting editor view when pip is opened via agent tool call
   * (e.g., notes_create sets view to "editor" via onToolResult before isReady).
   *
   * If pip opens to editor view (agent tool call), the list fetch is skipped.
   * When user later navigates to list view, this effect re-runs and fetches.
   */
  useEffect(() => {
    if (isReady && !hasInitiallyFetched.current && view === "list") {
      hasInitiallyFetched.current = true;
      listTool();
    }
  }, [isReady, listTool, view]);

  /**
   * Subscribe to agent-initiated tool calls.
   * When the agent calls a tool (not the UI), we receive a tool-result notification.
   */
  useEffect(() => {
    return onToolResult((result) => {
      if (result.source === "agent") {
        processNoteData(result.structuredContent as unknown as NoteData);
      }
    });
  }, [onToolResult, processNoteData]);

  /**
   * Handle data from UI-initiated list tool calls.
   */
  useEffect(() => {
    processNoteData(listState.data);
  }, [listState.data, processNoteData]);

  /**
   * Handle data from UI-initiated open tool calls.
   */
  useEffect(() => {
    processNoteData(openState.data);
  }, [openState.data, processNoteData]);

  /**
   * Restore from widget state on mount.
   * Shows previous state immediately while fresh data loads.
   */
  useEffect(() => {
    if (hasRestoredState.current || !widgetState?.privateContent) {
      return;
    }
    hasRestoredState.current = true;

    const { lastView, lastNote, lastNotes } = widgetState.privateContent;

    if (lastView === "list" && lastNotes) {
      setNotes(lastNotes);
      log.debug("List restored from widget state");
    } else if (lastView === "editor" && lastNote) {
      setView("editor");
      setNote(lastNote);
      log.debug("Note restored from widget state", { id: lastNote.id });
    }
  }, [widgetState, log]);

  /**
   * Persist state to widget state for session continuity.
   */
  useEffect(() => {
    if (view === "list") {
      setWidgetState({
        modelContent: {
          view: "list",
          noteCount: notes.length,
        },
        privateContent: {
          lastNote: null,
          lastNotes: notes,
          lastView: "list",
        },
      });
    } else if (view === "editor" && note) {
      const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;
      setWidgetState({
        modelContent: {
          view: "editor",
          noteId: note.id,
          noteTitle: note.title,
          wordCount,
        },
        privateContent: {
          lastNote: note,
          lastNotes: notes,
          lastView: "editor",
        },
      });
    }
  }, [view, note, notes, setWidgetState]);

  return {
    view,
    note,
    notes,
    isSaving,
    lastSaved,
    editorRef,
    saveNote,
    openNote,
    createNote,
    refreshList,
  };
};

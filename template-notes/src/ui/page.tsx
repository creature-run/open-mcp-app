/**
 * MCP Notes UI
 *
 * A notes app demonstrating multi-instance MCP Apps.
 *
 * Views:
 * - List view: Searchable list of all notes
 * - Editor view: WYSIWYG markdown editor for a single note
 *
 * Features:
 * - Unified editor: edit markdown and see formatted preview in one view
 * - Saves via tool calls (compatible with ChatGPT Apps)
 * - Auto-save on edit with debouncing
 * - Full markdown support via Milkdown
 *
 * SDK hooks used:
 * - useToolResult: Receive note data from tool calls
 * - useHost: Connect to host, call tools, and persist widget state
 * - initStyles: Inject environment-specific CSS variable defaults
 */

// MUST be first - injects environment-specific CSS variable defaults before CSS loads
import { detectEnvironment, initStyles } from "@creature-ai/sdk/core";
initStyles({ environment: detectEnvironment() });

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useHost, useToolResult } from "@creature-ai/sdk/react";
import MilkdownEditor, { type MilkdownEditorRef } from "./MilkdownEditor";
import "./styles.css";

// =============================================================================
// Types
// =============================================================================

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteSummary {
  id: string;
  title: string;
  updatedAt: string;
}

type ViewType = "list" | "editor";

interface NoteData {
  note?: Note;
  notes?: NoteSummary[];
  view?: ViewType;
  success?: boolean;
  error?: string;
  instanceId?: string;
}

interface NoteWidgetState {
  /** Concise summary for the agent - enough context to interact */
  modelContent: {
    view: ViewType;
    noteId?: string;
    noteTitle?: string;
    wordCount?: number;
    noteCount?: number;
  };
  /** UI-only state for persistence - not visible to agent */
  privateContent: {
    lastNote: Note | null;
    lastNotes: NoteSummary[] | null;
    lastView: ViewType;
  };
}

// =============================================================================
// List View Component
// =============================================================================

interface ListViewProps {
  notes: NoteSummary[];
  onOpenNote: (noteId: string) => void;
  onCreateNote: () => void;
}

/**
 * List view showing all notes with search/filter.
 */
function ListView({ notes, onOpenNote, onCreateNote }: ListViewProps) {
  const [search, setSearch] = useState("");

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const query = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(query));
  }, [notes, search]);

  /**
   * Format relative time.
   */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="list-container">
      <header className="list-header">
        <h1 className="list-title">Notes</h1>
        <button className="create-button" onClick={onCreateNote}>
          + New Note
        </button>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          {notes.length === 0 ? (
            <>
              <p>No notes yet</p>
              <button className="create-button-large" onClick={onCreateNote}>
                Create your first note
              </button>
            </>
          ) : (
            <p>No notes match "{search}"</p>
          )}
        </div>
      ) : (
        <ul className="notes-list">
          {filteredNotes.map((note) => (
            <li
              key={note.id}
              className="note-item"
              onClick={() => onOpenNote(note.id)}
            >
              <span className="note-item-title">{note.title || "Untitled"}</span>
              <span className="note-item-time">{formatTime(note.updatedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// Editor View Component
// =============================================================================

interface EditorViewProps {
  note: Note;
  onSave: (noteId: string, title: string, content: string) => void;
  onBack: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  editorRef: React.RefObject<MilkdownEditorRef | null>;
}

/**
 * Editor view for editing a single note.
 */
function EditorView({
  note,
  onSave,
  onBack,
  isSaving,
  lastSaved,
  editorRef,
}: EditorViewProps) {
  const [title, setTitle] = useState(note.title);
  const contentRef = useRef(note.content);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Sync title state when note changes (e.g., switching notes).
   */
  useEffect(() => {
    setTitle(note.title);
    contentRef.current = note.content;
  }, [note.id, note.title, note.content]);

  /**
   * Debounced save function.
   */
  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        onSave(note.id, newTitle, newContent);
        saveTimerRef.current = null;
      }, 800);
    },
    [note.id, onSave]
  );

  /**
   * Handle title changes.
   */
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      debouncedSave(newTitle, contentRef.current);
    },
    [debouncedSave]
  );

  /**
   * Handle content changes.
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      contentRef.current = newContent;
      debouncedSave(title, newContent);
    },
    [title, debouncedSave]
  );

  /**
   * Format last saved time.
   */
  const lastSavedText = useMemo(() => {
    if (!lastSaved) return null;
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  }, [lastSaved]);

  return (
    <div className="note-container">
      <header className="note-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <input
          type="text"
          className="note-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          autoComplete="off"
        />
        <div className="note-status">
          {isSaving && <span className="saving">Saving...</span>}
          {!isSaving && lastSavedText && (
            <span className="saved">{lastSavedText}</span>
          )}
        </div>
      </header>

      <div className="note-editor-container">
        <MilkdownEditor
          ref={editorRef}
          key={note.id}
          defaultValue={note.content}
          onChange={handleContentChange}
          placeholder="Write your note in markdown..."
        />
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function Page() {
  const [view, setView] = useState<ViewType>("editor");
  const [note, setNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /**
   * The instanceId from the host, used to route tool results to this pip.
   */
  const instanceIdRef = useRef<string | null>(null);
  const hasLoggedReady = useRef(false);

  /**
   * Tracks content for detecting external updates.
   */
  const lastSavedContentRef = useRef<string | null>(null);

  /** Ref to the Milkdown editor for imperative content updates */
  const editorRef = useRef<MilkdownEditorRef>(null);

  const { data, onToolResult } = useToolResult<NoteData>();

  /**
   * Connect to host and get widget state for persistence.
   */
  const { callTool, isReady, log, widgetState, setWidgetState } = useHost({
    name: "mcp-template-notes",
    version: "0.1.0",
    onToolResult,
  });

  const typedWidgetState = widgetState as NoteWidgetState | null;

  /**
   * Save note via tool call.
   */
  const saveNote = useCallback(
    async (noteId: string, newTitle: string, newContent: string) => {
      setIsSaving(true);
      lastSavedContentRef.current = newContent;
      try {
        await callTool("notes", {
          action: "save",
          noteId,
          title: newTitle,
          content: newContent,
          instanceId: instanceIdRef.current ?? undefined,
        });
        setLastSaved(new Date());
        log.debug("Note saved", { noteId, title: newTitle });
      } catch (err) {
        log.error("Failed to save note", { error: String(err) });
      } finally {
        setIsSaving(false);
      }
    },
    [callTool, log]
  );

  /**
   * Open a note by ID.
   */
  const openNote = useCallback(
    async (noteId: string) => {
      try {
        await callTool("notes", {
          action: "open",
          noteId,
          instanceId: instanceIdRef.current ?? undefined,
        });
        log.debug("Opening note", { noteId });
      } catch (err) {
        log.error("Failed to open note", { error: String(err) });
      }
    },
    [callTool, log]
  );

  /**
   * Create a new note.
   */
  const createNote = useCallback(async () => {
    try {
      await callTool("notes", {
        action: "create",
        instanceId: instanceIdRef.current ?? undefined,
      });
      log.debug("Creating new note");
    } catch (err) {
      log.error("Failed to create note", { error: String(err) });
    }
  }, [callTool, log]);

  /**
   * Go back to list view.
   */
  const goToList = useCallback(async () => {
    try {
      await callTool("notes", {
        action: "list",
        instanceId: instanceIdRef.current ?? undefined,
      });
      log.debug("Navigating to list");
    } catch (err) {
      log.error("Failed to load list", { error: String(err) });
    }
  }, [callTool, log]);

  /**
   * Log when connection is ready.
   */
  useEffect(() => {
    if (isReady && !hasLoggedReady.current) {
      hasLoggedReady.current = true;
      log.info("Notes app connected");
    }
  }, [isReady, log]);

  /**
   * Handle data from tool results.
   */
  useEffect(() => {
    if (!data) return;

    // Extract instanceId from data
    if (data.instanceId) {
      instanceIdRef.current = data.instanceId;
    }

    // Determine view from data
    if (data.view === "list" && data.notes) {
      setView("list");
      setNotes(data.notes);
      setNote(null);
      log.debug("List view loaded", { count: data.notes.length });
    } else if (data.note) {
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
  }, [data, log, note?.id]);

  /**
   * Restore from widget state if no data.
   */
  useEffect(() => {
    if (!data && typedWidgetState?.privateContent) {
      const { lastView, lastNote, lastNotes } = typedWidgetState.privateContent;

      if (lastView === "list" && lastNotes) {
        setView("list");
        setNotes(lastNotes);
        log.debug("List restored from widget state");
      } else if (lastView === "editor" && lastNote) {
        setView("editor");
        setNote(lastNote);
        log.debug("Note restored from widget state", { id: lastNote.id });
      }
    }
  }, [typedWidgetState, data, log]);

  /**
   * Persist state to widget state.
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
    } else if (note) {
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

  // Render appropriate view
  if (view === "list") {
    return (
      <ListView
        notes={notes}
        onOpenNote={openNote}
        onCreateNote={createNote}
      />
    );
  }

      if (note) {
    return (
      <EditorView
        note={note}
        onSave={saveNote}
        onBack={goToList}
        isSaving={isSaving}
        lastSaved={lastSaved}
        editorRef={editorRef}
      />
    );
  }

  // Loading state
  return (
    <div className="loading-container">
      <p>Loading...</p>
    </div>
  );
}

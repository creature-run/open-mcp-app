/**
 * MCP Notes UI
 *
 * A WYSIWYG markdown note editor demonstrating multi-instance MCP apps.
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

interface NoteData {
  note?: Note;
  success?: boolean;
  error?: string;
}

interface NoteWidgetState {
  /** Concise summary for the agent - enough context to interact with this note */
  modelContent: {
    noteId: string;
    noteTitle: string;
    wordCount: number;
  };
  /** UI-only state for persistence - not visible to agent */
  privateContent: {
    lastNote: Note | null;
  };
}

// =============================================================================
// Main Component
// =============================================================================

export default function Page() {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /**
   * The instanceId from the host, used to route tool results to this pip.
   * Using a ref instead of state to avoid closure/timing issues in callbacks.
   * Refs are always current when accessed, unlike state captured in closures.
   */
  const instanceIdRef = useRef<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoggedReady = useRef(false);

  /**
   * Tracks the current note ID to detect when a new note is loaded.
   * Using a ref instead of depending on `note` state prevents effect re-runs
   * when we update `note` within the effect.
   */
  const currentNoteIdRef = useRef<string | null>(null);

  /**
   * Tracks the content the UI last saved.
   * Used to distinguish between our own save result (content matches)
   * and agent-initiated saves (content differs).
   */
  const lastSavedContentRef = useRef<string | null>(null);

  /** Ref to the Milkdown editor for imperative content updates */
  const editorRef = useRef<MilkdownEditorRef>(null);

  const { data, onToolResult } = useToolResult<NoteData>();

  /**
   * Connect to host and get widget state for persistence.
   * widgetState is restored by the host on PIP refresh/popout.
   * setWidgetState persists data and notifies the host.
   */
  const { callTool, isReady, log, widgetState, setWidgetState } = useHost({
    name: "mcp-template-notes",
    version: "0.1.0",
    onToolResult,
  });

  // Cast widget state to our expected type
  const typedWidgetState = widgetState as NoteWidgetState | null;

  /**
   * Save note via tool call.
   * This is the MCP Apps pattern - UI calls tools to update server state.
   * The result comes back via onToolResult callback.
   */
  const saveNote = useCallback(
    async (noteId: string, newTitle: string, newContent: string) => {
      setIsSaving(true);
      lastSavedContentRef.current = newContent;
      try {
        await callTool("note", {
          action: "save",
          noteId,
          title: newTitle,
          content: newContent,
          instanceId: instanceIdRef.current ?? undefined,
        });
        // Result will come back via onToolResult, updating `data`
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
   * Debounced save function.
   * Saves after user stops typing for 800ms.
   */
  const debouncedSave = useCallback(
    (noteId: string, newTitle: string, newContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveNote(noteId, newTitle, newContent);
        saveTimerRef.current = null;
      }, 800);
    },
    [saveNote]
  );

  /**
   * Log when connection is ready.
   */
  useEffect(() => {
    if (isReady && !hasLoggedReady.current) {
      hasLoggedReady.current = true;
      log.info("Note editor connected");
    }
  }, [isReady, log]);

  /**
   * Handle data from tool results (initial load and saves).
   * Updates local state when tool returns note data.
   *
   * Uses `currentNoteIdRef` instead of `note` state to detect new notes,
   * preventing effect re-runs when we update `note` within the effect.
   *
   * For the same note, we compare result content against what the UI last saved:
   * - If content matches our last save: ignore (prevents feedback loop / cursor jumps)
   * - If content differs: apply update via editor's imperative setContent method
   */
  useEffect(() => {
    if (data?.note) {
      const noteData = data.note;

      // Extract instanceId from structuredContent (sibling to note)
      // Using a ref so it's immediately available in callbacks without re-render
      const dataWithInstance = data as NoteData & { instanceId?: string };
      if (dataWithInstance.instanceId) {
        instanceIdRef.current = dataWithInstance.instanceId;
      }

      // Check if this is a different note using ref (not state)
      const isNewNote = currentNoteIdRef.current !== noteData.id;

      if (isNewNote) {
        currentNoteIdRef.current = noteData.id;
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.content);
        // Initialize to current content so subsequent same-content results are ignored
        lastSavedContentRef.current = noteData.content;
        log.debug("Note loaded", { id: noteData.id, title: noteData.title });
      } else {
        // Same note - check if content changed externally (agent update)
        const isExternalUpdate = noteData.content !== lastSavedContentRef.current;

        if (isExternalUpdate) {
          // Agent or external source updated the note
          // Update React state for metadata
          setNote(noteData);
          setTitle(noteData.title);

          // Imperatively update the editor content (doesn't trigger onChange)
          editorRef.current?.setContent(noteData.content);
          contentRef.current = noteData.content;
          // Track this content so we ignore our own save echo
          lastSavedContentRef.current = noteData.content;

          log.debug("Note updated by agent", { id: noteData.id, title: noteData.title });
        } else {
          // Our own save result - just update metadata, don't touch content
          setNote(noteData);
        }
      }
    }
  }, [data, log]);

  /**
   * Restore from widget state if no data (e.g., on pip refresh).
   */
  useEffect(() => {
    const savedNote = typedWidgetState?.privateContent?.lastNote;

    if (savedNote && !note) {
      setNote(savedNote);
      setTitle(savedNote.title);
      setContent(savedNote.content);
      log.debug("Note restored from widget state", { id: savedNote.id });
    }
  }, [typedWidgetState, note, log]);

  /**
   * Persist note to widget state when it changes.
   * modelContent provides concise context for the agent to interact with this note.
   * privateContent stores the full note for UI restoration on refresh/popout.
   */
  useEffect(() => {
    if (note) {
      const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;
      setWidgetState({
        modelContent: {
          noteId: note.id,
          noteTitle: note.title,
          wordCount,
        },
        privateContent: {
          lastNote: note,
        },
      });
    }
  }, [note, setWidgetState]);

  /**
   * Handle title changes.
   */
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (note) {
        debouncedSave(note.id, newTitle, contentRef.current);
      }
    },
    [note, debouncedSave]
  );

  /**
   * Track current content for saves (editor is uncontrolled).
   * Sync ref when content state changes (new note loaded).
   */
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  /**
   * Handle content changes from Milkdown editor.
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      contentRef.current = newContent;
      if (note) {
        debouncedSave(note.id, title, newContent);
      }
    },
    [note, title, debouncedSave]
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
      {/* Header */}
      <header className="note-header">
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

      {/* Unified WYSIWYG Editor - keyed by note ID to reset on note change */}
      <div className="note-editor-container">
        {note && (
          <MilkdownEditor
            ref={editorRef}
            key={note.id}
            defaultValue={content}
            onChange={handleContentChange}
            placeholder="Write your note in markdown..."
          />
        )}
      </div>
    </div>
  );
}

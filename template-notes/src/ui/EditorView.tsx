/**
 * EditorView Component
 *
 * WYSIWYG markdown editor for a single note.
 * Features auto-save with debouncing and external update detection.
 *
 * Uses NotesContext to access state and actions directly,
 * eliminating the need for prop drilling.
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import MilkdownEditor from "./MilkdownEditor";
import { useNotesContext } from "./useNotes";

/**
 * Editor view for editing a single note.
 * Auto-saves changes with 800ms debounce.
 *
 * Note: This component expects `note` to be non-null when rendered.
 * The parent (NotesApp) only renders EditorView when a note is loaded.
 */
export function EditorView() {
  const { note, saveNote, isSaving, lastSaved, editorRef } = useNotesContext();

  // Initialize with empty strings - will be synced via effect when note is available
  const [title, setTitle] = useState(note?.title ?? "");
  const contentRef = useRef(note?.content ?? "");
  const titleRef = useRef(note?.title ?? ""); // Ref for stable callback access
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Sync title state and refs when note changes (e.g., switching notes).
   */
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      titleRef.current = note.title;
      contentRef.current = note.content;
    }
  }, [note?.id, note?.title, note?.content]);

  /**
   * Debounced save function.
   * Waits 800ms after last change before saving.
   */
  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!note) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveNote(note.id, newTitle, newContent);
        saveTimerRef.current = null;
      }, 800);
    },
    [note, saveNote]
  );

  /**
   * Handle title input changes.
   */
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      titleRef.current = newTitle; // Keep ref in sync for content changes
      debouncedSave(newTitle, contentRef.current);
    },
    [debouncedSave]
  );

  /**
   * Handle content changes from Milkdown editor.
   * Uses titleRef instead of title state to avoid stale closure issues
   * with MilkdownEditor's internal callback handling.
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      contentRef.current = newContent;
      debouncedSave(titleRef.current, newContent);
    },
    [debouncedSave]
  );

  /**
   * Format last saved time for display.
   */
  const lastSavedText = useMemo(() => {
    if (!lastSaved) return null;
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  }, [lastSaved]);

  // Early return if no note (shouldn't happen - parent checks this)
  if (!note) {
    return null;
  }

  return (
    <div className="note-container">
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

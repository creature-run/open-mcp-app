/**
 * EditorView Component
 *
 * WYSIWYG markdown editor for a single note.
 * Features auto-save with debouncing and external update detection.
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import MilkdownEditor, { type MilkdownEditorRef } from "./MilkdownEditor";
import type { Note } from "./types";

interface EditorViewProps {
  note: Note;
  onSave: (noteId: string, title: string, content: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  editorRef: React.RefObject<MilkdownEditorRef | null>;
}

/**
 * Editor view for editing a single note.
 * Auto-saves changes with 800ms debounce.
 */
export function EditorView({
  note,
  onSave,
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
   * Waits 800ms after last change before saving.
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
   * Handle title input changes.
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
   * Handle content changes from Milkdown editor.
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      contentRef.current = newContent;
      debouncedSave(title, newContent);
    },
    [title, debouncedSave]
  );

  /**
   * Format last saved time for display.
   */
  const lastSavedText = useMemo(() => {
    if (!lastSaved) return null;
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  }, [lastSaved]);

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

/**
 * DetailView Component
 *
 * Detail view for editing a single todo's notes with markdown support.
 * Features auto-save with debouncing.
 */

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import MilkdownEditor, { type MilkdownEditorRef } from "./MilkdownEditor";
import type { Todo } from "./types";

interface DetailViewProps {
  todo: Todo;
  onSave: (id: string, text: string, notes: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

/**
 * Detail view for editing a single todo.
 * Auto-saves changes with 800ms debounce.
 */
export function DetailView({
  todo,
  onSave,
  onToggle,
  onBack,
  isSaving,
  lastSaved,
}: DetailViewProps) {
  const [text, setText] = useState(todo.text);
  const notesRef = useRef(todo.notes ?? "");
  const textRef = useRef(todo.text);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<MilkdownEditorRef>(null);

  /**
   * Sync state when todo changes.
   */
  useEffect(() => {
    setText(todo.text);
    textRef.current = todo.text;
    notesRef.current = todo.notes ?? "";
  }, [todo.id, todo.text, todo.notes]);

  /**
   * Debounced save function.
   */
  const debouncedSave = useCallback(
    (newText: string, newNotes: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        onSave(todo.id, newText, newNotes);
        saveTimerRef.current = null;
      }, 800);
    },
    [todo.id, onSave]
  );

  /**
   * Handle text input changes.
   */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newText = e.target.value;
      setText(newText);
      textRef.current = newText;
      debouncedSave(newText, notesRef.current);
    },
    [debouncedSave]
  );

  /**
   * Handle notes changes from Milkdown editor.
   */
  const handleNotesChange = useCallback(
    (newNotes: string) => {
      notesRef.current = newNotes;
      debouncedSave(textRef.current, newNotes);
    },
    [debouncedSave]
  );

  /**
   * Handle toggle click.
   */
  const handleToggle = useCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  /**
   * Format last saved time for display.
   */
  const lastSavedText = useMemo(() => {
    if (!lastSaved) return null;
    return `Saved ${lastSaved.toLocaleTimeString()}`;
  }, [lastSaved]);

  return (
    <div className="detail-container">
      <header className="detail-header">
        <button
          className="back-button"
          onClick={onBack}
          title="Back to todo list"
          aria-label="Back to todo list"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div
          className={`detail-checkbox ${todo.completed ? "completed" : ""}`}
          onClick={handleToggle}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <input
          type="text"
          className="detail-title"
          value={text}
          onChange={handleTextChange}
          placeholder="Todo title..."
          autoComplete="off"
          maxLength={250}
        />
        <div className="detail-status">
          {isSaving && <span className="saving">Saving...</span>}
          {!isSaving && lastSavedText && (
            <span className="saved">{lastSavedText}</span>
          )}
        </div>
      </header>

      <div className="detail-editor-container">
        <MilkdownEditor
          ref={editorRef}
          key={todo.id}
          defaultValue={todo.notes ?? ""}
          onChange={handleNotesChange}
          placeholder="Add notes (supports markdown)..."
        />
      </div>
    </div>
  );
}

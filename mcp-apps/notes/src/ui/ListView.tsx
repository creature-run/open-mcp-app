/**
 * ListView Component
 *
 * Displays a searchable list of all notes with polling for updates.
 * Handles empty state with a prompt to create the first note.
 *
 * Uses NotesContext to access state and actions directly,
 * eliminating the need for prop drilling.
 */

import { useEffect, useState, useMemo } from "react";
import { useNotesContext } from "./useNotes";

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago").
 */
const formatRelativeTime = (dateStr: string): string => {
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

/**
 * List view showing all notes with search/filter.
 * Polls for updates every 5 seconds.
 */
export function ListView() {
  const { notes, openNote, createNote, refreshList } = useNotesContext();
  const [search, setSearch] = useState("");

  /**
   * Poll for new notes every 5 seconds.
   * Silent - no logging to keep console clean.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refreshList();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshList]);

  /**
   * Filter notes by search query (case-insensitive title match).
   */
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const query = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(query));
  }, [notes, search]);

  return (
    <div className="list-container">
      <header className="list-header">
        <h1 className="list-title">Notes</h1>
        <button className="create-button" onClick={createNote}>
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
              <button className="create-button-large" onClick={createNote}>
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
              onClick={() => openNote(note.id)}
            >
              <span className="note-item-title">{note.title || "Untitled"}</span>
              <span className="note-item-time">{formatRelativeTime(note.updatedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

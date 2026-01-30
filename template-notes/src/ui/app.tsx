/**
 * MCP Notes UI
 *
 * A notes app demonstrating cross-platform multi-instance MCP Apps.
 *
 * Cross-Platform Compatibility:
 * - Works in Creature (MCP Apps host)
 * - Works in ChatGPT Apps
 * - Works in any generic MCP Apps host
 *
 * Views:
 * - List view: Searchable list of all notes (polls for updates)
 * - Editor view: WYSIWYG markdown editor for a single note
 *
 * Features:
 * - Unified editor: edit markdown and see formatted preview in one view
 * - Saves via tool calls (compatible with all hosts)
 * - Auto-save on edit with debouncing
 * - Full markdown support via Milkdown
 * - List view polls every 5 seconds for new notes
 *
 * SDK hooks used:
 * - HostProvider: Provides host client to child components via context
 * - useHost: Access callTool, isReady, log, exp_widgetState from context
 * - initDefaultStyles: Inject environment-specific CSS variable defaults
 *
 * File Structure:
 * - app.tsx: Entry point with HostProvider and NotesApp
 * - useNotes.ts: Custom hook with all state, tools, and effects
 * - ListView.tsx: List view component
 * - EditorView.tsx: Editor view component
 * - types.ts: Type definitions
 */

// MUST be first - injects environment-specific CSS variable defaults before CSS loads
import { detectEnvironment, initDefaultStyles } from "open-mcp-app/core";
const environment = detectEnvironment();
initDefaultStyles({ environment });

import { HostProvider } from "open-mcp-app/react";
import { useNotes } from "./useNotes";
import { ListView } from "./ListView";
import { EditorView } from "./EditorView";
import "./styles.css";

/**
 * Main notes app entry point.
 *
 * Wraps NotesApp with HostProvider to provide host client via context.
 * The HostProvider handles connection to the MCP Apps host and provides
 * the useHost hook for child components.
 */
export default function App() {
  return (
    <HostProvider name="mcp-template-notes" version="0.1.0">
      <NotesApp />
    </HostProvider>
  );
}

/**
 * Notes app component.
 *
 * Thin rendering layer that delegates all state management to useNotes hook.
 * Simply decides which view to render based on the current state.
 */
function NotesApp() {
  const {
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
  } = useNotes();

  // Render editor view if editing a note
  if (view === "editor" && note) {
    return (
      <EditorView
        note={note}
        onSave={saveNote}
        isSaving={isSaving}
        lastSaved={lastSaved}
        editorRef={editorRef}
      />
    );
  }

  // Default: list view (handles empty state gracefully)
  return (
    <ListView
      notes={notes}
      onOpenNote={openNote}
      onCreateNote={createNote}
      onRefresh={refreshList}
    />
  );
}

/**
 * Detail View Component
 *
 * Displays a single item with editing and delete functionality.
 * Uses Tailwind 4 with SDK theme mapping for host-provided variables.
 */

import { useState, useCallback, useEffect } from "react";
import { useHost } from "open-mcp-app/react";
import type { Item } from "./types";

interface DetailViewProps {
  item: Item;
  onBack: () => void;
  isInline?: boolean;
}

/**
 * Detail view for a single item.
 */
export function DetailView({ item, onBack, isInline }: DetailViewProps) {
  const { callTool } = useHost();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tool callers
  const [updateItem, updateState] = callTool<{ items: Item[] }>("items_update");
  const [deleteItem, deleteState] = callTool<{ items: Item[] }>("items_delete");

  const isLoading = updateState.status === "loading" || deleteState.status === "loading";

  // Reset form when item changes
  useEffect(() => {
    setTitle(item.title);
    setContent(item.content ?? "");
  }, [item.id, item.title, item.content]);

  // Track save completion
  useEffect(() => {
    if (updateState.status === "success" && isSaving) {
      setIsSaving(false);
      setLastSaved(new Date());
    }
  }, [updateState.status, isSaving]);

  /**
   * Handle saving edits.
   */
  const handleSave = useCallback(async () => {
    if (isLoading) return;
    setIsSaving(true);
    await updateItem({
      id: item.id,
      title: title.trim() || item.title,
      content: content.trim() || "",
    });
  }, [item.id, item.title, title, content, isLoading, updateItem]);

  /**
   * Handle toggling completion.
   */
  const handleToggle = useCallback(() => {
    updateItem({ id: item.id, completed: !item.completed });
  }, [item.id, item.completed, updateItem]);

  /**
   * Handle delete.
   */
  const handleDelete = useCallback(async () => {
    if (isLoading) return;
    await deleteItem({ id: item.id });
    onBack();
  }, [item.id, isLoading, deleteItem, onBack]);

  /**
   * Format relative time for last saved.
   */
  const formatSavedTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Inline mode: Summary card
  if (isInline) {
    return (
      <div className="p-3 bg-bg-primary text-txt-primary">
        <h2 className="text-sm font-medium text-txt-primary truncate">
          {item.completed && <span className="text-txt-success mr-1">✓</span>}
          {item.title}
        </h2>
        {item.content && (
          <p className="text-xs text-txt-secondary mt-1 line-clamp-2">{item.content}</p>
        )}
      </div>
    );
  }

  // Pip mode: Full detail view
  return (
    <div className="flex flex-col h-full bg-bg-primary text-txt-primary">
      {/* Header with back button and status */}
      <header className="flex-none flex items-center gap-2 px-4 py-3 border-b border-bdr-secondary">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded hover:bg-bg-secondary text-txt-secondary"
          title="Back to list"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-base font-medium truncate">Edit Item</h1>
        {isSaving ? (
          <span className="text-xs text-txt-tertiary">Saving...</span>
        ) : lastSaved ? (
          <span className="text-xs text-txt-tertiary">Saved {formatSavedTime(lastSaved)}</span>
        ) : null}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-4">
          {/* Completion toggle */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-md border transition-colors ${
              item.completed
                ? "bg-bg-secondary border-bdr-secondary"
                : "bg-bg-secondary border-bdr-secondary hover:border-bdr-primary"
            }`}
          >
            <div
              className={`w-4 h-4 border-[1.5px] rounded-sm flex items-center justify-center shrink-0 ${
                item.completed
                  ? "bg-bg-inverse border-bg-inverse"
                  : "border-bdr-primary"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 stroke-txt-inverse stroke-[3] fill-none ${item.completed ? "opacity-100" : "opacity-0"}`}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className={`text-sm ${item.completed ? "text-txt-secondary line-through" : "text-txt-primary"}`}>
              {item.completed ? "Completed" : "Mark complete"}
            </span>
          </button>

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full py-2 px-3 bg-bg-secondary border border-bdr-secondary rounded-md text-txt-primary text-sm outline-none focus:border-ring-primary placeholder:text-txt-tertiary"
              disabled={isLoading}
            />
          </div>

          {/* Content textarea */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              rows={8}
              className="w-full py-2 px-3 bg-bg-secondary border border-bdr-secondary rounded-md text-txt-primary text-sm outline-none focus:border-ring-primary placeholder:text-txt-tertiary resize-none"
              placeholder="Add notes..."
              disabled={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer with delete */}
      <footer className="flex-none px-4 py-3 border-t border-bdr-secondary">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-txt-secondary">Delete this item?</span>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-txt-danger bg-bg-secondary border border-bdr-secondary rounded-md hover:bg-bg-tertiary disabled:opacity-50"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm text-txt-secondary border border-bdr-secondary rounded-md hover:bg-bg-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-txt-secondary hover:text-txt-primary"
          >
            Delete item
          </button>
        )}
      </footer>
    </div>
  );
}

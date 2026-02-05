/**
 * Detail View Component
 *
 * Demonstrates:
 * - Back navigation via tool call
 * - Edit form with tool calls
 * - Delete confirmation
 * - Inline mode summary rendering
 */

import { useState, useCallback } from "react";
import { useHost } from "open-mcp-app/react";
import type { Item } from "./types";

interface DetailViewProps {
  item: Item;
  onBack: () => void;
  isInline?: boolean;
}

/**
 * Detail view for a single item.
 *
 * Inline: Summary card (read-only)
 * Pip: Full editor with actions
 */
export function DetailView({ item, onBack, isInline }: DetailViewProps) {
  const { callTool } = useHost();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tool callers
  const [updateItem, updateState] = callTool<{ items: Item[] }>("items_update");
  const [deleteItem, deleteState] = callTool<{ items: Item[] }>("items_delete");

  const isLoading =
    updateState.status === "loading" || deleteState.status === "loading";

  /**
   * Handle saving edits.
   */
  const handleSave = useCallback(async () => {
    if (isLoading) return;

    await updateItem({
      id: item.id,
      title: title.trim() || item.title,
      content: content.trim() || undefined,
    });
    setIsEditing(false);
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
   * Cancel editing and reset form.
   */
  const handleCancel = useCallback(() => {
    setTitle(item.title);
    setContent(item.content ?? "");
    setIsEditing(false);
  }, [item.title, item.content]);

  // Format date for display
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Inline mode: Summary card
  if (isInline) {
    return (
      <div className="p-3 bg-bg-primary text-txt-primary">
        <h2 className="text-sm font-medium text-txt-primary truncate">
          {item.completed && (
            <span className="text-txt-success mr-1">✓</span>
          )}
          {item.title}
        </h2>
        {item.content && (
          <p className="text-xs text-txt-secondary mt-1 line-clamp-2">
            {item.content}
          </p>
        )}
        <p className="text-xs text-txt-tertiary mt-2">
          Created {formatDate(item.createdAt)}
        </p>
      </div>
    );
  }

  // Pip mode: Full detail view
  return (
    <div className="flex flex-col h-full bg-bg-primary text-txt-primary">
      {/* Header with back button */}
      <header className="flex-none flex items-center gap-3 px-4 py-3 border-b border-bdr-secondary">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded hover:bg-bg-secondary"
          title="Back to list"
        >
          <svg
            className="w-5 h-5 text-txt-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="flex-1 text-base font-medium truncate">
          {isEditing ? "Edit Item" : item.title}
        </h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm text-txt-secondary border border-bdr-secondary rounded-md hover:bg-bg-secondary"
          >
            Edit
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          // Edit form
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-secondary text-txt-primary border border-bdr-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ring-primary"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm bg-bg-secondary text-txt-primary border border-bdr-primary rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring-primary"
                placeholder="Add notes..."
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-txt-primary text-txt-inverse rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-txt-secondary border border-bdr-secondary rounded-md hover:bg-bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <div className="space-y-4">
            {/* Completion toggle */}
            <button
              onClick={handleToggle}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                item.completed
                  ? "bg-bg-success border-bdr-success text-txt-success"
                  : "bg-bg-secondary border-bdr-secondary text-txt-secondary hover:border-bdr-primary"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  item.completed
                    ? "bg-txt-success border-txt-success text-txt-inverse"
                    : "border-current"
                }`}
              >
                {item.completed && (
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm">
                {item.completed ? "Completed" : "Mark complete"}
              </span>
            </button>

            {/* Content */}
            {item.content ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-txt-primary whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            ) : (
              <p className="text-sm text-txt-tertiary italic">
                No content added
              </p>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-bdr-tertiary space-y-1 text-xs text-txt-tertiary">
              <p>Created: {formatDate(item.createdAt)}</p>
              <p>Updated: {formatDate(item.updatedAt)}</p>
              {item.completedAt && (
                <p>Completed: {formatDate(item.completedAt)}</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer with delete */}
      {!isEditing && (
        <footer className="flex-none px-4 py-3 border-t border-bdr-tertiary">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-txt-danger">Delete this item?</span>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium bg-bg-danger text-txt-danger border border-bdr-danger rounded-md hover:opacity-90 disabled:opacity-50"
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
              className="text-sm text-txt-danger hover:underline"
            >
              Delete item
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

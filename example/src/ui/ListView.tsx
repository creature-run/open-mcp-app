/**
 * List View Component
 *
 * Demonstrates:
 * - Display mode responsive rendering (inline vs pip)
 * - Tool calls from UI (create, toggle, search)
 * - Host-themed styling with Tailwind
 */

import { useState, useCallback } from "react";
import { useHost } from "open-mcp-app/react";
import type { Item } from "./types";

interface ListViewProps {
  items: Item[];
  onOpenItem: (id: string) => void;
  isInline?: boolean;
}

/**
 * List view with display mode responsive rendering.
 *
 * Inline: Read-only summary, no interactions
 * Pip: Full interactive list with add form and actions
 */
export function ListView({ items, onOpenItem, isInline }: ListViewProps) {
  const { callTool } = useHost();
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Tool callers
  const [createItem, createState] = callTool<{ items: Item[] }>("items_create");
  const [updateItem] = callTool<{ items: Item[] }>("items_update");
  const [searchItems] = callTool<{ items: Item[] }>("items_search");

  const isLoading = createState.status === "loading";

  /**
   * Handle creating a new item.
   */
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim() || isLoading) return;

      await createItem({ title: newTitle.trim() });
      setNewTitle("");
    },
    [newTitle, isLoading, createItem]
  );

  /**
   * Handle toggling item completion.
   */
  const handleToggle = useCallback(
    (item: Item) => {
      updateItem({ id: item.id, completed: !item.completed });
    },
    [updateItem]
  );

  /**
   * Handle search.
   */
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      searchItems({ query: searchQuery.trim() });
    },
    [searchQuery, searchItems]
  );

  // Inline mode: Read-only summary
  if (isInline) {
    const completedCount = items.filter((i) => i.completed).length;
    const displayItems = items.slice(0, 5);

    return (
      <div className="p-3 bg-bg-primary text-txt-primary">
        <h2 className="text-sm font-medium text-txt-primary mb-2">
          Items ({items.length})
          {completedCount > 0 && (
            <span className="text-txt-secondary ml-1">
              · {completedCount} done
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-txt-tertiary">No items yet</p>
        ) : (
          <div className="space-y-1">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="text-sm truncate text-txt-secondary"
              >
                <span className={item.completed ? "text-txt-tertiary" : ""}>
                  {item.completed ? "✓ " : "○ "}
                  {item.title}
                </span>
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-xs text-txt-tertiary mt-1">
                +{items.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pip mode: Full interactive view
  return (
    <div className="flex flex-col h-full bg-bg-primary text-txt-primary">
      {/* Header with add form */}
      <header className="flex-none p-4 border-b border-bdr-secondary">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add new item..."
            className="flex-1 px-3 py-2 text-sm bg-bg-secondary text-txt-primary border border-bdr-primary rounded-md placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium bg-txt-primary text-txt-inverse rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="flex-1 px-3 py-1.5 text-sm bg-bg-secondary text-txt-primary border border-bdr-secondary rounded-md placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-ring-primary"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="px-3 py-1.5 text-sm text-txt-secondary border border-bdr-secondary rounded-md hover:bg-bg-secondary disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </header>

      {/* Item list */}
      <main className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-txt-tertiary">
            <p className="text-sm">No items yet</p>
            <p className="text-xs mt-1">Add one above or ask the AI to help</p>
          </div>
        ) : (
          <ul className="divide-y divide-bdr-tertiary">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary cursor-pointer group"
                onClick={() => onOpenItem(item.id)}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(item);
                  }}
                  className={`flex-none w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.completed
                      ? "bg-txt-success border-txt-success text-txt-inverse"
                      : "border-bdr-primary hover:border-txt-primary"
                  }`}
                >
                  {item.completed && (
                    <svg
                      className="w-3 h-3"
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
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      item.completed
                        ? "text-txt-tertiary line-through"
                        : "text-txt-primary"
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.content && (
                    <p className="text-xs text-txt-tertiary truncate mt-0.5">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* Arrow indicator */}
                <svg
                  className="w-4 h-4 text-txt-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Footer with count */}
      <footer className="flex-none px-4 py-2 border-t border-bdr-tertiary text-xs text-txt-tertiary">
        {items.length} items · {items.filter((i) => i.completed).length}{" "}
        completed
      </footer>
    </div>
  );
}

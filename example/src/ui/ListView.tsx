/**
 * List View Component
 *
 * Displays the item list with add form and search.
 * Uses Tailwind 4 with SDK theme mapping for host-provided variables.
 */

import { useState, useCallback, useRef } from "react";
import { useHost } from "open-mcp-app/react";
import type { Item } from "./types";

interface ListViewProps {
  items: Item[];
  onOpenItem: (id: string) => void;
  isInline?: boolean;
}

/**
 * Item row component.
 */
function ItemRow({
  item,
  onToggle,
  onDelete,
  onOpen,
}: {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".item-checkbox") || target.closest(".item-delete")) {
        return;
      }
      onOpen(item.id);
    },
    [item.id, onOpen]
  );

  return (
    <div
      className={`flex items-center gap-2.5 p-2 px-2.5 bg-bg-secondary border border-bdr-secondary rounded-md cursor-pointer transition-colors hover:bg-bg-tertiary ${item.completed ? "completed" : ""}`}
      onClick={handleClick}
    >
      <div
        className={`item-checkbox w-4 h-4 border-[1.5px] border-bdr-primary rounded-sm cursor-pointer flex items-center justify-center shrink-0 transition-all hover:border-ring-primary ${item.completed ? "bg-bg-inverse border-bg-inverse" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 stroke-txt-inverse stroke-[3] fill-none ${item.completed ? "opacity-100" : "opacity-0"}`}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className={`break-words text-sm ${item.completed ? "line-through text-txt-secondary" : ""}`}>
          {item.title}
        </span>
        {item.content && <span className="text-xs text-txt-tertiary">Has content</span>}
      </div>
      <button
        className="item-delete w-6 h-6 border-none bg-transparent text-txt-secondary cursor-pointer rounded-sm flex items-center justify-center transition-all shrink-0 hover:bg-bg-tertiary hover:text-txt-primary"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        title="Delete"
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Item list with empty state.
 */
function ItemList({
  items,
  onToggle,
  onDelete,
  onOpen,
}: {
  items: Item[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        <div className="flex-1 flex flex-col items-center justify-center text-txt-secondary gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-12 h-12 opacity-50"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-base">No items yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col mt-2 gap-2 scrollbar-thin">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

/**
 * Add item form.
 */
function AddItemForm({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onAdd(title.trim());
        setTitle("");
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, isSubmitting, onAdd]
  );

  return (
    <form className="flex gap-2 items-stretch" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-tertiary w-3 h-3 pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new item..."
          autoComplete="off"
          disabled={isSubmitting}
          maxLength={250}
          className="w-full py-2 pl-8 pr-3 bg-bg-secondary border border-bdr-secondary rounded-md text-txt-primary font-inherit text-sm outline-none focus:border-ring-primary placeholder:text-txt-secondary"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="px-4 bg-bg-inverse border border-transparent rounded-md text-txt-inverse font-inherit text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </form>
  );
}

/**
 * Search bar with debounce.
 */
function SearchBar({
  onSearch,
  onClear,
}: {
  onSearch: (query: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!value.trim()) {
        onClear();
        return;
      }

      debounceRef.current = setTimeout(() => {
        onSearch(value.trim());
      }, 300);
    },
    [onSearch, onClear]
  );

  return (
    <div className="pt-2 pb-3 mb-2 -mx-4 px-4 border-b border-bdr-secondary shrink-0">
      <div className="relative w-full">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-tertiary w-3 h-3"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search items..."
          autoComplete="off"
          className="w-full py-2 pl-8 pr-3 bg-bg-secondary border border-bdr-secondary rounded-md text-sm text-txt-primary outline-none focus:border-ring-primary placeholder:text-txt-secondary"
        />
      </div>
    </div>
  );
}

/**
 * List view with display mode responsive rendering.
 */
export function ListView({ items, onOpenItem, isInline }: ListViewProps) {
  const { callTool } = useHost();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Item[] | null>(null);

  // Tool callers
  const [createItem] = callTool<{ items: Item[] }>("items_create");
  const [updateItem] = callTool<{ items: Item[] }>("items_update");
  const [deleteItem] = callTool<{ items: Item[] }>("items_delete");
  const [searchItems] = callTool<{ items: Item[]; searchQuery: string }>("items_search");

  /**
   * Handle creating a new item.
   */
  const handleAdd = useCallback(
    async (title: string) => {
      await createItem({ title });
    },
    [createItem]
  );

  /**
   * Handle toggling item completion.
   */
  const handleToggle = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        updateItem({ id, completed: !item.completed });
      }
    },
    [items, updateItem]
  );

  /**
   * Handle deleting an item.
   */
  const handleDelete = useCallback(
    (id: string) => {
      deleteItem({ id });
    },
    [deleteItem]
  );

  /**
   * Handle search.
   */
  const handleSearch = useCallback(
    async (query: string) => {
      setIsSearchMode(true);
      const result = await searchItems({ query });
      if (result?.structuredContent?.items) {
        setSearchResults(result.structuredContent.items);
      }
    },
    [searchItems]
  );

  /**
   * Handle clearing search.
   */
  const handleClearSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults(null);
  }, []);

  // Inline mode: Read-only summary
  if (isInline) {
    const completedCount = items.filter((i) => i.completed).length;
    const displayItems = items.slice(0, 5);

    return (
      <div className="p-3 bg-bg-primary text-txt-primary">
        <h2 className="text-sm font-medium text-txt-primary mb-2">
          Items ({items.length})
          {completedCount > 0 && (
            <span className="text-txt-secondary ml-1">· {completedCount} done</span>
          )}
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-txt-tertiary">No items yet</p>
        ) : (
          <div className="space-y-1">
            {displayItems.map((item) => (
              <div key={item.id} className="text-sm truncate text-txt-secondary">
                <span className={item.completed ? "text-txt-tertiary" : ""}>
                  {item.completed ? "✓ " : "○ "}
                  {item.title}
                </span>
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-xs text-txt-tertiary mt-1">+{items.length - 5} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const displayItems = isSearchMode && searchResults ? searchResults : items;

  // Pip mode: Full interactive view
  return (
    <div className="flex flex-col h-full py-3 px-4 gap-1 bg-bg-primary text-txt-primary">
      <header className="flex items-baseline justify-between shrink-0">
        <h1 className="text-lg font-medium m-0 pb-2">Items</h1>
        <span className="text-txt-secondary text-xs">
          {isSearchMode && searchResults
            ? `${searchResults.length} found`
            : items.length === 0
              ? "No items"
              : `${completedCount}/${items.length} done`}
        </span>
      </header>

      <AddItemForm onAdd={handleAdd} />

      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      {isSearchMode && searchResults && searchResults.length === 0 ? (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          <div className="flex-1 flex flex-col items-center justify-center text-txt-secondary gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="w-12 h-12 opacity-50"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>No results</span>
          </div>
        </div>
      ) : (
        <ItemList
          items={displayItems}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onOpen={onOpenItem}
        />
      )}
    </div>
  );
}

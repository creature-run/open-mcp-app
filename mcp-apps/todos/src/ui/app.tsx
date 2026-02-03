/**
 * MCP Todos UI
 *
 * A clean, interactive todo list with detail view for editing notes.
 *
 * Cross-Platform Compatibility:
 * - Works in Creature (MCP Apps host)
 * - Works in ChatGPT Apps
 * - Works in any generic MCP Apps host
 *
 * Views:
 * - List view: Shows all todos with add, toggle, and delete
 * - Detail view: WYSIWYG markdown editor for todo notes
 *
 * Features:
 * - Add, toggle, and delete todos
 * - Click a todo to edit its notes (markdown supported)
 * - Full-text search with SQLite FTS5 (in Creature)
 * - Persists via tool calls to the server
 *
 * SDK hooks used:
 * - HostProvider: Provides host client to child components via context
 * - useHost: Access callTool, isReady, log, etc. from context
 */

import { useEffect, useCallback, useState, useRef, type FormEvent } from "react";
import { HostProvider, useHost, type Environment } from "open-mcp-app/react";
import { DetailView } from "./DetailView";
import type { Todo, TodoData, SearchResultData, TodoWidgetState, View } from "./types";
// Base styles provide SDK layout variables (spacing, containers, controls)
// Host-provided spec variables (colors, typography) are applied during initialization
import "open-mcp-app/styles/base.css";
import "./styles.css";

// =============================================================================
// List View Components
// =============================================================================

/**
 * Single todo item component with checkbox and delete button.
 * Clicking the item (not checkbox) opens detail view.
 */
function TodoItem({
  todo,
  onToggle,
  onDelete,
  onOpen,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't open if clicking checkbox or delete button
      const target = e.target as HTMLElement;
      if (target.closest(".todo-checkbox") || target.closest(".todo-delete")) {
        return;
      }
      onOpen(todo.id);
    },
    [todo.id, onOpen]
  );

  return (
    <div
      className={`todo-item ${todo.completed ? "completed" : ""}`}
      onClick={handleClick}
    >
      <div
        className="todo-checkbox"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo.id);
        }}
      >
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="todo-content">
        <span className="todo-text">{todo.text}</span>
        {todo.notes && <span className="todo-has-notes">Has notes</span>}
      </div>
      <button
        className="todo-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
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
 * Todo list component that renders all todos or an empty state.
 */
function TodoList({
  todos,
  onToggle,
  onDelete,
  onOpen,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  if (todos.length === 0) {
    return (
      <div className="todo-list">
        <div className="empty-state">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>No todos yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

/**
 * Form component for adding new todos.
 */
function AddTodoForm({ onAdd }: { onAdd: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!text.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onAdd(text.trim());
        setText("");
      } finally {
        setIsSubmitting(false);
      }
    },
    [text, isSubmitting, onAdd]
  );

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        autoComplete="off"
        disabled={isSubmitting}
        maxLength={250}
      />
      <button type="submit" disabled={isSubmitting || !text.trim()}>
        Add
      </button>
    </form>
  );
}

/**
 * Search bar component for full-text search.
 */
function SearchBar({
  onSearch,
  onClear,
  isSearching,
}: {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
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

  const handleClear = useCallback(() => {
    setQuery("");
    onClear();
  }, [onClear]);

  return (
    <div className="search-container">
      <div className="search-field">
        <svg
          className="search-icon"
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
          className="search-input"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search todos..."
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            title="Clear search"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {isSearching && <span className="search-status">Searching...</span>}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function getEnvironmentLabel(env: Environment): string {
  switch (env) {
    case "chatgpt":
      return "ChatGPT";
    case "mcp-apps":
      return "MCP Apps";
    case "standalone":
      return "Standalone";
  }
}

export default function App() {
  return (
    <HostProvider name="todos" version="0.1.0">
      <TodoApp />
    </HostProvider>
  );
}

/**
 * Inner todo app component that handles both list and detail views.
 */
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [view, setView] = useState<View>("list");
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultData | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const hasInitialized = useRef(false);
  const hasRestoredState = useRef(false);

  const { callTool, isReady, log, exp, exp_widgetState, onToolResult, environment: hostEnvironment } = useHost();

  const [widgetState, setWidgetState] = exp_widgetState<TodoWidgetState>();

  // Tool callers
  const [listTodos, listState] = callTool<TodoData>("todos_list");
  const [addTodo, addState] = callTool<TodoData>("todos_add");
  const [toggleTodo, toggleState] = callTool<TodoData>("todos_toggle");
  const [removeTodo, removeState] = callTool<TodoData>("todos_remove");
  const [searchTodos, searchState] = callTool<SearchResultData>("todos_search");
  const [updateTodo, updateState] = callTool<TodoData>("todos_update");
  const [getTodo] = callTool<TodoData>("todos_get");

  /**
   * Restore todos from widget state on mount.
   */
  useEffect(() => {
    if (hasRestoredState.current || !widgetState?.privateContent?.todos) {
      return;
    }
    hasRestoredState.current = true;
    const savedTodos = widgetState.privateContent.todos;
    if (savedTodos.length > 0) {
      log.debug("Restoring todos from widget state", { count: savedTodos.length });
      setTodos(savedTodos);
    }
  }, [widgetState, log]);

  /**
   * Update todos from tool result data.
   */
  const updateTodosFromData = useCallback(
    (data: TodoData | null) => {
      if (data?.todos) {
        setTodos(data.todos);
        log.debug("Todos updated", { count: data.todos.length });

        const incompleteCount = data.todos.filter((t: Todo) => !t.completed).length;
        setWidgetState({
          modelContent: {
            countTotal: data.todos.length,
            countIncomplete: incompleteCount,
          },
          privateContent: {
            todos: data.todos,
            lastViewedAt: new Date().toISOString(),
          },
        });
      }

      // Handle detail view data
      if (data?.todo && data?.view === "detail") {
        setSelectedTodo(data.todo);
        setView("detail");
      }
    },
    [log, setWidgetState]
  );

  // Update todos when tool calls return
  useEffect(() => updateTodosFromData(listState.data), [listState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(addState.data), [addState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(toggleState.data), [toggleState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(removeState.data), [removeState.data, updateTodosFromData]);

  // Handle update result - also update selected todo if in detail view
  useEffect(() => {
    if (updateState.data) {
      updateTodosFromData(updateState.data);
      if (updateState.data.updated && selectedTodo?.id === updateState.data.updated.id) {
        // Find full todo from list
        const updatedTodo = updateState.data.todos?.find(t => t.id === selectedTodo.id);
        if (updatedTodo) {
          setSelectedTodo(updatedTodo);
        }
      }
      setIsSaving(false);
      setLastSaved(new Date());
    }
  }, [updateState.data, updateTodosFromData, selectedTodo?.id]);

  // Update search results
  useEffect(() => {
    if (searchState.data) {
      setSearchResults(searchState.data);
      if (searchState.data.todos) {
        setTodos(searchState.data.todos);
      }
    }
  }, [searchState.data]);

  /**
   * Subscribe to agent-initiated tool calls.
   */
  useEffect(() => {
    return onToolResult((result) => {
      if (result.source === "agent") {
        updateTodosFromData(result.structuredContent as unknown as TodoData);
      }
    });
  }, [onToolResult, updateTodosFromData]);

  /**
   * Initialize app when host is ready.
   */
  useEffect(() => {
    if (!isReady || hasInitialized.current) return;
    hasInitialized.current = true;

    log.info("Todo list connected", { environment: hostEnvironment });

    const initialResult = exp.getInitialToolResult();
    if (initialResult) {
      log.debug("Initialized from agent tool result");
      const data = initialResult.structuredContent as unknown as TodoData;
      updateTodosFromData(data);
    } else {
      log.debug("Initialized by user - fetching list");
      listTodos();
    }
  }, [isReady, exp, log, hostEnvironment, updateTodosFromData, listTodos]);

  /**
   * Add a new todo.
   */
  const handleAdd = useCallback(
    async (text: string) => {
      log.info("Adding todo", { text });
      try {
        await addTodo({ items: [{ text }] });
      } catch (err) {
        log.error("Failed to add todo", { error: String(err) });
      }
    },
    [addTodo, log]
  );

  /**
   * Toggle a todo's completed status.
   */
  const handleToggle = useCallback(
    async (id: string) => {
      try {
        await toggleTodo({ ids: [id] });
      } catch (err) {
        log.error("Failed to toggle todo", { id, error: String(err) });
      }
    },
    [toggleTodo, log]
  );

  /**
   * Delete a todo.
   */
  const handleDelete = useCallback(
    async (id: string) => {
      log.info("Deleting todo", { id });
      try {
        await removeTodo({ ids: [id] });
      } catch (err) {
        log.error("Failed to delete todo", { id, error: String(err) });
      }
    },
    [removeTodo, log]
  );

  /**
   * Open a todo in detail view.
   */
  const handleOpen = useCallback(
    async (id: string) => {
      log.info("Opening todo", { id });
      // First try to find in local state for instant feedback
      const localTodo = todos.find(t => t.id === id);
      if (localTodo) {
        setSelectedTodo(localTodo);
        setView("detail");
      }
      // Then fetch full data (with notes)
      try {
        const result = await getTodo({ id });
        if (result?.todo) {
          setSelectedTodo(result.todo);
        }
      } catch (err) {
        log.error("Failed to get todo", { id, error: String(err) });
      }
    },
    [todos, getTodo, log]
  );

  /**
   * Save todo changes from detail view.
   */
  const handleSave = useCallback(
    async (id: string, text: string, notes: string) => {
      setIsSaving(true);
      try {
        await updateTodo({ id, text, notes: notes || "" });
      } catch (err) {
        log.error("Failed to save todo", { id, error: String(err) });
        setIsSaving(false);
      }
    },
    [updateTodo, log]
  );

  /**
   * Go back to list view.
   */
  const handleBack = useCallback(() => {
    setView("list");
    setSelectedTodo(null);
    setLastSaved(null);
    // Refresh list
    listTodos();
  }, [listTodos]);

  /**
   * Search todos.
   */
  const handleSearch = useCallback(
    async (query: string) => {
      log.info("Searching todos", { query });
      setIsSearchMode(true);
      try {
        await searchTodos({ query });
      } catch (err) {
        log.error("Failed to search todos", { query, error: String(err) });
      }
    },
    [searchTodos, log]
  );

  /**
   * Clear search.
   */
  const handleClearSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults(null);
  }, []);

  // Show loading until ready
  if (!isReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Detail view
  if (view === "detail" && selectedTodo) {
    return (
      <DetailView
        todo={selectedTodo}
        onSave={handleSave}
        onToggle={handleToggle}
        onBack={handleBack}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
    );
  }

  // List view
  const completedCount = todos.filter((t) => t.completed).length;
  const displayTodos = isSearchMode && searchResults
    ? searchResults.matches.map((m) => ({
        id: m.id,
        text: m.text,
        completed: m.completed,
        createdAt: "",
        updatedAt: "",
      }))
    : todos;

  return (
    <div className="container">
      <header className="header">
        <h1>Todo List</h1>
        <span className="count">
          {isSearchMode && searchResults
            ? `${searchResults.matches.length} found`
            : todos.length === 0
              ? "No items"
              : `${completedCount}/${todos.length} done`}
        </span>
      </header>

      <AddTodoForm onAdd={handleAdd} />

      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isSearching={searchState.status === "loading"}
      />

      {isSearchMode && searchResults && searchResults.matches.length === 0 ? (
        <div className="todo-list">
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>No results for "{searchResults.query}"</span>
          </div>
        </div>
      ) : (
        <TodoList
          todos={displayTodos}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onOpen={handleOpen}
        />
      )}

      {hostEnvironment === "standalone" && (
        <div className="environment-badge" title="Running outside a host environment">
          {getEnvironmentLabel(hostEnvironment)}
        </div>
      )}
    </div>
  );
}

/**
 * MCP Todos UI
 *
 * A clean, interactive todo list demonstrating MCP Apps SDK patterns.
 *
 * Features:
 * - Add, toggle, and delete todos
 * - Persists via tool calls to the server
 * - Widget state for restoration on refresh/popout
 *
 * SDK hooks used:
 * - useToolResult: Receive todo data from tool calls
 * - useHost: Connect to host, call tools, and persist widget state
 * - initStyles: Inject environment-specific CSS variable defaults
 */

// MUST be first - injects environment-specific CSS variable defaults before CSS loads
import { detectEnvironment, initStyles } from "@creature-ai/sdk/core";
initStyles({ environment: detectEnvironment() });

import { useEffect, useCallback, useState, useRef, type FormEvent } from "react";
import { useHost, useToolResult } from "@creature-ai/sdk/react";
import "./styles.css";

// =============================================================================
// Types
// =============================================================================

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tool result data structure.
 * Tools return this shape with the current todos list.
 */
interface TodoData {
  todos: Todo[];
  success?: boolean;
  todo?: Todo;
  error?: string;
}

/**
 * Widget state structure following MCP Apps spec.
 * - modelContent: Concise summary for the agent (not the full list)
 * - privateContent: UI-only data for restoration (not sent to AI)
 */
interface TodoWidgetState {
  modelContent: {
    countTotal: number;
    countIncomplete: number;
  };
  privateContent: {
    todos: Todo[];
    lastViewedAt: string | null;
  };
}

// =============================================================================
// Components
// =============================================================================

/**
 * Single todo item component with checkbox and delete button.
 */
function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: ({ id }: { id: string }) => void;
  onDelete: ({ id }: { id: string }) => void;
}) {
  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-checkbox" onClick={() => onToggle({ id: todo.id })}>
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="todo-text">{todo.text}</span>
      <button
        className="todo-delete"
        onClick={() => onDelete({ id: todo.id })}
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
}: {
  todos: Todo[];
  onToggle: ({ id }: { id: string }) => void;
  onDelete: ({ id }: { id: string }) => void;
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
        />
      ))}
    </div>
  );
}

/**
 * Form component for adding new todos.
 */
function AddTodoForm({ onAdd }: { onAdd: ({ text }: { text: string }) => Promise<void> }) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!text.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onAdd({ text: text.trim() });
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
      />
      <button type="submit" disabled={isSubmitting || !text.trim()}>
        Add
      </button>
    </form>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main todo list page component.
 *
 * Uses the MCP Apps SDK hooks:
 * - useToolResult: Receive data from tool calls
 * - useHost: Connect to host, call tools, log messages, and persist widget state
 */
export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { data, onToolResult } = useToolResult<TodoData>();
  const hasLoggedReady = useRef(false);

  /**
   * Connect to host and get widget state for persistence.
   * widgetState is restored by the host on PIP refresh/popout.
   * setWidgetState persists data and notifies the host.
   */
  const { callTool, isReady, log, widgetState, setWidgetState } = useHost({
    name: "mcp-template-todos",
    version: "0.1.0",
    onToolResult,
  });

  // Cast widget state to our expected type
  const typedWidgetState = widgetState as TodoWidgetState | null;

  /**
   * Log when connection is ready.
   */
  useEffect(() => {
    if (isReady && !hasLoggedReady.current) {
      hasLoggedReady.current = true;
      log.info("Todo list connected");
    }
  }, [isReady, log]);

  /**
   * Restore todos from widget state on initial load.
   * The Host persists widget state and restores it when the pip reopens.
   * Todos are stored in privateContent (not visible to AI).
   */
  useEffect(() => {
    const savedTodos = typedWidgetState?.privateContent?.todos;
    if (savedTodos && savedTodos.length > 0 && todos.length === 0) {
      log.debug("Restoring todos from widget state", { count: savedTodos.length });
      setTodos(savedTodos);
    }
  }, [typedWidgetState, todos.length, log]);

  /**
   * Handle tool result data updates.
   * Updates local state and persists to widget state.
   */
  useEffect(() => {
    if (data?.todos) {
      setTodos(data.todos);
      log.debug("Todos updated", { count: data.todos.length });

      // Persist to widget state
      // modelContent: concise summary for the agent
      // privateContent: full todos list for UI restoration
      const incompleteCount = data.todos.filter((t) => !t.completed).length;
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
  }, [data, log, setWidgetState]);

  /**
   * Fetch initial todos when host connection is ready.
   */
  useEffect(() => {
    if (isReady) {
      log.debug("Fetching initial todos");
      callTool("todo", { action: "list" });
    }
  }, [isReady, callTool, log]);

  /**
   * Add a new todo item.
   */
  const handleAdd = useCallback(
    async ({ text }: { text: string }) => {
      log.info("Adding todo", { text });
      try {
        await callTool("todo", { action: "add", text });
      } catch (err) {
        log.error("Failed to add todo", { error: String(err) });
      }
    },
    [callTool, log]
  );

  /**
   * Toggle a todo's completed status.
   */
  const handleToggle = useCallback(
    async ({ id }: { id: string }) => {
      try {
        await callTool("todo", { action: "toggle", id });
      } catch (err) {
        log.error("Failed to toggle todo", { id, error: String(err) });
      }
    },
    [callTool, log]
  );

  /**
   * Delete a todo item.
   */
  const handleDelete = useCallback(
    async ({ id }: { id: string }) => {
      log.info("Deleting todo", { id });
      try {
        await callTool("todo", { action: "remove", id });
      } catch (err) {
        log.error("Failed to delete todo", { id, error: String(err) });
      }
    },
    [callTool, log]
  );

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="container">
      <header className="header">
        <h1>Todo List</h1>
        <span className="count">
          {todos.length === 0
            ? "No items"
            : `${completedCount}/${todos.length} done`}
        </span>
      </header>

      <AddTodoForm onAdd={handleAdd} />

      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}

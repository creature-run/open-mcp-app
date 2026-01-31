/**
 * MCP Todos UI
 *
 * A clean, interactive todo list demonstrating cross-platform MCP Apps.
 *
 * Cross-Platform Compatibility:
 * - Works in Creature (MCP Apps host)
 * - Works in ChatGPT Apps
 * - Works in any generic MCP Apps host
 *
 * Features:
 * - Add, toggle, and delete todos
 * - Persists via tool calls to the server
 * - Widget state for restoration on refresh/popout
 *
 * Tools (separate tools for each action):
 * - todos_list: List all todos
 * - todos_add: Add a new todo
 * - todos_toggle: Toggle completion status
 * - todos_remove: Delete a todo
 *
 * SDK hooks used:
 * - HostProvider: Provides host client to child components via context
 * - useHost: Access callTool, isReady, log, etc. from context
 * - exp_widgetState: Persist UI state across sessions
 * - initDefaultStyles: Inject environment-specific CSS variable defaults
 *
 * The SDK automatically detects the host environment and provides a unified
 * API that works across all platforms. Environment-specific features like
 * logging to DevConsole (Creature) gracefully degrade on other hosts.
 */

// MUST be first - injects environment-specific CSS variable defaults before CSS loads
import { detectEnvironment, initDefaultStyles } from "open-mcp-app/core";
const environment = detectEnvironment();
initDefaultStyles({ environment });

import { useEffect, useCallback, useState, useRef, type FormEvent } from "react";
import { HostProvider, useHost, type Environment } from "open-mcp-app/react";
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
 * All batch operations include the full todos array for UI sync.
 */
interface TodoData {
  todos: Todo[];
  success?: boolean;
  error?: string;
  added?: Todo[];
  toggled?: Todo[];
  deleted?: { id: string; text: string }[];
  notFound?: string[];
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
 * Get a human-readable label for the environment.
 */
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

/**
 * Main todo list app entry point.
 *
 * Uses the MCP Apps SDK with HostProvider pattern:
 * - HostProvider: Wraps the app to provide host client via context
 * - useHost: Access callTool, isReady, log, exp_widgetState from context
 *
 * The component works identically across all supported hosts:
 * - Creature (MCP Apps): Full feature support including DevConsole logging
 * - ChatGPT Apps: Core features work, logging falls back to console
 * - Standalone: For development/testing outside a host
 */
export default function App() {
  return (
    <HostProvider name="mcp-template-todos" version="0.1.0">
      <TodoApp />
    </HostProvider>
  );
}

/**
 * Inner todo app component that uses useHost() with HostProvider.
 */
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const hasInitialized = useRef(false);
  const hasRestoredState = useRef(false);

  // Get host from context (HostProvider)
  const { callTool, isReady, log, exp, exp_widgetState, onToolResult, environment: hostEnvironment } = useHost();

  // Get widget state tuple for reading and updating
  const [widgetState, setWidgetState] = exp_widgetState<TodoWidgetState>();

  // Separate tool callers for each action
  const [listTodos, listState] = callTool<TodoData>("todos_list");
  const [addTodo, addState] = callTool<TodoData>("todos_add");
  const [toggleTodo, toggleState] = callTool<TodoData>("todos_toggle");
  const [removeTodo, removeState] = callTool<TodoData>("todos_remove");

  /**
   * Restore todos from widget state on mount (before initialization completes).
   * Shows previous state immediately while fresh data loads.
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
   * Helper to update todos from any tool result data.
   */
  const updateTodosFromData = useCallback(
    (data: TodoData | null) => {
      if (data?.todos) {
        setTodos(data.todos);
        log.debug("Todos updated", { count: data.todos.length });

        // Persist to widget state
        // modelContent: concise summary for the agent
        // privateContent: full todos list for UI restoration
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
    },
    [log, setWidgetState]
  );

  // Update todos when UI-initiated tool calls return data
  useEffect(() => updateTodosFromData(listState.data), [listState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(addState.data), [addState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(toggleState.data), [toggleState.data, updateTodosFromData]);
  useEffect(() => updateTodosFromData(removeState.data), [removeState.data, updateTodosFromData]);

  /**
   * Subscribe to agent-initiated tool calls.
   * When the agent calls a tool (not the UI), we receive a tool-result notification.
   * Filter by source === "agent" to avoid duplicate updates from UI calls.
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
   *
   * Uses getInitialToolResult() to determine how the view was opened:
   * - If it returns data: Agent opened this view with a tool call - use that data
   * - If it returns null: User opened this view directly - fetch the list
   */
  useEffect(() => {
    if (!isReady || hasInitialized.current) return;
    hasInitialized.current = true;

    log.info("Todo list connected", { environment: hostEnvironment });

    const initialResult = exp.getInitialToolResult();
    if (initialResult) {
      // View was opened by agent tool call - use the result data
      log.debug("Initialized from agent tool result");
      updateTodosFromData(initialResult.structuredContent as unknown as TodoData);
    } else {
      // View was opened by user - fetch initial list
      log.debug("Initialized by user - fetching list");
      listTodos();
    }
  }, [isReady, exp, log, hostEnvironment, updateTodosFromData, listTodos]);

  /**
   * Add a new todo item.
   */
  const handleAdd = useCallback(
    async ({ text }: { text: string }) => {
      log.info("Adding todo", { text });
      try {
        await addTodo({ items: [text] });
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
    async ({ id }: { id: string }) => {
      try {
        await toggleTodo({ ids: [id] });
      } catch (err) {
        log.error("Failed to toggle todo", { id, error: String(err) });
      }
    },
    [toggleTodo, log]
  );

  /**
   * Delete a todo item.
   */
  const handleDelete = useCallback(
    async ({ id }: { id: string }) => {
      log.info("Deleting todo", { id });
      try {
        await removeTodo({ ids: [id] });
      } catch (err) {
        log.error("Failed to delete todo", { id, error: String(err) });
      }
    },
    [removeTodo, log]
  );

  const completedCount = todos.filter((t) => t.completed).length;

  // Show loading spinner until host is ready
  if (!isReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

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

      {/* Environment indicator - useful for development/debugging */}
      {hostEnvironment === "standalone" && (
        <div className="environment-badge" title="Running outside a host environment">
          {getEnvironmentLabel(hostEnvironment)}
        </div>
      )}
    </div>
  );
}

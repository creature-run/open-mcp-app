/**
 * Editor — Markdown + rich text editor.
 *
 * Built on Milkdown (ProseMirror + Remark) for markdown-first editing
 * with perfect round-trip fidelity. Supports WYSIWYG, raw markdown,
 * and raw markdown editing modes.
 *
 * Styled exclusively with MCP Apps spec CSS variables. All typography,
 * colors, borders, and spacing use the host's theme tokens.
 *
 * Imported separately from the core library to keep apps that don't
 * need it from paying any bundle cost:
 *
 *   import { Editor } from "open-mcp-app-ui/editor";
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
} from "react";
import {
  Editor as MilkdownEditor,
  rootCtx,
  defaultValueCtx,
  commandsCtx,
} from "@milkdown/kit/core";
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  toggleInlineCodeCommand,
  createCodeBlockCommand,
  wrapInBlockquoteCommand,
  toggleLinkCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  gfm,
  toggleStrikethroughCommand,
} from "@milkdown/kit/preset/gfm";
import {
  history,
  undoCommand,
  redoCommand,
} from "@milkdown/kit/plugin/history";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { replaceAll } from "@milkdown/utils";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available toolbar action items. */
export type ToolbarItem =
  | "bold"
  | "italic"
  | "strikethrough"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "code"
  | "codeBlock"
  | "blockquote"
  | "link"
  | "divider"
  | "undo"
  | "redo";

/** Editing mode. */
export type EditorMode = "wysiwyg" | "markdown";

export interface EditorProps {
  /** Markdown string (source of truth). */
  value?: string;
  /** Called when content changes. Receives the updated markdown string. */
  onChange?: (markdown: string) => void;
  /**
   * Editing mode:
   * - "wysiwyg" — Rich text rendering with formatting (default)
   * - "markdown" — Raw markdown text editing
   *
   * Omit to show a mode toggle in the toolbar so users can switch freely.
   */
  mode?: EditorMode;
  /** Placeholder text when the editor is empty. */
  placeholder?: string;
  /**
   * Toolbar buttons to show, or `false` to hide the toolbar entirely.
   * Defaults to a sensible set of common formatting actions.
   */
  toolbar?: ToolbarItem[] | false;
  /** View-only mode. Renders markdown as styled content without editing. */
  readOnly?: boolean;
  /**
   * Show a border and rounded corners around the editor.
   * - false (default) — no border, sits flat within its container
   * - true / "default" — uses --color-border-primary (stronger)
   * - "secondary" — uses --color-border-secondary (subtler)
   */
  bordered?: boolean | "default" | "secondary";
  /** Minimum editor height in pixels. */
  minHeight?: number;
  /** Maximum editor height in pixels before scrolling. */
  maxHeight?: number;
  /** Focus the editor on mount. */
  autoFocus?: boolean;
  /** Additional CSS classes on the outermost wrapper. */
  className?: string;
}

export interface EditorRef {
  /** Get the current markdown content. */
  getMarkdown: () => string;
  /** Imperatively set editor content without triggering onChange. */
  setMarkdown: (markdown: string) => void;
  /** Focus the editor. */
  focus: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  "bold",
  "italic",
  "strikethrough",
  "divider",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "divider",
  "code",
  "codeBlock",
  "blockquote",
  "link",
  "divider",
  "undo",
  "redo",
];

/**
 * Markdown syntax inserted when a toolbar button is clicked in raw mode.
 * In WYSIWYG mode, Milkdown commands handle formatting instead.
 */
const TOOLBAR_MARKDOWN: Record<Exclude<ToolbarItem, "divider">, string> = {
  bold: "**bold**",
  italic: "*italic*",
  strikethrough: "~~strikethrough~~",
  heading: "## ",
  bulletList: "- ",
  orderedList: "1. ",
  taskList: "- [ ] ",
  code: "`code`",
  codeBlock: "```\n\n```",
  blockquote: "> ",
  link: "[text](url)",
  undo: "",
  redo: "",
};

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

/**
 * Icon components for toolbar buttons.
 * Minimal SVG icons sized at 16x16, using currentColor for theme awareness.
 */
const ToolbarIcons: Record<Exclude<ToolbarItem, "divider">, () => React.ReactElement> = {
  bold: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  strikethrough: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-3 3c0 2 1.5 3 3 3h6" /><line x1="4" y1="12" x2="20" y2="12" /><path d="M15 12c1.5 0 3 1 3 3a3 3 0 0 1-3 3H8" />
    </svg>
  ),
  heading: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16" /><path d="M18 4v16" /><path d="M6 12h12" />
    </svg>
  ),
  bulletList: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
      <text x="3" y="7" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
      <text x="3" y="13" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
      <text x="3" y="19" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
    </svg>
  ),
  taskList: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" /><path d="M5 8l1.5 1.5L9 7" /><line x1="13" y1="8" x2="21" y2="8" />
      <rect x="3" y="14" width="6" height="6" rx="1" /><line x1="13" y1="17" x2="21" y2="17" />
    </svg>
  ),
  code: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  codeBlock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><polyline points="9 8 5 12 9 16" /><polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  blockquote: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 8V6a6 6 0 0 0-6 6v4h4v-4H6a4 4 0 0 1 4-4zm10 0V6a6 6 0 0 0-6 6v4h4v-4h-2a4 4 0 0 1 4-4z" />
    </svg>
  ),
  link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  undo: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  redo: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

/**
 * Toolbar button labels for accessibility and tooltips.
 */
const TOOLBAR_LABELS: Record<Exclude<ToolbarItem, "divider">, string> = {
  bold: "Bold",
  italic: "Italic",
  strikethrough: "Strikethrough",
  heading: "Heading",
  bulletList: "Bullet List",
  orderedList: "Ordered List",
  taskList: "Task List",
  code: "Inline Code",
  codeBlock: "Code Block",
  blockquote: "Blockquote",
  link: "Link",
  undo: "Undo",
  redo: "Redo",
};

/**
 * Toolbar component rendered above the editor.
 * Provides formatting action buttons styled with spec CSS variables.
 */
const EditorToolbar = ({
  items,
  onAction,
}: {
  items: ToolbarItem[];
  onAction: (item: ToolbarItem) => void;
}) => (
  <div className="omu-editor-toolbar flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
    {items.map((item, i) => {
      if (item === "divider") {
        return (
          <div
            key={`divider-${i}`}
            className="w-px h-4 bg-bdr-secondary mx-1 shrink-0"
          />
        );
      }

      const Icon = ToolbarIcons[item];
      const label = TOOLBAR_LABELS[item];

      return (
        <button
          key={item}
          type="button"
          className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-txt-secondary hover:text-txt-primary hover:bg-bg-tertiary transition-colors shrink-0 cursor-pointer"
          onMouseDown={(e) => {
            /**
             * Prevent the button from stealing focus from the ProseMirror editor.
             * Without this, clicking a toolbar button blurs the editor, causing
             * toggle/wrap commands to fail silently (no selection to act on).
             */
            e.preventDefault();
          }}
          onClick={() => onAction(item)}
          title={label}
          aria-label={label}
        >
          <Icon />
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Mode Toggle
// ---------------------------------------------------------------------------

/**
 * Mode toggle buttons shown at the right of the toolbar.
 * Allows switching between wysiwyg and markdown modes.
 */
const ModeToggle = ({
  mode,
  onModeChange,
}: {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}) => {
  const modes: { value: EditorMode; label: string }[] = [
    { value: "wysiwyg", label: "Rich" },
    { value: "markdown", label: "MD" },
  ];

  return (
    <div className="flex items-center gap-0.5 ml-auto pl-2 pr-2">
      {modes.map((m) => (
        <button
          key={m.value}
          type="button"
          className={[
            "px-2 py-0.5 rounded-sm text-xs font-medium transition-colors cursor-pointer",
            mode === m.value
              ? "bg-bg-tertiary text-txt-primary"
              : "text-txt-tertiary hover:text-txt-secondary hover:bg-bg-tertiary",
          ].join(" ")}
          onClick={() => onModeChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Milkdown actions ref type
// ---------------------------------------------------------------------------

interface MilkdownActions {
  getMarkdown: () => string;
  setMarkdown: (md: string) => void;
  runCommand: (key: unknown, payload?: unknown) => boolean;
  focus: () => void;
}

// ---------------------------------------------------------------------------
// Milkdown WYSIWYG Editor (inner component)
// ---------------------------------------------------------------------------

interface MilkdownInnerProps {
  defaultValue: string;
  onChange: (markdown: string) => void;
  readOnly: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Ref for skipping onChange on imperative updates */
  skipRef: React.MutableRefObject<boolean>;
  /** Ref to expose editor actions to parent */
  actionsRef: React.MutableRefObject<MilkdownActions | null>;
}

/**
 * Inner Milkdown component that must render inside MilkdownProvider.
 * Handles the actual editor setup with plugins and listeners.
 *
 * Exposes a command runner so toolbar buttons can call real
 * ProseMirror/Milkdown commands (bold, italic, heading, etc.)
 * instead of inserting raw markdown text.
 */
const MilkdownInner = ({
  defaultValue,
  onChange,
  readOnly,
  placeholder,
  autoFocus,
  skipRef,
  actionsRef,
}: MilkdownInnerProps) => {
  const contentRef = useRef(defaultValue);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { get } = useEditor((root) =>
    MilkdownEditor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, defaultValue);
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          contentRef.current = markdown;
          if (skipRef.current) {
            skipRef.current = false;
            return;
          }
          onChange(markdown);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener)
  );

  /**
   * Expose actions to parent via ref.
   * Includes a runCommand method that executes Milkdown commands
   * (e.g. toggle bold, create heading) through the commandManager.
   */
  useEffect(() => {
    actionsRef.current = {
      getMarkdown: () => contentRef.current,

      setMarkdown: (md: string) => {
        const editor = get();
        if (!editor) return;
        try {
          skipRef.current = true;
          editor.action(replaceAll(md));
          contentRef.current = md;
        } catch (e) {
          skipRef.current = false;
          console.warn("[Editor] setMarkdown failed:", e);
        }
      },

      /**
       * Execute a Milkdown command by its key.
       * This is how toolbar buttons apply formatting — they call
       * real ProseMirror commands through Milkdown's command manager,
       * which toggles marks/wraps on the current selection.
       */
      runCommand: (key: unknown, payload?: unknown) => {
        const editor = get();
        if (!editor) return false;
        try {
          editor.action((ctx) => {
            const commands = ctx.get(commandsCtx);
            commands.call(key as any, payload);
          });
          return true;
        } catch (e) {
          console.warn("[Editor] Command failed:", e);
          return false;
        }
      },

      focus: () => {
        const el = wrapperRef.current?.querySelector(".ProseMirror");
        if (el instanceof HTMLElement) el.focus();
      },
    };
  }, [get, skipRef, actionsRef]);

  /**
   * Set the data-placeholder attribute on the ProseMirror element
   * so the CSS ::before pseudo-element can show placeholder text.
   */
  useEffect(() => {
    if (!placeholder) return;
    const trySet = () => {
      const el = wrapperRef.current?.querySelector(".ProseMirror");
      if (el) {
        el.setAttribute("data-placeholder", placeholder);
      }
    };
    trySet();
    /* Milkdown may render async, retry after a tick */
    const t = setTimeout(trySet, 100);
    return () => clearTimeout(t);
  }, [placeholder]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        const el = wrapperRef.current?.querySelector(".ProseMirror");
        if (el instanceof HTMLElement) el.focus();
      });
    }
  }, [autoFocus]);

  /**
   * Handle clicks on the wrapper to focus the editor.
   * Allows clicking empty space below content to start editing.
   */
  const handleWrapperClick = useCallback(() => {
    const el = wrapperRef.current?.querySelector(".ProseMirror");
    if (el instanceof HTMLElement) el.focus();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="omu-editor-content flex-1 overflow-y-auto px-4 py-3 flex flex-col min-h-0 cursor-text"
      data-placeholder={placeholder}
      data-readonly={readOnly || undefined}
      onClick={readOnly ? undefined : handleWrapperClick}
    >
      <Milkdown />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Raw Markdown Editor
// ---------------------------------------------------------------------------

/**
 * Simple textarea for raw markdown editing.
 * Provides a monospace code-editing experience.
 */
const MarkdownTextarea = ({
  value,
  onChange,
  readOnly,
  placeholder,
  autoFocus,
  minHeight,
  maxHeight,
}: {
  value: string;
  onChange: (markdown: string) => void;
  readOnly: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
}) => (
  <textarea
    className={[
      "omu-editor-textarea flex-1 w-full px-4 py-3 resize-none",
      "bg-bg-primary text-txt-primary font-mono text-sm",
      "outline-none border-none",
      "placeholder:text-txt-tertiary",
    ].join(" ")}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    readOnly={readOnly}
    placeholder={placeholder}
    autoFocus={autoFocus}
    style={{
      minHeight: minHeight ? `${minHeight}px` : undefined,
      maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    }}
    spellCheck={false}
  />
);

// ---------------------------------------------------------------------------
// Editor (Main Export)
// ---------------------------------------------------------------------------

/**
 * Markdown + rich text editor with toolbar and mode switching.
 *
 * Built on Milkdown (ProseMirror + Remark) for markdown-first editing.
 * Supports WYSIWYG and raw markdown editing modes. Styled with
 * MCP Apps spec CSS variables for automatic host theming.
 *
 * By default the editor has no border or rounded corners so it sits
 * flat inside a containing element. Set `bordered` to add them.
 *
 * @example
 * ```tsx
 * import { Editor } from "open-mcp-app-ui/editor";
 *
 * <Editor
 *   value={markdown}
 *   onChange={setMarkdown}
 *   placeholder="Start writing..."
 * />
 *
 * <Editor value={markdown} onChange={setMarkdown} bordered />
 * ```
 */
export const Editor = forwardRef<EditorRef, EditorProps>(
  (
    {
      value = "",
      onChange,
      mode: modeProp,
      placeholder,
      toolbar: toolbarProp,
      readOnly = false,
      bordered = false,
      minHeight = 120,
      maxHeight,
      autoFocus = false,
      className = "",
    },
    ref
  ) => {
    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    const [internalMode, setInternalMode] = useState<EditorMode>(modeProp ?? "wysiwyg");
    const mode = modeProp ?? internalMode;
    const showModeToggle = modeProp == null;

    /**
     * Internal markdown state used for the raw markdown textarea.
     * The WYSIWYG editor uses Milkdown's internal state; this mirrors
     * it for the markdown pane and is synced on mode switches.
     */
    const [rawValue, setRawValue] = useState(value);

    /**
     * Key counter to force MilkdownProvider remount when switching
     * from markdown-only mode back to WYSIWYG. This ensures the
     * editor initializes with the current rawValue as defaultValue
     * and avoids stale context errors.
     */
    const [milkdownKey, setMilkdownKey] = useState(0);

    const skipRef = useRef(false);
    const actionsRef = useRef<MilkdownActions | null>(null);

    // Sync raw value when external value changes
    useEffect(() => {
      setRawValue(value);
    }, [value]);

    // -----------------------------------------------------------------------
    // Imperative handle
    // -----------------------------------------------------------------------

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (mode === "markdown") return rawValue;
        return actionsRef.current?.getMarkdown() ?? rawValue;
      },
      setMarkdown: (md: string) => {
        setRawValue(md);
        actionsRef.current?.setMarkdown(md);
      },
      focus: () => {
        actionsRef.current?.focus();
      },
    }), [mode, rawValue]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    /** Handle changes from the WYSIWYG editor. */
    const handleWysiwygChange = useCallback(
      (markdown: string) => {
        setRawValue(markdown);
        onChange?.(markdown);
      },
      [onChange]
    );

    /** Handle changes from the raw markdown textarea. */
    const handleRawChange = useCallback(
      (markdown: string) => {
        setRawValue(markdown);
        onChange?.(markdown);
      },
      [onChange]
    );

    /**
     * Handle toolbar button clicks.
     *
     * In WYSIWYG mode, toolbar actions execute real Milkdown
     * commands that toggle marks (bold, italic) or wrap blocks
     * (heading, list, blockquote) on the current selection.
     *
     * In markdown mode, raw syntax is appended as a fallback.
     */
    const handleToolbarAction = useCallback(
      (item: ToolbarItem) => {
        if (item === "divider") return;

        // ----- Markdown mode: insert raw syntax -----
        if (mode === "markdown") {
          const syntax = TOOLBAR_MARKDOWN[item];
          if (syntax) {
            const newValue = rawValue + syntax;
            setRawValue(newValue);
            onChange?.(newValue);
          }
          return;
        }

        // ----- WYSIWYG / split mode: use Milkdown commands -----
        if (!actionsRef.current) return;

        /**
         * Map toolbar items to Milkdown command keys.
         * Each command key is a CmdKey from the respective preset.
         */
        switch (item) {
          case "bold":
            actionsRef.current.runCommand(toggleStrongCommand.key);
            break;
          case "italic":
            actionsRef.current.runCommand(toggleEmphasisCommand.key);
            break;
          case "strikethrough":
            actionsRef.current.runCommand(toggleStrikethroughCommand.key);
            break;
          case "heading": {
            /**
             * Cycle through heading levels: h2 → h3 → h4 → paragraph.
             * Reads the current heading level from the editor and advances
             * to the next, or converts back to a paragraph when at h4.
             * Starts at h2 because h1 is typically reserved for the page title.
             */
            const md = actionsRef.current.getMarkdown();
            const lines = md.split("\n");
            const lastHeadingMatch = lines[lines.length - 1]?.match(/^(#{1,6})\s/);
            const currentLevel = lastHeadingMatch ? lastHeadingMatch[1].length : 0;
            if (currentLevel >= 4 || currentLevel === 0) {
              actionsRef.current.runCommand(wrapInHeadingCommand.key, 2);
            } else {
              actionsRef.current.runCommand(wrapInHeadingCommand.key, currentLevel + 1);
            }
            break;
          }
          case "bulletList":
            actionsRef.current.runCommand(wrapInBulletListCommand.key);
            break;
          case "orderedList":
            actionsRef.current.runCommand(wrapInOrderedListCommand.key);
            break;
          case "taskList": {
            /* No direct Milkdown command for task list; insert markdown */
            const current = actionsRef.current.getMarkdown();
            const suffix = current.endsWith("\n") ? "- [ ] " : "\n- [ ] ";
            actionsRef.current.setMarkdown(current + suffix);
            break;
          }
          case "code":
            actionsRef.current.runCommand(toggleInlineCodeCommand.key);
            break;
          case "codeBlock":
            actionsRef.current.runCommand(createCodeBlockCommand.key);
            break;
          case "blockquote":
            actionsRef.current.runCommand(wrapInBlockquoteCommand.key);
            break;
          case "link": {
            /**
             * Insert a link by toggling the link mark with a placeholder URL.
             * If there's selected text, it wraps it; otherwise inserts a template.
             * Using a placeholder avoids window.prompt which steals focus
             * and breaks the ProseMirror selection.
             */
            actionsRef.current.runCommand(toggleLinkCommand.key, { href: "https://" });
            break;
          }
          case "undo":
            actionsRef.current.runCommand(undoCommand.key);
            break;
          case "redo":
            actionsRef.current.runCommand(redoCommand.key);
            break;
          default:
            break;
        }
      },
      [mode, rawValue, onChange]
    );

    /** Handle mode switching. */
    const handleModeChange = useCallback(
      (newMode: EditorMode) => {
        /**
         * Read the latest content from whichever pane is active before
         * switching. This ensures rawValue is always up to date.
         */
        if (mode === "wysiwyg") {
          const current = actionsRef.current?.getMarkdown() ?? rawValue;
          setRawValue(current);
        }

        setInternalMode(newMode);

        /**
         * Force remount of MilkdownProvider when switching TO WYSIWYG.
         * This recreates Milkdown with the latest rawValue as defaultValue,
         * avoiding stale context and "editorView not found" errors.
         */
        if (newMode === "wysiwyg") {
          setMilkdownKey((k) => k + 1);
        }
      },
      [mode, rawValue]
    );

    // -----------------------------------------------------------------------
    // Toolbar config
    // -----------------------------------------------------------------------

    const toolbarItems = toolbarProp === false ? null : (toolbarProp ?? DEFAULT_TOOLBAR);
    const showToolbar = toolbarItems != null && !readOnly;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const wrapperStyle: CSSProperties = {
      minHeight: `${minHeight}px`,
      ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
    };

    return (
      <div
        className={[
          "omu-editor flex flex-col overflow-hidden",
          "bg-bg-primary text-txt-primary",
          bordered
            ? [
                "rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-ring-primary",
                bordered === "secondary" ? "border border-bdr-secondary" : "border border-bdr-primary",
              ].join(" ")
            : "",
          className,
        ].join(" ")}
        style={wrapperStyle}
      >
        {/* Toolbar */}
        {(showToolbar || showModeToggle) && (
          <div className="flex items-center bg-bg-secondary border-b border-bdr-secondary">
            {showToolbar && (
              <EditorToolbar items={toolbarItems} onAction={handleToolbarAction} />
            )}
            {showModeToggle && !readOnly && (
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
            )}
          </div>
        )}

        {/* Editor content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* WYSIWYG pane */}
          {mode === "wysiwyg" && (
            <div className="flex flex-col flex-1 min-h-0">
              <MilkdownProvider key={milkdownKey}>
                <MilkdownInner
                  defaultValue={rawValue}
                  onChange={handleWysiwygChange}
                  readOnly={readOnly}
                  placeholder={placeholder}
                  autoFocus={autoFocus && mode === "wysiwyg"}
                  skipRef={skipRef}
                  actionsRef={actionsRef}
                />
              </MilkdownProvider>
            </div>
          )}

          {/* Markdown pane */}
          {mode === "markdown" && (
            <div className="flex flex-col flex-1 min-h-0">
              <MarkdownTextarea
                value={rawValue}
                onChange={handleRawChange}
                readOnly={readOnly}
                placeholder={placeholder}
                autoFocus={autoFocus && mode === "markdown"}
                minHeight={minHeight - 40}
                maxHeight={maxHeight ? maxHeight - 40 : undefined}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

Editor.displayName = "Editor";

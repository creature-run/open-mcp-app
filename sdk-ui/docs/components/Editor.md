# Editor

Markdown + rich text editor built on Milkdown (ProseMirror + Remark). Supports WYSIWYG, raw markdown, and split (side-by-side) editing modes. Markdown is the source of truth — perfect round-trip fidelity.

**Separate import** — not part of the core bundle:

```tsx
import { Editor } from "open-mcp-app-ui/editor";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Markdown string (source of truth). |
| onChange | `(markdown: string) => void` | — | Called when content changes. |
| mode | `"wysiwyg" \| "markdown" \| "split"` | `"wysiwyg"` | Editing mode. Omit to show a mode toggle in the toolbar. |
| placeholder | `string` | — | Placeholder text when empty. |
| toolbar | `ToolbarItem[] \| false` | Default set | Toolbar buttons, or `false` to hide. |
| readOnly | `boolean` | `false` | View-only mode (renders styled markdown). |
| bordered | `boolean` | `false` | Add border and rounded corners. When false, the editor sits flat inside its container. |
| minHeight | `number` | `120` | Minimum height in pixels. |
| maxHeight | `number` | — | Maximum height before scrolling. |
| autoFocus | `boolean` | `false` | Focus editor on mount. |
| className | `string` | — | Additional classes on the wrapper. |

## Types

```tsx
type EditorMode = "wysiwyg" | "markdown" | "split";

type ToolbarItem =
  | "bold" | "italic" | "strikethrough"
  | "heading" | "bulletList" | "orderedList" | "taskList"
  | "code" | "codeBlock" | "blockquote" | "link"
  | "divider" | "undo" | "redo";

interface EditorRef {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}
```

## Examples

```tsx
{/* Basic WYSIWYG editor — no border, sits flat in container */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  placeholder="Start writing..."
/>

{/* With border and rounded corners */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  bordered
  placeholder="Standalone editor..."
/>

{/* With mode locked to markdown */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  mode="markdown"
  placeholder="Write markdown..."
/>

{/* Split mode (WYSIWYG + raw markdown side by side) */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  mode="split"
/>

{/* Read-only markdown rendering */}
<Editor
  value={readmeContent}
  readOnly
/>

{/* Custom toolbar */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  toolbar={["bold", "italic", "divider", "heading", "bulletList", "link"]}
/>

{/* No toolbar */}
<Editor
  value={markdown}
  onChange={setMarkdown}
  toolbar={false}
  minHeight={200}
/>

{/* With ref for imperative access */}
const editorRef = useRef<EditorRef>(null);

<Editor
  ref={editorRef}
  value={markdown}
  onChange={setMarkdown}
/>

// Later...
editorRef.current?.setMarkdown("# New content");
const md = editorRef.current?.getMarkdown();
editorRef.current?.focus();
```

## Styling

All visual elements use MCP Apps spec CSS variables:

| Element | Variable |
|---------|----------|
| Editor background | `--color-background-primary` |
| Editor text | `--color-text-primary` |
| Placeholder | `--color-text-tertiary` |
| Border (when `bordered`) | `--color-border-primary` |
| Focus ring (when `bordered`) | `--color-ring-primary` |
| Toolbar background | `--color-background-secondary` |
| Toolbar buttons | `--color-text-secondary` (idle), `--color-text-primary` (hover) |
| Active toolbar button | `--color-background-tertiary` |
| Toolbar divider | `--color-border-secondary` |
| Headings | `--font-heading-*-size`, `--font-weight-semibold` |
| Body text | `--font-text-md-size`, `--font-weight-normal` |
| Code blocks | `--font-mono`, `--color-background-secondary` |
| Inline code | `--font-mono`, `--color-background-secondary` |
| Blockquote border | `--color-border-primary` |
| Links | `--color-text-info` |
| Selection | `--color-background-secondary` |

## Notes

- By default the editor has **no border or rounded corners**, making it easy to embed inside cards or other containers. Set `bordered` to add them.
- Toolbar buttons execute real Milkdown/ProseMirror commands (toggle bold, wrap in heading, etc.) in WYSIWYG mode, not raw text insertion.
- The editor is primarily **uncontrolled** for the WYSIWYG pane to avoid cursor jumps during typing. External updates should use the `EditorRef.setMarkdown()` method.
- When `mode` is omitted, a mode toggle appears in the toolbar letting users switch between Rich/MD/Split.
- The `toolbar` prop accepts an array of items. Use `"divider"` to add visual separators between groups.
- Milkdown packages (`@milkdown/kit`, `@milkdown/react`, etc.) must be available in the app's dependency tree.

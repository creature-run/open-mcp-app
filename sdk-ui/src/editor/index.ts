/**
 * open-mcp-app-ui/editor
 *
 * Markdown + rich text editor built on Milkdown (ProseMirror + Remark).
 * This is an optional import — apps that don't use it pay zero bundle cost.
 *
 * Usage:
 *   import { Editor } from "open-mcp-app-ui/editor";
 *
 *   <Editor
 *     value={markdownString}
 *     onChange={setMarkdownString}
 *     placeholder="Start writing..."
 *   />
 *
 * Supports three editing modes:
 * - "wysiwyg" — Rich text editing (default)
 * - "markdown" — Raw markdown text
 * - "split" — Side-by-side WYSIWYG and markdown
 */

export {
  Editor,
  type EditorProps,
  type EditorRef,
  type EditorMode,
  type ToolbarItem,
} from "./Editor.js";

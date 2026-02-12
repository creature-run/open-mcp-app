/**
 * open-mcp-app-ui/editor
 *
 * Markdown + rich text editor built on Milkdown (ProseMirror + Remark).
 * This is an optional import — apps that don't use it pay zero bundle cost.
 *
 * Phase 2: Placeholder export. Implementation coming soon.
 *
 * Planned usage:
 *   import { Editor } from "open-mcp-app-ui/editor";
 *
 *   <Editor
 *     value={markdownString}
 *     onChange={setMarkdownString}
 *     mode="wysiwyg"
 *     toolbar={["bold", "italic", "heading", "list", "code", "link"]}
 *   />
 */

export const EDITOR_VERSION = "0.0.1";
export const EDITOR_STATUS = "planned" as const;

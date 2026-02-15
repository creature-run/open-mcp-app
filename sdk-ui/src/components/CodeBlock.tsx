/**
 * CodeBlock — Syntax-highlighted code display with copy button.
 *
 * Uses react-syntax-highlighter (PrismLight) for real syntax coloring.
 * Token colors are mapped to MCP Apps spec CSS variables so they adapt
 * to whichever host platform the app runs on.
 *
 * Languages are registered on demand — only the ones imported here are
 * available. The set matches the most common languages for MCP Apps.
 */

import { useState, useCallback } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";

/* Language grammars — tree-shaken to only include what's registered. */
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("diff", diff);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);

/**
 * Custom Prism theme for the always-dark code block.
 *
 * Uses hardcoded light-on-dark colors so the code block renders identically
 * regardless of the host theme or any ancestor dark-panel overrides.
 * Syntax token colors fall back to bright, dark-background-friendly values.
 *
 * The color assignments follow the OpenAI apps-sdk-ui convention:
 *   syntax1 → builtins, functions, class names
 *   syntax2 → keywords, constants, symbols
 *   syntax3 → strings, chars, regex, inserted
 *   syntax4 → properties, variables, tags, types
 *   syntax5 → booleans, numbers, urls
 */
const CODEBLOCK_BG = "#1a1a1a";
const CODEBLOCK_TEXT = "#e5e5e5";
const CODEBLOCK_FONT = "'SF Mono', Monaco, Inconsolata, 'Fira Mono', 'Courier New', monospace";

const theme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: CODEBLOCK_TEXT,
    fontFamily: CODEBLOCK_FONT,
    fontSize: "0.8125em",
    lineHeight: "1.6",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 2,
  },
  'pre[class*="language-"]': {
    color: CODEBLOCK_TEXT,
    fontFamily: CODEBLOCK_FONT,
    fontSize: "0.8125em",
    lineHeight: "1.6",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    tabSize: 2,
    margin: 0,
    padding: "14px 16px",
    overflow: "auto",
    background: "transparent",
  },
  /* Comments — muted on dark bg */
  comment: { color: "var(--codeblock-syntax-comment, #6b7280)" },
  prolog: { color: "var(--codeblock-syntax-comment, #6b7280)" },
  doctype: { color: "var(--codeblock-syntax-comment, #6b7280)" },
  cdata: { color: "var(--codeblock-syntax-comment, #6b7280)" },
  /* Punctuation — subtle on dark bg */
  punctuation: { color: "var(--codeblock-syntax-punctuation, #9ca3af)" },
  operator: { color: "var(--codeblock-syntax-punctuation, #9ca3af)" },
  /* Keywords, constants — pink/red */
  keyword: { color: "var(--codeblock-syntax-2, #f472b6)" },
  constant: { color: "var(--codeblock-syntax-2, #f472b6)" },
  symbol: { color: "var(--codeblock-syntax-2, #f472b6)" },
  deleted: { color: "var(--codeblock-syntax-2, #f472b6)" },
  /* Strings — green */
  string: { color: "var(--codeblock-syntax-3, #86efac)" },
  char: { color: "var(--codeblock-syntax-3, #86efac)" },
  regex: { color: "var(--codeblock-syntax-3, #86efac)" },
  "attr-value": { color: "var(--codeblock-syntax-3, #86efac)" },
  inserted: { color: "var(--codeblock-syntax-3, #86efac)" },
  /* Properties, tags, variables — orange */
  property: { color: "var(--codeblock-syntax-4, #fdba74)" },
  variable: { color: "var(--codeblock-syntax-4, #fdba74)" },
  "attr-name": { color: "var(--codeblock-syntax-4, #fdba74)" },
  tag: { color: "var(--codeblock-syntax-4, #fdba74)" },
  selector: { color: "var(--codeblock-syntax-4, #fdba74)" },
  /* Functions, builtins, class names — purple */
  builtin: { color: "var(--codeblock-syntax-1, #c084fc)" },
  function: { color: "var(--codeblock-syntax-1, #c084fc)" },
  "class-name": { color: "var(--codeblock-syntax-1, #c084fc)" },
  /* Booleans, numbers — blue */
  boolean: { color: "var(--codeblock-syntax-5, #93c5fd)" },
  number: { color: "var(--codeblock-syntax-5, #93c5fd)" },
  important: { color: "var(--codeblock-syntax-5, #93c5fd)" },
};

// =============================================================================
// Component
// =============================================================================

export interface CodeBlockProps {
  /** Code content to display. */
  children: string;
  /** Language for syntax highlighting (e.g. "tsx", "python", "bash"). */
  language?: string;
  /** Show a copy button. */
  copyable?: boolean;
  /** Show line numbers. */
  showLineNumbers?: boolean;
  /** Additional CSS class for the outer container. */
  className?: string;
}

/**
 * Syntax-highlighted code block with copy functionality.
 *
 * @example
 * ```tsx
 * <CodeBlock language="bash">{`npm install open-mcp-app-ui`}</CodeBlock>
 * <CodeBlock language="tsx" showLineNumbers>{someCode}</CodeBlock>
 * ```
 */
export const CodeBlock = ({
  children,
  language,
  copyable = true,
  showLineNumbers = false,
  className = "",
}: CodeBlockProps) => {
  return (
    <div
      className={[
        "omu-codeblock relative rounded-lg overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: CODEBLOCK_BG, color: CODEBLOCK_TEXT }}
    >
      {/* Header bar with language label and copy button */}
      {(language || copyable) && (
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="text-xs font-medium select-none" style={{ color: CODEBLOCK_TEXT, opacity: 0.5 }}>
            {language ?? ""}
          </span>
          {copyable && <CopyButton text={children} />}
        </div>
      )}

      {/* Syntax-highlighted code */}
      <SyntaxHighlighter
        language={language ?? "text"}
        style={theme}
        showLineNumbers={showLineNumbers}
        lineNumberStyle={{
          color: CODEBLOCK_TEXT,
          opacity: 0.3,
          fontSize: "0.75em",
          paddingRight: "1em",
          userSelect: "none",
          minWidth: "2em",
          textAlign: "right",
        }}
        customStyle={{
          margin: 0,
          background: "transparent",
        }}
        codeTagProps={{
          style: {
            fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Mono', 'Courier New', monospace",
          },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// =============================================================================
// Copy Button (internal)
// =============================================================================

/**
 * Small copy button used inside the CodeBlock header.
 */
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard not available — degrade silently */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-opacity cursor-pointer"
      style={{ color: CODEBLOCK_TEXT, opacity: copied ? 1 : 0.6 }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.opacity = "0.6"; }}
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copied</span>
        </>
      ) : (
        <>
          <CopyIcon />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

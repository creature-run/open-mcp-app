/**
 * Heading — Semantic heading element.
 *
 * Renders an h1–h6 tag with spec-compliant font sizes and weights.
 * Uses the SDK's heading-* utility classes that map to spec variables.
 */

import { type ReactNode, type HTMLAttributes, createElement } from "react";

/** Available heading sizes matching the MCP Apps spec heading scale. */
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * HTML heading level (1–6).
   * Determines the semantic tag: 1 → h1, 2 → h2, etc.
   * Defaults to 2.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Visual size independent of semantic level.
   * Maps to the SDK's heading-* utility classes which reference
   * --font-heading-*-size and --font-heading-*-line-height variables.
   */
  size?: HeadingSize;
  /** Heading text content. */
  children: ReactNode;
}

/**
 * Tailwind utility classes for each heading size.
 * These are defined in the SDK's utilities.css and reference spec variables.
 */
const sizeClasses: Record<HeadingSize, string> = {
  xs: "heading-xs",
  sm: "heading-sm",
  md: "heading-md",
  lg: "heading-lg",
  xl: "heading-xl",
  "2xl": "heading-2xl",
  "3xl": "heading-3xl",
};

/**
 * Semantic heading with spec-driven typography.
 *
 * @example
 * ```tsx
 * <Heading level={1} size="2xl">Page Title</Heading>
 * <Heading level={2} size="lg">Section</Heading>
 * <Heading size="sm">Subsection</Heading>
 * ```
 */
export const Heading = ({
  level = 2,
  size = "md",
  children,
  className = "",
  ...rest
}: HeadingProps) => {
  const tag = `h${level}` as const;

  const classes = [
    "text-txt-primary",
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(tag, { className: classes, ...rest }, children);
};

/**
 * Text — Body text wrapper.
 *
 * Renders a paragraph with spec-driven color and size.
 * Provides semantic variants for primary, secondary, and tertiary text.
 */

import { type ReactNode, type HTMLAttributes } from "react";
import type { Size } from "../types.js";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Text color variant mapping to spec text color groups. */
  variant?: "primary" | "secondary" | "tertiary";
  /**
   * Text size. Maps to spec font-text-* variables:
   * sm → --font-text-sm-size, md → --font-text-md-size, lg → --font-text-lg-size
   */
  size?: Size;
  /**
   * HTML element to render.
   * Defaults to "p". Use "span" for inline text.
   */
  as?: "p" | "span" | "div";
  /** Text content. */
  children: ReactNode;
}

const variantClasses: Record<NonNullable<TextProps["variant"]>, string> = {
  primary: "text-txt-primary",
  secondary: "text-txt-secondary",
  tertiary: "text-txt-tertiary",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/**
 * Body text with semantic color variants.
 *
 * @example
 * ```tsx
 * <Text>Primary body text</Text>
 * <Text variant="secondary" size="sm">Helper description</Text>
 * <Text variant="tertiary" as="span">Timestamp</Text>
 * ```
 */
export const Text = ({
  variant = "primary",
  size = "md",
  as: Component = "p",
  children,
  className = "",
  ...rest
}: TextProps) => {
  const classes = [
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
};

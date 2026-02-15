/**
 * Badge — Small status indicator.
 *
 * Compact inline label for statuses, counts, or tags.
 * Styled with spec CSS variables for each semantic variant.
 */

import { type ReactNode, type HTMLAttributes } from "react";
import type { SemanticVariant } from "../types.js";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color variant. */
  variant?: SemanticVariant | "secondary";
  /** Badge content (text, number, or icon). */
  children: ReactNode;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  info: "bg-bg-info text-txt-info",
  danger: "bg-bg-danger text-txt-danger",
  success: "bg-bg-success text-txt-success",
  warning: "bg-bg-warning text-txt-warning",
  secondary: "bg-bg-secondary text-txt-secondary",
};

/**
 * Compact status indicator.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">3 errors</Badge>
 * <Badge variant="secondary">Draft</Badge>
 * ```
 */
export const Badge = ({
  variant = "secondary",
  children,
  className = "",
  ...rest
}: BadgeProps) => {
  const classes = [
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};

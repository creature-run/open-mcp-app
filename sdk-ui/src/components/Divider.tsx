/**
 * Divider — Horizontal rule.
 *
 * A simple separator using the spec's border colors.
 * Defaults to primary border with configurable spacing.
 */

import { type HTMLAttributes } from "react";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Vertical spacing above and below. */
  spacing?: "none" | "sm" | "md" | "lg";
  /**
   * Border color variant.
   * - "default" — uses --color-border-primary (stronger)
   * - "secondary" — uses --color-border-secondary (subtler)
   * Defaults to "default".
   */
  variant?: "default" | "secondary";
}

const spacingClasses: Record<NonNullable<DividerProps["spacing"]>, string> = {
  none: "",
  sm: "my-2",
  md: "my-3",
  lg: "my-4",
};

/**
 * Horizontal separator line.
 *
 * @example
 * ```tsx
 * <Heading size="md">Section A</Heading>
 * <Divider spacing="md" />
 * <Heading size="md">Section B</Heading>
 * ```
 */
export const Divider = ({
  spacing = "md",
  variant = "default",
  className = "",
  ...rest
}: DividerProps) => {
  const classes = [
    "border-0 border-t",
    variant === "secondary" ? "border-bdr-secondary" : "border-bdr-primary",
    spacingClasses[spacing],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <hr className={classes} {...rest} />;
};

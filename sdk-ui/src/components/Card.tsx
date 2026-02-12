/**
 * Card — Content container.
 *
 * A bordered surface for grouping related content.
 * Uses spec background, border, and shadow variables.
 */

import { type ReactNode, type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style. "default" has border+shadow, "ghost" is borderless. */
  variant?: "default" | "ghost";
  /** Internal padding. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Card content. */
  children: ReactNode;
}

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

/**
 * Content container with border and shadow.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Heading size="sm">Settings</Heading>
 *   <Input label="Name" />
 * </Card>
 *
 * <Card variant="ghost" padding="none">
 *   <Text variant="secondary">Borderless card</Text>
 * </Card>
 * ```
 */
export const Card = ({
  variant = "default",
  padding = "md",
  children,
  className = "",
  ...rest
}: CardProps) => {
  const classes = [
    "rounded-lg",
    variant === "default"
      ? "bg-bg-primary"
      : "bg-bg-ghost",
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={
        variant === "default"
          ? { boxShadow: "inset 0 0 0 1px var(--color-border-primary, rgba(0,0,0,0.08)), 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  );
};
